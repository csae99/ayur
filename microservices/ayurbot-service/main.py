from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import google.generativeai as genai
from datetime import datetime
import uuid
import traceback

# Configure Gemini AI
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set")

genai.configure(api_key=GEMINI_API_KEY)

# Initialize Gemini model
# Using gemini-2.5-flash as it's available for this API key
model = genai.GenerativeModel('models/gemini-2.5-flash')

# FastAPI app
app = FastAPI(title="AyurBot Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory conversation storage (will migrate to MongoDB later)
conversations = {}

# Pydantic models
class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_id: Optional[int] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    suggestions: List[str] = []

# System prompt for AyurBot
SYSTEM_PROMPT = """You are AyurBot, an AI assistant specializing in Ayurvedic health and wellness. 

Your role:
- Provide information about Ayurvedic principles and the three doshas (Vata, Pitta, Kapha)
- Suggest herbal remedies and lifestyle modifications based on Ayurvedic wisdom
- Help users understand their prakruti (natural constitution) and vikruti (current imbalance)
- Explain Ayurvedic approaches to diet, seasonal routines, and daily practices
- Recommend herbs available in our catalog for common wellness needs

Important guidelines:
- ALWAYS include a medical disclaimer in your first response
- Do NOT diagnose medical conditions or diseases
- STRONGLY recommend consulting qualified Ayurvedic practitioners for serious health issues
- Focus on preventive health, wellness, and general Ayurvedic knowledge
- Be warm, supportive, and culturally sensitive
- Keep responses concise but informative (2-3 paragraphs max)

Medical Disclaimer: "I provide general information about Ayurvedic wellness practices. This is not medical advice. Please consult a qualified Ayurvedic practitioner or healthcare provider for personalized health concerns."

When recommending herbs, suggest common Ayurvedic herbs like:
- Ashwagandha (stress, vitality)
- Triphala (digestion, detox)
- Turmeric (inflammation, immunity)
- Brahmi (memory, focus)
- Tulsi (immunity, respiratory)
- Shatavari (women's health, rejuvenation)

Greet users warmly and ask how you can help with their Ayurvedic wellness journey."""

@app.get("/")
async def root():
    return {"service": "AyurBot Service", "status": "Active", "ai": "Gemini 1.5 Flash"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model": "gemini-1.5-flash"}

@app.post("/chat", response_model=ChatResponse)
async def chat(chat_message: ChatMessage):
    try:
        print(f"Received chat message: {chat_message.message}")
        # Generate or use existing session ID
        session_id = chat_message.session_id or str(uuid.uuid4())
        
        # Get or create conversation history
        if session_id not in conversations:
            conversations[session_id] = {
                "history": [],
                "created_at": datetime.now().isoformat(),
                "user_id": chat_message.user_id
            }
        
        conversation = conversations[session_id]
        
        # Build prompt with conversation history
        if len(conversation["history"]) == 0:
            # First message in conversation - include full system prompt
            prompt = f"{SYSTEM_PROMPT}\n\nUser: {chat_message.message}\n\nAyurBot:"
        else:
            # Subsequent messages - include recent history
            history_text = "\n".join([
                f"{'User' if msg['role'] == 'user' else 'AyurBot'}: {msg['content']}"
                for msg in conversation["history"][-6:]  # Last 3 exchanges
            ])
            prompt = f"{history_text}\nUser: {chat_message.message}\n\nAyurBot:"
        
        # Call Gemini API
        print("Calling Gemini API...")
        response = model.generate_content(prompt)
        print(f"Gemini response received: {response.text[:50]}...")
        bot_response = response.text
        
        # Store in conversation history
        conversation["history"].append({
            "role": "user",
            "content": chat_message.message,
            "timestamp": datetime.now().isoformat()
        })
        conversation["history"].append({
            "role": "assistant",
            "content": bot_response,
            "timestamp": datetime.now().isoformat()
        })
        
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
    if session_id not in conversations:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session_id,
        "messages": conversations[session_id]["history"],
        "created_at": conversations[session_id]["created_at"]
    }

@app.delete("/session/{session_id}")
async def clear_session(session_id: str):
    if session_id in conversations:
        del conversations[session_id]
        return {"message": "Session cleared"}
    raise HTTPException(status_code=404, detail="Session not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
