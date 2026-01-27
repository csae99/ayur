import requests
import json

URL = "http://localhost:8000/chat"
PAYLOAD = {
    "message": "What should I take for stress?",
    "user_id": 1,
    "session_id": "debug-session-123"
}

try:
    print(f"Sending request to {URL}...")
    response = requests.post(URL, json=PAYLOAD)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("Response JSON:")
        print(json.dumps(data, indent=2))
        
        products = data.get("products", [])
        print(f"\nProducts found: {len(products)}")
        for p in products:
            print(f"- {p.get('item_title')} (${p.get('item_price')})")
    else:
        print(f"Error: {response.text}")

except Exception as e:
    print(f"Failed to connect: {e}")
