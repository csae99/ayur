import requests
import json

try:
    response = requests.get("http://localhost:3002/items", params={"search": "Ashwagandha"})
    print(f"Status: {response.status_code}")
    print("Response:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
