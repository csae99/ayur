from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from contextlib import asynccontextmanager
import os
import google.generativeai as genai
from datetime import datetime
import uuid
import traceback

# Import MongoDB components
from database.mongodb import MongoDB
from models.conversation import ConversationModel
from models.dosha_assessment import DoshaAssessmentModel

# Import services
from services.dosha_service import DoshaService
from services.recommendation_service import RecommendationService
from services.knowledge_service import KnowledgeService

# Configure Gemini AI
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set")

genai.configure(api_key=GEMINI_API_KEY)

# Initialize Gemini model
model = genai.GenerativeModel('models/gemini-2.5-flash')

# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await MongoDB.connect_db()
    
    # Initialize Knowledge Base
    print("Initializing Knowledge Base...")
    KnowledgeService.load_index()
    
    yield
    # Shutdown
    await MongoDB.close_db()

# FastAPI app with lifespan
app = FastAPI(title="AyurBot Service", version="1.0.0", lifespan=lifespan)

# CORS middleware
# CORS middleware - Handled by API Gateway
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# Pydantic models
class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_id: Optional[int] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    suggestions: List[str] = []

class DoshaQuizAnswers(BaseModel):
    answers: dict  # {question_id: "A"|"B"|"C"}
    user_id: Optional[int] = None
    session_id: Optional[str] = None

class HerbRecommendationRequest(BaseModel):
    symptoms: List[str]

# System prompt for AyurBot
SYSTEM_PROMPT = """You are AyurBot, an AI assistant specializing in Ayurvedic health and wellness. 

Your role:
- Provide information about Ayurvedic principles and the three doshas (Vata, Pitta, Kapha)
- Suggest herbal remedies and lifestyle modifications based on Ayurvedic wisdom
- Help users understand their prakruti (natural constitution) and vikruti (current imbalance)
- Explain Ayurvedic approaches to diet, seasonal routines, and daily practices
- Recommend herbs available in our catalog for common wellness needs

Important guidelines:
- ALWAYS include a medical disclaimer at the VERY END of your response
- Do NOT diagnose medical conditions or diseases
- STRONGLY recommend consulting qualified Ayurvedic practitioners for serious health issues
- Focus on preventive health, wellness, and general Ayurvedic knowledge
- Be warm, supportive, and culturally sensitive
- Keep responses concise but informative (2-3 paragraphs max)
- **Multilingual Mode**: Detect the user's language (e.g., Hindi, Spanish, French) and reply IN THAT SAME LANGUAGE. If the user speaks a mix (Hinglish), reply in the same style.

When recommending herbs, suggest common Ayurvedic herbs like:
- Ashwagandha (stress, vitality)
- Triphala (digestion, detox)
- Turmeric (inflammation, immunity)
- Brahmi (memory, focus)
- Tulsi (immunity, respiratory)
- Shatavari (women's health, rejuvenation)

Greet users warmly and ask how you can help with their Ayurvedic wellness journey.

Medical Disclaimer: "I provide general information about Ayurvedic wellness practices. This is not medical advice. Please consult a qualified Ayurvedic practitioner or healthcare provider for personalized health concerns."
"""

@app.get("/")
async def root():
    return {"service": "AyurBot Service", "status": "Active", "ai": "Gemini 2.5 Flash", "storage": "MongoDB"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model": "gemini-2.5-flash", "database": "mongodb"}

@app.post("/chat", response_model=ChatResponse)
async def chat(chat_message: ChatMessage):
    try:
        print(f"Received chat message: {chat_message.message}")
        
        # Generate or use existing session ID
        session_id = chat_message.session_id or str(uuid.uuid4())
        
        # Get or create conversation in MongoDB
        conversation = await ConversationModel.get_conversation(session_id)
        
        if not conversation:
            # Create new conversation
            await ConversationModel.create_conversation(session_id, chat_message.user_id)
            conversation_history = []
        else:
            # Load existing messages
            conversation_history = await ConversationModel.get_messages(session_id, limit=6)
        
        # Retrieve RAG Context
        context = KnowledgeService.get_relevant_context(chat_message.message)
        if context:
            print(f"Retrieved context length: {len(context)}")
            system_instruction = f"{SYSTEM_PROMPT}\n\nReference Material (Use this constraints-checked info if relevant to answer):\n{context}\n"
        else:
            system_instruction = SYSTEM_PROMPT

        # Build prompt with conversation history AND context
        if len(conversation_history) == 0:
            # First message in conversation - include full system prompt
            prompt = f"{system_instruction}\n\nUser: {chat_message.message}\n\nAyurBot:"
        else:
            # Subsequent messages - include recent history
            history_text = "\n".join([
                f"{'User' if msg['role'] == 'user' else 'AyurBot'}: {msg['content']}"
                for msg in conversation_history[-6:]  # Last 3 exchanges
            ])
            # We inject context at the top of the conversation for the model's awareness
            prompt = f"{system_instruction}\n{history_text}\nUser: {chat_message.message}\n\nAyurBot:"
        
        # Call Gemini API
        print("Calling Gemini API...")
        response = model.generate_content(prompt)
        print(f"Gemini response received: {response.text[:50]}...")
        bot_response = response.text
        
        # Save user message to MongoDB
        await ConversationModel.add_message(session_id, "user", chat_message.message)
        
        # Save bot response to MongoDB
        await ConversationModel.add_message(session_id, "assistant", bot_response)
        
        # Generate suggestions based on response
        suggestions = []
        if "dosha" in bot_response.lower():
            suggestions = ["What is my dosha?", "How do I balance my dosha?", "Dosha-specific diet tips"]
        elif "herb" in bot_response.lower() or "ashwagandha" in bot_response.lower():
            suggestions = ["Show me herbal products", "Tell me more about this herb", "Any side effects?"]
        else:
            suggestions = ["Tell me about doshas", "Suggest herbs for stress", "Ayurvedic diet tips"]
        
        return ChatResponse(
            response=bot_response,
            session_id=session_id,
            suggestions=suggestions[:3]
        )
        
    except Exception as e:
        traceback.print_exc()
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@app.get("/history/{session_id}")
async def get_history(session_id: str):
    """Get conversation history from MongoDB"""
    conversation = await ConversationModel.get_conversation(session_id)
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Convert ObjectId to string for JSON serialization
    conversation['_id'] = str(conversation['_id'])
    
    # Convert datetime objects to ISO format
    if 'created_at' in conversation:
        conversation['created_at'] = conversation['created_at'].isoformat()
    if 'updated_at' in conversation:
        conversation['updated_at'] = conversation['updated_at'].isoformat()
    
    # Convert message timestamps
    for msg in conversation.get('messages', []):
        if 'timestamp' in msg:
            msg['timestamp'] = msg['timestamp'].isoformat()
    
    return {
        "session_id": session_id,
        "messages": conversation.get("messages", []),
        "created_at": conversation.get("created_at"),
        "metadata": conversation.get("metadata", {})
    }

@app.delete("/session/{session_id}")
async def clear_session(session_id: str):
    """Delete a conversation session"""
    deleted = await ConversationModel.delete_conversation(session_id)
    
    if deleted:
        return {"message": "Session cleared"}
    raise HTTPException(status_code=404, detail="Session not found")

@app.get("/user/{user_id}/conversations")
async def get_user_conversations(user_id: int, limit: int = 10):
    """Get all conversations for a user"""
    conversations = await ConversationModel.get_user_conversations(user_id, limit)
    
    # Convert timestamps for JSON serialization
    for conv in conversations:
        if 'created_at' in conv:
            conv['created_at'] = conv['created_at'].isoformat()
        if 'updated_at' in conv:
            conv['updated_at'] = conv['updated_at'].isoformat()
    
    return {"conversations": conversations}

@app.get("/dosha/quiz")
async def get_dosha_quiz():
    """Get dosha assessment quiz questions"""
    return {"questions": DoshaService.get_questions()}

@app.post("/dosha/assess")
async def assess_dosha(quiz_answers: DoshaQuizAnswers):
    """Calculate dosha from quiz answers"""
    try:
        # Calculate dosha percentages
        results = DoshaService.calculate_dosha(quiz_answers.answers)
        primary_dosha = results["primary_dosha"]
        
        # Get recommendations
        recommendations = DoshaService.get_dosha_recommendations(primary_dosha)
        
        # Save assessment to MongoDB if user_id provided
        if quiz_answers.user_id:
            session_id = quiz_answers.session_id or str(uuid.uuid4())
            await DoshaAssessmentModel.create_assessment(
                user_id=quiz_answers.user_id,
                session_id=session_id,
                answers=quiz_answers.answers,
                results=results
            )
        
        return {
            "results": results,
            "recommendations": recommendations,
            "primary_dosha": primary_dosha
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Assessment error: {str(e)}")

@app.get("/dosha/history/{user_id}")
async def get_dosha_history(user_id: int, limit: int = 5):
    """Get dosha assessment history for a user"""
    assessments = await DoshaAssessmentModel.get_assessment_history(user_id, limit)
    
    # Convert timestamps
    for assessment in assessments:
        if 'assessment_date' in assessment:
            assessment['assessment_date'] = assessment['assessment_date'].isoformat()
    
    return {"assessments": assessments}

@app.post("/recommend/herbs")
async def recommend_herbs(request: HerbRecommendationRequest):
    """Get herb recommendations based on symptoms"""
    try:
        # Get herb recommendations from symptom mapping
        recommendations = RecommendationService.get_herb_recommendations(request.symptoms)
        
        # Search catalog for actual products
        catalog_items = await RecommendationService.search_catalog_herbs(
            recommendations["recommended_herbs"]
        )
        
        return {
            "recommendations": recommendations,
            "catalog_items": catalog_items
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
