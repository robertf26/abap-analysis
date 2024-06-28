import requests
import xml.etree.ElementTree as ET
import csv

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

# Function to perform search
def search_objects(query, csrf_token, cookies):
    url = f"{base_url}/sap/bc/adt/repository/informationsystem/search?operation=SEARCH_GENERIC&query={query}"
    headers = {"X-CSRF-Token": csrf_token}
    response = requests.get(url, headers=headers, cookies=cookies)
    return response.content

# Function to retrieve package structure
def get_package_structure(package_name, csrf_token, cookies):
    url = f"{base_url}/sap/bc/adt/repository/nodestructure?parent_name={package_name}"
    headers = {
        "X-CSRF-Token": csrf_token,
        "X-SAP-ADT-SessionType": "Stateless"
    }
    response = requests.post(url, headers=headers, cookies=cookies)
    return response.content

# Function to parse XML response
def parse_xml(xml_content):
    try:
        root = ET.fromstring(xml_content)
        return root
    except ET.ParseError as e:
        print("Error parsing XML:", e)
        print("Response content:", xml_content.decode('utf-8', errors='ignore'))
        return None

# Function to save data to CSV
def save_to_csv(data, filename):
    if data:
        keys = data[0].keys()
        with open(filename, 'w', newline='', encoding='utf-8') as output_file:
            dict_writer = csv.DictWriter(output_file, fieldnames=keys)
            dict_writer.writeheader()
            dict_writer.writerows(data)

# Helper function to safely extract text
def safe_text(element, tag):
    found = element.find(tag)
    return found.text if found is not None else ""

# Main function
def main():
    # Get CSRF token
    csrf_token, cookies = get_csrf_token()

    # Perform search for objects
    search_response = search_objects("ZD256*", csrf_token, cookies)
    search_tree = parse_xml(search_response)
    if search_tree is None:
        return

    # Extract object references
    objects = []
    for obj_ref in search_tree.findall(".//{http://www.sap.com/adt/core}objectReference"):
        objects.append({
            "uri": obj_ref.attrib.get("{http://www.sap.com/adt/core}uri"),
            "type": obj_ref.attrib.get("{http://www.sap.com/adt/core}type"),
            "name": obj_ref.attrib.get("{http://www.sap.com/adt/core}name"),
            "packageName": obj_ref.attrib.get("{http://www.sap.com/adt/core}packageName"),
            "description": obj_ref.attrib.get("{http://www.sap.com/adt/core}description")
        })

    # Retrieve package structure
    package_name = "ZD256_DEMO"
    package_response = get_package_structure(package_name, csrf_token, cookies)
    package_tree = parse_xml(package_response)
    if package_tree is None:
        return

    # Extract package structure details
    package_details = []
    for node in package_tree.findall(".//SEU_ADT_REPOSITORY_OBJ_NODE"):
        package_details.append({
            "OBJECT_TYPE": safe_text(node, "OBJECT_TYPE"),
            "OBJECT_NAME": safe_text(node, "OBJECT_NAME"),
            "TECH_NAME": safe_text(node, "TECH_NAME"),
            "OBJECT_URI": safe_text(node, "OBJECT_URI"),
            "OBJECT_VIT_URI": safe_text(node, "OBJECT_VIT_URI"),
            "EXPANDABLE": safe_text(node, "EXPANDABLE")
        })

    # Combine objects and package details
    combined_data = []
    for obj in objects:
        for pkg in package_details:
            if obj["name"] == pkg["OBJECT_NAME"]:
                combined_data.append({**obj, **pkg})

    # Save to CSV
    save_to_csv(combined_data, "abap_objects.csv")

if __name__ == "__main__":
    main()