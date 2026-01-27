import urllib.request
import json
import time

CATALOG_URL = "http://catalog-service:3002/items"

def get_items(search_term):
    url = f"{CATALOG_URL}?search={search_term}"
    with urllib.request.urlopen(url) as response:
        return json.loads(response.read().decode('utf-8'))

def update_item(item):
    item_id = item['id']
    url = f"{CATALOG_URL}/{item_id}"
    
    # Clean tags
    tags = item.get('item_tags', '')
    if not tags: return
    
    tag_list = [t.strip().lower() for t in tags.split(',')]
    
    # SPECIFIC FIX: Remove 'digestion' from Ashwagandha
    if 'ashwagandha' in item['item_title'].lower():
        if 'digestion' in tag_list:
            tag_list = [t for t in tag_list if t != 'digestion']
            print(f"[{item['item_title']}] Removing 'digestion' tag...")
            
            new_tags = ", ".join(tag_list)
            item['item_tags'] = new_tags
            
            # Send PUT
            data = json.dumps(item).encode('utf-8')
            req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='PUT')
            try:
                with urllib.request.urlopen(req) as response:
                    print(f"  Updated: {response.status}")
            except Exception as e:
                print(f"  Failed: {e}")
        else:
            print(f"[{item['item_title']}] Clean.")

def main():
    print("Fetching Ashwagandha items...")
    items = get_items("Ashwagandha")
    print(f"Found {len(items)} items.")
    
    for item in items:
        update_item(item)
        
    print("Done.")

if __name__ == "__main__":
    main()
