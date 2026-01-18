from motor.motor_asyncio import AsyncIOMotorClient
import certifi
import asyncio
import os
import sys

# URI from env or hardcoded fallback (for testing)
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://mongo-db:27017')
print(f"Testing URI: {MONGO_URI}")

async def test_connect(params, name):
    print(f"\n--- Testing Configuration: {name} ---")
    print(f"Params: {params}")
    try:
        client = AsyncIOMotorClient(MONGO_URI, **params)
        # Force a connection
        await client.admin.command('ping')
        print("SUCCESS! Connected.")
        return True
    except Exception as e:
        print(f"FAILED. Error: {e}")
        return False

async def main():
    # Test 1: Defaults
    # await test_connect({}, "Defaults")

    # Test 2: Allow Invalid Certs (Insecure)
    await test_connect({'tlsAllowInvalidCertificates': True}, "Allow Invalid Certs")

    # Test 3: Certifi CA Bundle
    await test_connect({'tlsCAFile': certifi.where()}, "Certifi CA File")

    # Test 4: Explicit TLS + Allow Invalid
    await test_connect({'tls': True, 'tlsAllowInvalidCertificates': True}, "Explicit TLS + Allow Invalid")

if __name__ == "__main__":
    asyncio.run(main())
