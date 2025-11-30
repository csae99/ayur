from datetime import datetime
from typing import List, Dict, Optional
from database.mongodb import get_database
from bson import ObjectId

class ConversationModel:
    """Model for managing conversations in MongoDB"""
    
    @staticmethod
    async def create_conversation(session_id: str, user_id: Optional[int] = None):
        """Create a new conversation"""
        db = get_database()
        conversation = {
            "session_id": session_id,
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "messages": [],
            "metadata": {
                "dosha_assessment": None,
                "recommended_herbs": [],
                "topics": []
            }
        }
        result = await db.conversations.insert_one(conversation)
        return str(result.inserted_id)
    
    @staticmethod
    async def get_conversation(session_id: str):
        """Get conversation by session ID"""
        db = get_database()
        return await db.conversations.find_one({"session_id": session_id})
    
    @staticmethod
    async def add_message(session_id: str, role: str, content: str):
        """Add a message to conversation"""
        db = get_database()
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow()
        }
        
        result = await db.conversations.update_one(
            {"session_id": session_id},
            {
                "$push": {"messages": message},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        return result.modified_count > 0
    
    @staticmethod
    async def get_messages(session_id: str, limit: int = 50):
        """Get messages from conversation"""
        db = get_database()
        conversation = await db.conversations.find_one(
            {"session_id": session_id},
            {"messages": {"$slice": -limit}}
        )
        if conversation:
            return conversation.get("messages", [])
        return []
    
    @staticmethod
    async def update_metadata(session_id: str, metadata: Dict):
        """Update conversation metadata"""
        db = get_database()
        result = await db.conversations.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    f"metadata.{key}": value 
                    for key, value in metadata.items()
                },
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        return result.modified_count > 0
    
    @staticmethod
    async def delete_conversation(session_id: str):
        """Delete a conversation"""
        db = get_database()
        result = await db.conversations.delete_one({"session_id": session_id})
        return result.deleted_count > 0
    
    @staticmethod
    async def get_user_conversations(user_id: int, limit: int = 10):
        """Get all conversations for a user"""
        db = get_database()
        cursor = db.conversations.find(
            {"user_id": user_id}
        ).sort("updated_at", -1).limit(limit)
        
        conversations = []
        async for conv in cursor:
            conv['_id'] = str(conv['_id'])
            conversations.append(conv)
        return conversations
