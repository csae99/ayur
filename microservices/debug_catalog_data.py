import urllib.request
import json

BASE_URL = "http://localhost:3002/items"
QUERIES = ["digestion", "Triphala", "Turmeric", "Ashwagandha"]

print("--- CATALOG DATA DEBUG ---")
for q in QUERIES:
    try:
        url = f"{BASE_URL}?search={q}"
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode('utf-8'))
            print(f"\nQuery: '{q}'")
            print(f"Found: {len(data)} items")
            for item in data:
                print(f"  - {item.get('item_title')} (Tags: {item.get('item_tags')})")
    except Exception as e:
        print(f"Error querying {q}: {e}")
