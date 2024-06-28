const axios = require('axios');
const xml2js = require('xml2js');
const winston = require('winston');
const { queue } = require('async');
const { performance } = require('perf_hooks');
const cds = require('@sap/cds');

// Logging setup
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(info => `${info.timestamp} - ${info.level}: ${info.message}`)
    ),
    transports: [
        new winston.transports.File({ filename: 'scraper.log' })
    ]
});

const base_url = "http://TUM_I01_ADT.dest";
const processedPackages = new Set();
const concurrency = 60; // Increased concurrency

// Create an axios instance with HTTP keep-alive
const axiosInstance = axios.create({
    httpAgent: new (require('http').Agent)({ keepAlive: true }),
    httpsAgent: new (require('https').Agent)({ keepAlive: true })
});

const taskQueue = queue(async (task, callback) => {
    await processPackage(task.packageName, task.csrfToken, task.cookies);
    callback();
}, concurrency);

taskQueue.drain = function() {
    logger.info('All items have been processed.');
};

taskQueue.error = function(error, task) {
    logger.error(`Task experienced an error while processing: ${task.packageName} - ${error}`);
};

async function getCsrfToken() {
    logger.info("Fetching CSRF token and cookies...");
    const url = `${base_url}/sap/bc/adt/discovery`;
    const headers = { "X-CSRF-Token": "fetch" };
    const response = await axiosInstance.get(url, { headers });
    logger.info("CSRF token and cookies retrieved.");
    return { csrfToken: response.headers['x-csrf-token'], cookies: response.headers['set-cookie'] };
}

async function getPackageStructure(packageName, csrfToken, cookies) {
    const url = packageName
        ? `${base_url}/sap/bc/adt/repository/nodestructure?parent_name=${packageName}`
        : `${base_url}/sap/bc/adt/repository/nodestructure`;
    const headers = { "X-CSRF-Token": csrfToken, "Cookie": cookies.join(';') };
    logger.info(`Fetching structure for package: ${packageName}`);
    return retry(async () => {
        const response = await axiosInstance.post(url, {}, { headers, timeout: 10000 }); // 10 seconds timeout
        logger.info(`Structure retrieved for package: ${packageName}`);
        return response;
    }, 3); // Retry up to 3 times
}

// OBJECT_TYPE, OBJECT_NAME, TECH_NAME, OBJECT_URI, OBJECT_VIT_URI, EXPANDABLE
async function processPackage(packageName, csrfToken, cookies) {
    if (processedPackages.has(packageName)) {
        logger.info(`Skipping already processed package: ${packageName}`);
        return;
    }
    processedPackages.add(packageName);
    logger.info(`Starting to process package: ${packageName}`);

    const startTime = performance.now();

    try {
        const response = await getPackageStructure(packageName, csrfToken, cookies);
        const parser = new xml2js.Parser({ explicitArray: false });
        const packageTree = await parser.parseStringPromise(response.data);

        const packages = packageTree['asx:abap']['asx:values']['DATA']['TREE_CONTENT']['SEU_ADT_REPOSITORY_OBJ_NODE'];
        let packageDetails = Array.isArray(packages) ? packages : [packages];

        // Filter package details based on OBJECT_NAME starting with 'Z' or '/ISV'
        const filteredPackageDetails = packageDetails.filter(pkg => /^Z|\/ISV/.test(pkg.OBJECT_NAME));

        logger.info(`Processing ${filteredPackageDetails.length} filtered items in package: ${packageName}`);
        await appendToDb(filteredPackageDetails);

        // Commented out to stop processing sub-packages
        /*
        filteredPackageDetails.forEach(pkg => {
            if (pkg.EXPANDABLE === 'X' && !processedPackages.has(pkg.OBJECT_NAME)) {
                logger.info(`Queueing sub-package: ${pkg.OBJECT_NAME}`);
                taskQueue.push({ packageName: pkg.OBJECT_NAME, csrfToken, cookies });
            }
        });
        */
    } catch (error) {
        logger.error(`Failed to process package ${packageName}: ${error.message}`);
    }

    const endTime = performance.now();
    logger.info(`Finished processing package: ${packageName} in ${endTime - startTime} ms`);
}

async function appendToDb(data) {
    const db = await cds.connect.to('db');
    const { Packages } = db.entities;

    if (data.length === 0) {
        logger.info(`No data to append to DB`);
        return;
    }
    logger.info(`Appending ${data.length} records to DB`);

    try {
        for (const item of data) {
            await db.run(
                INSERT.into(Packages).entries({
                    techName: item.TECH_NAME,
                    name: item.OBJECT_NAME,
                    type: item.OBJECT_TYPE,
                    // Felder müsen wir anpassen
                    description: item.OBJECT_URI,
                    createdAt: new Date(),
                    createdBy: 'scraper',
                })
            );
        }
        logger.info(`Data appended to DB`);
    } catch (error) {
        logger.error(`Failed to append data to DB: ${error.message}`);
    }
}

async function retry(fn, retries) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries - 1) {
                throw error;
            }
            logger.warn(`Retrying after error: ${error.message}`);
        }
    }
}

async function main() {
    try {
        logger.info("Starting main process...");
        const { csrfToken, cookies } = await getCsrfToken();
        taskQueue.push({ packageName: "", csrfToken, cookies }); // Start with the root package
    } catch (error) {
        logger.error(`Error starting main process: ${error.message}`);
    }
}

main().catch(error => logger.error(`Error in main: ${error.message}`));