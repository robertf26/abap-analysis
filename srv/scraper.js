const axios = require('axios');
const xml2js = require('xml2js');
const { createObjectCsvWriter } = require('csv-writer');

// Basis-URL
const base_url = "http://TUM_I01_ADT.dest";

// Funktion zum Holen des CSRF Tokens
async function getCsrfToken() {
    const url = `${base_url}/sap/bc/adt/discovery`;
    const headers = { "X-CSRF-Token": "fetch" };
    console.log(`Requesting CSRF token from ${url}`);
    const response = await axios.get(url, { headers });
    console.log(`CSRF token received: ${response.headers['x-csrf-token']}`);
    return {
        csrfToken: response.headers['x-csrf-token'],
        cookies: response.headers['set-cookie']
    };
}

// Funktion zur Durchführung einer Suche
async function searchObjects(query, csrfToken, cookies) {
    const url = `${base_url}/sap/bc/adt/repository/informationsystem/search?operation=SEARCH_GENERIC&query=${query}`;
    const headers = { "X-CSRF-Token": csrfToken, "Cookie": cookies.join(';') };
    console.log(`Searching objects with query: ${query}`);
    const response = await axios.get(url, { headers });
    console.log(`Search completed with status: ${response.status}`);
    return response.data;
}

// Funktion zum Abrufen der Paketstruktur
async function getPackageStructure(packageName, csrfToken, cookies) {
    const url = `${base_url}/sap/bc/adt/repository/nodestructure?parent_name=${packageName}`;
    const headers = { "X-CSRF-Token": csrfToken, "X-SAP-ADT-SessionType": "Stateless", "Cookie": cookies.join(';') };
    console.log(`Retrieving package structure for: ${packageName}`);
    const response = await axios.post(url, {}, { headers });
    console.log(`Package structure retrieval completed with status: ${response.status}`);
    return response.data;
}

// Funktion zum Parsen der XML-Antwort
async function parseXml(xmlContent) {
    try {
        const parser = new xml2js.Parser();
        console.log("Parsing XML content");
        const result = await parser.parseStringPromise(xmlContent);
        console.log("XML parsing completed");
        return result;
    } catch (e) {
        console.error("Error parsing XML:", e);
        return null;
    }
}

// Funktion zum Speichern von Daten in CSV
async function saveToCsv(data, filename) {
    if (data.length) {
        const csvWriter = createObjectCsvWriter({
            path: filename,
            header: Object.keys(data[0]).map(key => ({id: key, title: key}))
        });
        console.log(`Saving data to CSV file: ${filename}`);
        await csvWriter.writeRecords(data);
        console.log("Data successfully saved to CSV");
    } else {
        console.log("No data to save to CSV");
    }
}

// Hauptfunktion
async function main() {
    try {
        console.log("Starting scraper...");
        const { csrfToken, cookies } = await getCsrfToken();
        console.log("CSRF token and cookies obtained");

        const searchResponse = await searchObjects("ZD256*", csrfToken, cookies);
        console.log("Search objects response received");

        const searchTree = await parseXml(searchResponse);
        if (!searchTree) {
            console.log("No search results found");
            return;
        }
        console.log("Search results parsed");
        console.log(JSON.stringify(searchTree, null, 2));

        // Überprüfen Sie die Struktur von searchTree
        if (!searchTree['adtcore:objectReferences'] || !searchTree['adtcore:objectReferences']['adtcore:objectReference']) {
            console.error("searchTree['adtcore:objectReferences']['adtcore:objectReference'] is undefined");
            return;
        }

        // Hier müssen Sie die spezifische Struktur Ihrer XML-Daten anpassen
        const objects = searchTree['adtcore:objectReferences']['adtcore:objectReference'].map(el => ({
            uri: el.$['adtcore:uri'],
            type: el.$['adtcore:type'],
            name: el.$['adtcore:name'],
            packageName: el.$['adtcore:packageName'],
            description: el.$['adtcore:description']
        }));
        console.log(`Found ${objects.length} objects`);

        const packageName = "ZD256_DEMO";
        const packageResponse = await getPackageStructure(packageName, csrfToken, cookies);
        console.log("Package structure response received");

        const packageTree = await parseXml(packageResponse);
        if (!packageTree) {
            console.log("No package structure found");
            return;
        }
        console.log("Package structure parsed");
        console.log(JSON.stringify(packageTree, null, 2));

        // Überprüfen Sie die Struktur von packageTree
        if (!packageTree['asx:abap'] || !packageTree['asx:abap']['asx:values'] || !packageTree['asx:abap']['asx:values'][0]['DATA'] || !packageTree['asx:abap']['asx:values'][0]['DATA'][0]['TREE_CONTENT'] || !packageTree['asx:abap']['asx:values'][0]['DATA'][0]['TREE_CONTENT'][0]['SEU_ADT_REPOSITORY_OBJ_NODE']) {
            console.error("packageTree structure is undefined");
            return;
        }

        // Spezifische Struktur Ihrer XML-Daten anpassen
        const packageDetails = packageTree['asx:abap']['asx:values'][0]['DATA'][0]['TREE_CONTENT'][0]['SEU_ADT_REPOSITORY_OBJ_NODE'].map(el => ({
            OBJECT_TYPE: el.OBJECT_TYPE[0],
            OBJECT_NAME: el.OBJECT_NAME[0],
            TECH_NAME: el.TECH_NAME[0],
            OBJECT_URI: el.OBJECT_URI[0],
            OBJECT_VIT_URI: el.OBJECT_VIT_URI[0],
            EXPANDABLE: el.EXPANDABLE[0]
        }));
        console.log(`Found ${packageDetails.length} package details`);

        const combinedData = objects.map(obj => ({
            ...obj,
            ...packageDetails.find(pkg => pkg.OBJECT_NAME === obj.name)
        }));
        console.log("Data combined");

        await saveToCsv(combinedData, "abap_objects.csv");
        console.log("Scraper finished successfully");
    } catch (error) {
        console.error("Error in main function:", error);
    }
}

// Führen Sie das Skript aus, wenn es direkt ausgeführt wird
if (require.main === module) {
    main();
}
//test
module.exports = { main };