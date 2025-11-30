from datetime import datetime
from typing import Dict
from database.mongodb import get_database

class DoshaAssessmentModel:
    """Model for managing dosha assessments in MongoDB"""
    
    @staticmethod
    async def create_assessment(user_id: int, session_id: str, answers: Dict, results: Dict):
        """Create a new dosha assessment"""
        db = get_database()
        assessment = {
            "user_id": user_id,
            "session_id": session_id,
            "assessment_date": datetime.utcnow(),
            "answers": answers,
            "results": results
        }
        result = await db.dosha_assessments.insert_one(assessment)
        return str(result.inserted_id)
    
    @staticmethod
    async def get_latest_assessment(user_id: int):
        """Get the most recent assessment for a user"""
        db = get_database()
        assessment = await db.dosha_assessments.find_one(
            {"user_id": user_id},
            sort=[("assessment_date", -1)]
        )
        if assessment:
            assessment['_id'] = str(assessment['_id'])
        return assessment
    
    @staticmethod
    async def get_assessment_history(user_id: int, limit: int = 5):
        """Get assessment history for a user"""
        db = get_database()
        cursor = db.dosha_assessments.find(
            {"user_id": user_id}
        ).sort("assessment_date", -1).limit(limit)
        
        assessments = []
        async for assessment in cursor:
            assessment['_id'] = str(assessment['_id'])
            assessments.append(assessment)
        return assessments
