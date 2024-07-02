const axios = require('axios');
const xml2js = require('xml2js');
const winston = require('winston');
const { queue } = require('async');
const { performance } = require('perf_hooks');
const { createObjectCsvWriter } = require('csv-writer');

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

taskQueue.drain = function () {
    logger.info('All items have been processed.');
};

taskQueue.error = function (error, task) {
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
    logger.info(`Fetching structure for package: ${packageName || 'Root'}`);
    return retry(async () => {
        const response = await axiosInstance.post(url, {}, { headers, timeout: 10000 });
        logger.info(`Structure retrieved for package: ${packageName || 'Root'}`);
        return response;
    }, 3);
}

async function getClassDetails(classUri, csrfToken, cookies) {
    const url = `${base_url}${classUri}`;
    const headers = {
        "X-CSRF-Token": csrfToken,
        "Accept": "application/vnd.sap.adt.oo.classes.v2+xml",
        "Cookie": cookies.join(';')
    };
    logger.info(`Fetching class details for URI: ${classUri}`);
    return retry(async () => {
        const response = await axiosInstance.get(url, { headers });
        logger.info(`Class details retrieved for URI: ${classUri}`);
        return response;
    }, 3);
}

async function getClassSource(classUri, csrfToken, cookies) {
    const url = `${base_url}${classUri}/source/main`;
    const headers = {
        "X-CSRF-Token": csrfToken,
        "Accept": "application/",
        "Cookie": cookies.join(';')
    };
    logger.info(`Fetching class source for URI: ${classUri}`);
    return retry(async () => {
        const response = await axiosInstance.get(url, { headers });
        logger.info(`Class source retrieved for URI: ${classUri}`);
        return response;
    }, 3);
}

async function getProgramDetails(programUri, csrfToken, cookies) {
    const url = `${base_url}${programUri}`;
    const headers = {
        "X-CSRF-Token": csrfToken,
        "Accept": "application/vnd.sap.adt.programs.programs.v2+xml",
        "Cookie": cookies.join(';')
    };
    logger.info(`Fetching program details for URI: ${programUri}`);
    return retry(async () => {
        const response = await axiosInstance.get(url, { headers });
        logger.info(`Program details retrieved for URI: ${programUri}`);
        return response;
    }, 3);
}

async function getClassInfo(packageName, csrfToken, cookies) {
    const url = `${base_url}/sap/bc/adt/repository/nodestructure?parent_name=${packageName}`;
    const headers = { "X-CSRF-Token": csrfToken, "Cookie": cookies.join(';') };
    logger.info(`Fetching classes for package: ${packageName}`);
    return retry(async () => {
        const response = await axiosInstance.post(url, {}, { headers, timeout: 10000 });
        logger.info(`Classes retrieved for package: ${packageName}`);
        return response;
    }, 3);
}

async function getProgramInfo(packageName, csrfToken, cookies) {
    const url = `${base_url}/sap/bc/adt/repository/nodestructure?parent_name=${packageName}`;
    const headers = { "X-CSRF-Token": csrfToken, "Cookie": cookies.join(';') };
    logger.info(`Fetching programs for package: ${packageName}`);
    return retry(async () => {
        const response = await axiosInstance.post(url, {}, { headers, timeout: 10000 });
        logger.info(`Programs retrieved for package: ${packageName}`);
        return response;
    }, 3);
}

async function getOtherObjectDetails(objectUri, csrfToken, cookies) {
    const url = `${base_url}${objectUri}`;
    const headers = {
        "X-CSRF-Token": csrfToken,
        "Accept": "application/vnd.sap.adt.basic.object.properties+xml",
        "Cookie": cookies.join(';')
    };
    logger.info(`Fetching other object details for URI: ${objectUri}`);
    return retry(async () => {
        const response = await axiosInstance.get(url, { headers });
        logger.info(`Other object details retrieved for URI: ${objectUri}`);
        return response;
    }, 3);
}

// OBJECT_TYPE, OBJECT_NAME, TECH_NAME, OBJECT_URI, OBJECT_VIT_URI, EXPANDABLE
async function processPackage(packageName, csrfToken, cookies, parentPackageName = null) {
    const isRootPackage = !packageName;
    const packageIdentifier = isRootPackage ? 'Root' : packageName;

    if (processedPackages.has(packageIdentifier)) {
        logger.info(`Skipping already processed package: ${packageIdentifier}`);
        return;
    }
    processedPackages.add(packageIdentifier);
    logger.info(`Starting to process package: ${packageIdentifier}`);

    const startTime = performance.now();

    try {
        const response = await getPackageStructure(packageName, csrfToken, cookies);
        const parser = new xml2js.Parser({ explicitArray: false });
        const packageTree = await parser.parseStringPromise(response.data);

        const packages = packageTree['asx:abap']['asx:values']['DATA']['TREE_CONTENT']['SEU_ADT_REPOSITORY_OBJ_NODE'];
        let packageDetails = Array.isArray(packages) ? packages : [packages];

        const filteredPackageDetails = packageDetails.filter(pkg => /^Z|\/ISV/.test(pkg.OBJECT_NAME));

        logger.info(`Processing ${filteredPackageDetails.length} filtered items in package: ${packageIdentifier}`);

        for (const pkg of filteredPackageDetails) {
            try {
                const packageDetails = await getPackage(pkg.OBJECT_NAME, csrfToken, cookies);
                const parsedDetails = await parser.parseStringPromise(packageDetails.data);
                const packageInfo = parsedDetails['adtcore:mainObject'].$;

                const packageRecord = {
                    techName: packageInfo['adtcore:techName'] || pkg.TECH_NAME || '',
                    name: packageInfo['adtcore:name'] || '',
                    type: packageInfo['adtcore:type'] || pkg.OBJECT_TYPE || '',
                    responsible: packageInfo['adtcore:responsible'] || '',
                    masterLanguage: packageInfo['adtcore:masterLanguage'] || '',
                    language: packageInfo['adtcore:language'] || '',
                    masterSystem: packageInfo['adtcore:masterSystem'] || '',
                    description: packageInfo['adtcore:description'] || '',
                    version: packageInfo['adtcore:version'] || '',
                    changedAt: packageInfo['adtcore:changedAt'] || '',
                    changedBy: packageInfo['adtcore:changedBy'] || '',
                    createdAt: packageInfo['adtcore:createdAt'] || '',
                    createdBy: packageInfo['adtcore:createdBy'] || '',
                    parent: parentPackageName || ''
                };

                await appendToCSV([packageRecord], 'packages');

                taskQueue.push({ packageName: pkg.OBJECT_NAME, csrfToken, cookies, parentPackageName: pkg.OBJECT_NAME });

                // Fetch and process classes for this package
                const classResponse = await getClassInfo(pkg.OBJECT_NAME, csrfToken, cookies);
                const classDetails = await parser.parseStringPromise(classResponse.data);
                const classes = classDetails['asx:abap']['asx:values']['DATA']['TREE_CONTENT']['SEU_ADT_REPOSITORY_OBJ_NODE'];

                let classRecords = Array.isArray(classes) ? classes : [classes];
                for (const cls of classRecords) {
                    if (cls.OBJECT_TYPE.startsWith('CLAS')) {
                        const classDetailResponse = await getClassDetails(cls.OBJECT_URI, csrfToken, cookies);
                        const parsedClassDetails = await parser.parseStringPromise(classDetailResponse.data);
                        const classInfo = parsedClassDetails['class:abapClass'].$;

                        const classSourceResponse = await getClassSource(cls.OBJECT_URI, csrfToken, cookies);
                        const classSource = classSourceResponse.data;

                        const classRecord = {
                            techName: classInfo['adtcore:name'] || '',
                            name: classInfo['adtcore:name'] || '',
                            type: classInfo['adtcore:type'] || '',
                            responsible: classInfo['adtcore:responsible'] || '',
                            masterLanguage: classInfo['adtcore:masterLanguage'] || '',
                            language: classInfo['adtcore:language'] || '',
                            masterSystem: classInfo['adtcore:masterSystem'] || '',
                            description: classInfo['adtcore:description'] || '',
                            version: classInfo['adtcore:version'] || '',
                            changedAt: classInfo['adtcore:changedAt'] || '',
                            changedBy: classInfo['adtcore:changedBy'] || '',
                            createdAt: classInfo['adtcore:createdAt'] || '',
                            createdBy: classInfo['adtcore:createdBy'] || '',
                            final: classInfo['class:final'] || '',
                            abstract: classInfo['class:abstract'] || '',
                            visibility: classInfo['class:visibility'] || '',
                            category: classInfo['class:category'] || '',
                            sharedMemoryEnabled: classInfo['class:sharedMemoryEnabled'] || '',
                            modeled: classInfo['abapoo:modeled'] || '',
                            fixPointArithmetic: classInfo['abapsource:fixPointArithmetic'] || '',
                            activeUnicodeCheck: classInfo['abapsource:activeUnicodeCheck'] || '',
                            mainSource: classSource || '',
                            parent: packageIdentifier
                        };
                        await appendToCSV([classRecord], 'classes');
                    } else if (cls.OBJECT_TYPE.startsWith('PROG')) {
                        const programDetailResponse = await getProgramDetails(cls.OBJECT_URI, csrfToken, cookies);
                        const parsedProgramDetails = await parser.parseStringPromise(programDetailResponse.data);
                        const programInfo = parsedProgramDetails['program:abapProgram'].$;

                        const programRecord = {
                            techName: programInfo['adtcore:name'] || '',
                            name: programInfo['adtcore:name'] || '',
                            type: programInfo['adtcore:type'] || '',
                            responsible: programInfo['adtcore:responsible'] || '',
                            masterLanguage: programInfo['adtcore:masterLanguage'] || '',
                            language: programInfo['adtcore:language'] || '',
                            masterSystem: programInfo['adtcore:masterSystem'] || '',
                            description: programInfo['adtcore:description'] || '',
                            version: programInfo['adtcore:version'] || '',
                            changedAt: programInfo['adtcore:changedAt'] || '',
                            changedBy: programInfo['adtcore:changedBy'] || '',
                            createdAt: programInfo['adtcore:createdAt'] || '',
                            createdBy: programInfo['adtcore:createdBy'] || '',
                            lockedByEditor: programInfo['program:lockedByEditor'] || '',
                            programType: programInfo['program:programType'] || '',
                            sourceObjectStatus: programInfo['abapsource:sourceObjectStatus'] || '',
                            fixPointArithmetic: programInfo['abapsource:fixPointArithmetic'] || '',
                            activeUnicodeCheck: programInfo['abapsource:activeUnicodeCheck'] || '',
                            parent: packageIdentifier
                        };
                        await appendToCSV([programRecord], 'programs');
                    } else {
                        const otherObjectDetailResponse = await getOtherObjectDetails(cls.OBJECT_URI, csrfToken, cookies);
                        const parsedOtherObjectDetails = await parser.parseStringPromise(otherObjectDetailResponse.data);
                        const otherObjectInfo = parsedOtherObjectDetails['adtcore:mainObject'].$;

                        const otherObjectRecord = {
                            techName: otherObjectInfo['adtcore:techName'] || cls.TECH_NAME || '',
                            name: otherObjectInfo['adtcore:name'] || '',
                            type: otherObjectInfo['adtcore:type'] || cls.OBJECT_TYPE || '',
                            responsible: otherObjectInfo['adtcore:responsible'] || '',
                            masterLanguage: otherObjectInfo['adtcore:masterLanguage'] || '',
                            language: otherObjectInfo['adtcore:language'] || '',
                            masterSystem: otherObjectInfo['adtcore:masterSystem'] || '',
                            description: otherObjectInfo['adtcore:description'] || '',
                            version: otherObjectInfo['adtcore:version'] || '',
                            changedAt: otherObjectInfo['adtcore:changedAt'] || '',
                            changedBy: otherObjectInfo['adtcore:changedBy'] || '',
                            createdAt: otherObjectInfo['adtcore:createdAt'] || '',
                            createdBy: otherObjectInfo['adtcore:createdBy'] || '',
                            parent: packageIdentifier
                        };

                        await appendToCSV([otherObjectRecord], 'others');
                    }
                }

            } catch (error) {
                logger.error(`Failed to fetch details for package ${pkg.OBJECT_NAME}: ${error.message}`);
            }
        }

    } catch (error) {
        logger.error(`Failed to process package ${packageIdentifier}: ${error.message}`);
    }

    const endTime = performance.now();
    logger.info(`Finished processing package: ${packageIdentifier} in ${endTime - startTime} ms`);
}

async function getPackage(packageName, csrfToken, cookies) {
    const url = `${base_url}/sap/bc/adt/vit/wb/object_type/devck/object_name/${packageName}`;
    const headers = {
        "Accept": "application/vnd.sap.adt.basic.object.properties+xml",
        "X-CSRF-Token": csrfToken,
        "Cookie": cookies.join(';')
    };
    logger.info(`Fetching details for package: ${packageName} from URL: ${url}`);
    return retry(async () => {
        const response = await axiosInstance.get(url, { headers });
        logger.info(`Details retrieved for package: ${packageName}`);
        return response;
    }, 3); // Retry up to 3 times
}

const packageCsvWriter = createObjectCsvWriter({
    path: 'packages.csv',
    header: [
        { id: 'techName', title: 'TECH_NAME' },
        { id: 'name', title: 'NAME' },
        { id: 'type', title: 'TYPE' },
        { id: 'responsible', title: 'RESPONSIBLE' },
        { id: 'masterLanguage', title: 'MASTER_LANGUAGE' },
        { id: 'language', title: 'LANGUAGE' },
        { id: 'masterSystem', title: 'MASTER_SYSTEM' },
        { id: 'description', title: 'DESCRIPTION' },
        { id: 'version', title: 'VERSION' },
        { id: 'changedAt', title: 'CHANGED_AT' },
        { id: 'changedBy', title: 'CHANGED_BY' },
        { id: 'createdAt', title: 'CREATED_AT' },
        { id: 'createdBy', title: 'CREATED_BY' },
        { id: 'parent', title: 'PARENT' }
    ]
});

const classCsvWriter = createObjectCsvWriter({
    path: 'classes.csv',
    header: [
        { id: 'techName', title: 'TECH_NAME' },
        { id: 'name', title: 'NAME' },
        { id: 'type', title: 'TYPE' },
        { id: 'responsible', title: 'RESPONSIBLE' },
        { id: 'masterLanguage', title: 'MASTER_LANGUAGE' },
        { id: 'language', title: 'LANGUAGE' },
        { id: 'masterSystem', title: 'MASTER_SYSTEM' },
        { id: 'description', title: 'DESCRIPTION' },
        { id: 'version', title: 'VERSION' },
        { id: 'changedAt', title: 'CHANGED_AT' },
        { id: 'changedBy', title: 'CHANGED_BY' },
        { id: 'createdAt', title: 'CREATED_AT' },
        { id: 'createdBy', title: 'CREATED_BY' },
        { id: 'final', title: 'FINAL' },
        { id: 'abstract', title: 'ABSTRACT' },
        { id: 'visibility', title: 'VISIBILITY' },
        { id: 'category', title: 'CATEGORY' },
        { id: 'sharedMemoryEnabled', title: 'SHARED_MEMORY_ENABLED' },
        { id: 'modeled', title: 'MODELED' },
        { id: 'fixPointArithmetic', title: 'FIX_POINT_ARITHMETIC' },
        { id: 'activeUnicodeCheck', title: 'ACTIVE_UNICODE_CHECK' },
        { id: 'mainSource', title: 'MAIN_SOURCE' },
        { id: 'parent', title: 'PARENT' }
    ]
});

const programCsvWriter = createObjectCsvWriter({
    path: 'programs.csv',
    header: [
        { id: 'techName', title: 'TECH_NAME' },
        { id: 'name', title: 'NAME' },
        { id: 'type', title: 'TYPE' },
        { id: 'responsible', title: 'RESPONSIBLE' },
        { id: 'masterLanguage', title: 'MASTER_LANGUAGE' },
        { id: 'language', title: 'LANGUAGE' },
        { id: 'masterSystem', title: 'MASTER_SYSTEM' },
        { id: 'description', title: 'DESCRIPTION' },
        { id: 'version', title: 'VERSION' },
        { id: 'changedAt', title: 'CHANGED_AT' },
        { id: 'changedBy', title: 'CHANGED_BY' },
        { id: 'createdAt', title: 'CREATED_AT' },
        { id: 'createdBy', title: 'CREATED_BY' },
        { id: 'lockedByEditor', title: 'LOCKED_BY_EDITOR' },
        { id: 'programType', title: 'PROGRAM_TYPE' },
        { id: 'sourceObjectStatus', title: 'SOURCE_OBJECT_STATUS' },
        { id: 'fixPointArithmetic', title: 'FIX_POINT_ARITHMETIC' },
        { id: 'activeUnicodeCheck', title: 'ACTIVE_UNICODE_CHECK' },
        { id: 'parent', title: 'PARENT' }
    ]
});

const otherObjectCsvWriter = createObjectCsvWriter({
    path: 'others.csv',
    header: [
        {id: 'techName', title: 'TECH_NAME'},
        {id: 'name', title: 'NAME'},
        {id: 'type', title: 'TYPE'},
        {id: 'responsible', title: 'RESPONSIBLE'},
        {id: 'masterLanguage', title: 'MASTER_LANGUAGE'},
        {id: 'language', title: 'LANGUAGE'},
        {id: 'masterSystem', title: 'MASTER_SYSTEM'},
        {id: 'description', title: 'DESCRIPTION'},
        {id: 'version', title: 'VERSION'},
        {id: 'changedAt', title: 'CHANGED_AT'},
        {id: 'changedBy', title: 'CHANGED_BY'},
        {id: 'createdAt', title: 'CREATED_AT'},
        {id: 'createdBy', title: 'CREATED_BY'},
        {id: 'parent', title: 'PARENT'}
    ]
});

async function appendToCSV(data, type) {
    if (data.length === 0) {
        logger.info(`No data to append to ${type} CSV`);
        return;
    }

    const records = data.map(item => ({
        techName: item.techName,
        name: item.name,
        type: item.type,
        responsible: item.responsible,
        masterLanguage: item.masterLanguage,
        language: item.language,
        masterSystem: item.masterSystem,
        description: item.description,
        version: item.version,
        changedAt: item.changedAt,
        changedBy: item.changedBy,
        createdAt: item.createdAt,
        createdBy: item.createdBy,
        final: item.final,
        abstract: item.abstract,
        visibility: item.visibility,
        category: item.category,
        sharedMemoryEnabled: item.sharedMemoryEnabled,
        modeled: item.modeled,
        fixPointArithmetic: item.fixPointArithmetic,
        activeUnicodeCheck: item.activeUnicodeCheck,
        lockedByEditor: item.lockedByEditor,
        programType: item.programType,
        sourceObjectStatus: item.sourceObjectStatus,
        mainSource: item.mainSource,
        parent: item.parent // Add the parent field
    }));

    try {
        if (type === 'packages') {
            await packageCsvWriter.writeRecords(records);
        } else if (type === 'classes') {
            await classCsvWriter.writeRecords(records);
        } else if (type === 'programs') {
            await programCsvWriter.writeRecords(records);
        } else if (type === 'others') {
            await otherObjectCsvWriter.writeRecords(records);
        }
        logger.info(`Data appended to ${type} CSV`);
    } catch (error) {
        logger.error(`Failed to append data to ${type} CSV: ${error.message}`);
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
        taskQueue.push({ packageName: null, csrfToken, cookies, parentPackageName: null }); // Start with the root package
    } catch (error) {
        logger.error(`Error starting main process: ${error.message}`);
    }
}

main().catch(error => logger.error(`Error in main: ${error.message}`));
