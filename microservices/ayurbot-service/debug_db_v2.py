from motor.motor_asyncio import AsyncIOMotorClient
import pymongo
import certifi
import asyncio
import os
import ssl

MONGO_URI = os.getenv('MONGO_URI', 'mongodb://mongo-db:27017')
print(f"Testing URI: {MONGO_URI}")

async def test_motor(params, name):
    print(f"\n[Async] Testing: {name}")
    print(f"Params: {params}")
    try:
        client = AsyncIOMotorClient(MONGO_URI, **params)
        await client.admin.command('ping')
        print("SUCCESS!")
        return True
    except Exception as e:
        print(f"FAILED: {e}")
        return False

def test_sync(params, name):
    print(f"\n[Sync] Testing: {name}")
    print(f"Params: {params}")
    try:
        client = pymongo.MongoClient(MONGO_URI, **params)
        client.admin.command('ping')
        print("SUCCESS!")
        return True
    except Exception as e:
        print(f"FAILED: {e}")
        return False

async def main():
    # 1. Custom Context: Unverified but TLS 1.2+
    ctx_unverified = ssl.create_default_context()
    ctx_unverified.check_hostname = False
    ctx_unverified.verify_mode = ssl.CERT_NONE
    
    # 2. Sync Test first (simpler stack)
    test_sync({'tlsAllowInvalidCertificates': True}, "Sync + Invalid Certs")
    
    # 3. Async with tlsInsecure (Ultra Permissive)
    await test_motor({'tls': True, 'tlsInsecure': True}, "Async + tlsInsecure=True")

    # 4. Async with explicit invalid certs
    await test_motor({'tls': True, 'tlsAllowInvalidCertificates': True, 'tlsAllowInvalidHostnames': True}, "Async + Invalid Certs + Hostnames")

if __name__ == "__main__":
    asyncio.run(main())
