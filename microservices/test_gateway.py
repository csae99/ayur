import requests
import json

# Test the Gateway URL (Port 80 -> Nginx -> AyurBot Port 8000)
URL = "http://localhost/api/bot/chat"
PAYLOAD = {
    "message": "What should I take for stress?",
    "user_id": 1,
    "session_id": "debug-gateway-123"
}

try:
    print(f"Sending request to {URL}...")
    response = requests.post(URL, json=PAYLOAD)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        products = data.get("products", [])
        print(f"Products key exists: {'products' in data}")
        print(f"Products count: {len(products)}")
        if products:
             print("SUCCESS: Products are passing through Gateway.")
        else:
             print("FAILURE: Response is 200 OK but products are empty.")
    else:
        print(f"Error: {response.text}")

except Exception as e:
    print(f"Failed to connect: {e}")
