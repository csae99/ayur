import requests
import socket

def check_ip():
    try:
        ip = requests.get('https://api.ipify.org', timeout=5).text
        print(f"Container Public IP: {ip}")
    except Exception as e:
        print(f"Failed to get Public IP: {e}")

def check_google():
    try:
        requests.get('https://google.com', timeout=5)
        print("Egress to Google: OK")
    except Exception as e:
        print(f"Egress to Google: FAILED ({e})")

if __name__ == "__main__":
    check_ip()
    check_google()
