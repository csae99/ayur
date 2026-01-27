import json
import urllib.request
import urllib.parse
import os
import time

# Configuration
CATALOG_URL = "http://catalog-service:3002/items"
DATA_FILE = "/app/data/symptom_herb_map.json"

def load_herbs():
    with open(DATA_FILE, 'r') as f:
        data = json.load(f)
    
    herbs = set()
    for category in data.values():
        for herb in category.get("herbs", []):
            herbs.add(herb)
    return list(herbs)

def create_product(herb_name):
    # Create a realistic-looking product payload
    payload = {
        "item_title": f"Organic {herb_name} Powder",
        "item_brand": "VedaLife",
        "item_cat": "Herbs",
        "item_details": f"Pure, high-quality {herb_name} sourced from organic farms. Traditional Ayurvedic remedy.",
        "item_tags": f"{herb_name}, ayurveda, organic, herbal",
        "item_image": "", 
        "item_quantity": 50,
        "item_price": 299,
        "added_by": "admin"
    }

    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(CATALOG_URL, data=data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as response:
            if response.status == 201:
                print(f"[SUCCESS] Created: {herb_name}")
            else:
                print(f"[FAILED] {herb_name}: {response.status}")
    except Exception as e:
        print(f"[ERROR] {herb_name}: {e}")

def main():
    print(f"Reading herbs from {DATA_FILE}...")
    herbs = load_herbs()
    print(f"Found {len(herbs)} unique herbs.")
    
    print(f"Seeding catalog at {CATALOG_URL}...")
    for herb in herbs:
        create_product(herb)
        time.sleep(0.1) # Be gentle
    
    print("Done!")

if __name__ == "__main__":
    main()
