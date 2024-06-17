import requests
import xml.etree.ElementTree as ET
import csv
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging
import os

# Set up logging to a file only
log_file = 'scraper.log'
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s', handlers=[
    logging.FileHandler(log_file)
])

# Base URL
base_url = "http://TUM_I01_ADT.dest"

# Function to get CSRF token
def get_csrf_token():
    url = f"{base_url}/sap/bc/adt/discovery"
    headers = {"X-CSRF-Token": "fetch"}
    response = requests.get(url, headers=headers)
    csrf_token = response.headers.get("X-CSRF-Token")
    cookies = response.cookies
    return csrf_token, cookies

# Function to retrieve package structure
def get_package_structure(package_name, csrf_token, cookies):
    if package_name:
        url = f"{base_url}/sap/bc/adt/repository/nodestructure?parent_name={package_name}"
    else:
        url = f"{base_url}/sap/bc/adt/repository/nodestructure"
    
    headers = {
        "X-CSRF-Token": csrf_token,
        "X-SAP-ADT-SessionType": "Stateless"
    }
    response = requests.post(url, headers=headers, cookies=cookies)
    if response.status_code != 200:
        logging.warning(f"Failed to retrieve package structure for {package_name}: HTTP {response.status_code}")
        if response.status_code == 429:  # Too Many Requests
            retry_after = response.headers.get("Retry-After")
            if retry_after:
                time.sleep(int(retry_after))
            else:
                time.sleep(10)  # Default backoff time
        return None
    return response.content

# Function to parse XML response
def parse_xml(xml_content):
    if not xml_content.strip():
        return None
    try:
        root = ET.fromstring(xml_content)
        return root
    except ET.ParseError as e:
        logging.error("Error parsing XML: %s", e)
        logging.debug("Response content: %s", xml_content.decode('utf-8', errors='ignore'))
        return None

# Helper function to safely extract text
def safe_text(element, tag):
    found = element.find(tag)
    return found.text if found is not None else ""

# Recursive function to fetch and accumulate package details
def fetch_package_details(package_name, csrf_token, cookies):
    logging.info(f"Fetching details for package: {package_name}")
    package_response = get_package_structure(package_name, csrf_token, cookies)
    if package_response is None:
        return []

    package_tree = parse_xml(package_response)
    if package_tree is None:
        return []

    package_details = []
    for node in package_tree.findall(".//SEU_ADT_REPOSITORY_OBJ_NODE"):
        details = {
            "OBJECT_TYPE": safe_text(node, "OBJECT_TYPE"),
            "OBJECT_NAME": safe_text(node, "OBJECT_NAME"),
            "TECH_NAME": safe_text(node, "TECH_NAME"),
            "OBJECT_URI": safe_text(node, "OBJECT_URI"),
            "OBJECT_VIT_URI": safe_text(node, "OBJECT_VIT_URI"),
            "EXPANDABLE": safe_text(node, "EXPANDABLE")
        }
        package_details.append(details)
        
        # If the node is expandable, recursively fetch its details
        if details["EXPANDABLE"] == "X":
            package_details.extend(fetch_package_details(details["OBJECT_NAME"], csrf_token, cookies))
    return package_details

# Function to save data to CSV incrementally
def append_to_csv(data, filename):
    if not os.path.exists(filename):
        with open(filename, 'w', newline='', encoding='utf-8') as output_file:
            keys = data[0].keys()
            dict_writer = csv.DictWriter(output_file, fieldnames=keys)
            dict_writer.writeheader()
            dict_writer.writerows(data)
    else:
        with open(filename, 'a', newline='', encoding='utf-8') as output_file:
            keys = data[0].keys()
            dict_writer = csv.DictWriter(output_file, fieldnames=keys)
            dict_writer.writerows(data)

# Main function
def main():
    # Get CSRF token
    csrf_token, cookies = get_csrf_token()

    # Retrieve top-level package structure
    package_response = get_package_structure("", csrf_token, cookies)
    if package_response is None:
        logging.error("Failed to retrieve top-level package structure")
        return

    package_tree = parse_xml(package_response)
    if package_tree is None:
        return

    # Extract top-level packages
    top_level_packages = []
    for node in package_tree.findall(".//SEU_ADT_REPOSITORY_OBJ_NODE"):
        package_name = safe_text(node, "OBJECT_NAME")
        top_level_packages.append(package_name)

    # Fetch details for all packages in parallel
    with ThreadPoolExecutor(max_workers=16) as executor:
        futures = {executor.submit(fetch_package_details, package, csrf_token, cookies): package for package in top_level_packages}
        for future in as_completed(futures):
            package = futures[future]
            try:
                data = future.result()
                if data:
                    append_to_csv(data, "abap_packages.csv")
                    logging.info(f"Fetched and saved details for package: {package}")
            except Exception as e:
                logging.error("Error fetching details for package %s: %s", package, e)

if __name__ == "__main__":
    main()
