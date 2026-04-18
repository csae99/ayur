from motor.motor_asyncio import AsyncIOMotorClient
import os
import certifi

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://mongo-db:27017')
DATABASE_NAME = 'ayurbot'

class MongoDB:
    client: AsyncIOMotorClient = None
    
    @classmethod
    async def connect_db(cls):
        """Connect to MongoDB"""
        # Only use TLS for cloud MongoDB (mongodb+srv:// or atlas URIs)
        if 'mongodb+srv' in MONGO_URI or 'mongodb.net' in MONGO_URI:
            cls.client = AsyncIOMotorClient(MONGO_URI, tlsCAFile=certifi.where())
        else:
            cls.client = AsyncIOMotorClient(MONGO_URI)
        print(f"Connected to MongoDB at {MONGO_URI}")
    
    @classmethod
    async def close_db(cls):
        """Close MongoDB connection"""
        if cls.client:
            cls.client.close()
            print("MongoDB connection closed")
    
    @classmethod
    def get_db(cls):
        """Get database instance"""
        return cls.client[DATABASE_NAME]

# Database instance getter
def get_database():
    return MongoDB.get_db()
