from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
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
from services.bm25_knowledge_service import BM25KnowledgeService as KnowledgeService  # Vectorless RAG
from services.diet_planner_service import DietPlannerService
from services.vision_service import VisionService

# Configure Gemini AI
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set")

genai.configure(api_key=GEMINI_API_KEY)

# Verify herbs loaded
try:
    herbs = RecommendationService.get_all_known_herbs()
    print(f"STARTUP: Loaded {len(herbs)} herbs from map.", flush=True)
except Exception as e:
    print(f"STARTUP ERROR: Could not load herbs: {e}", flush=True)

# Initialize Gemini model
model = genai.GenerativeModel('models/gemini-2.5-flash')

# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await MongoDB.connect_db()
    
    # Initialize Knowledge Base (BM25 — no API calls needed)
    print("Initializing Vectorless Knowledge Base (BM25)...")
    KnowledgeService.load_index()
    
    yield
    # Shutdown
    await MongoDB.close_db()

# FastAPI app with lifespan
app = FastAPI(title="AyurBot Vectorless Service", version="2.0.0", lifespan=lifespan)

# CORS middleware - enabled for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_id: Optional[int] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    suggestions: List[str] = []
    products: List[Dict] = []

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
- **Multilingual Mode**: STRICTLY detect the user's language. If the user asks in English, reply in **English**. If they ask in Hindi, reply in **Hindi**. Do NOT default to Hindi unless the user speaks it.

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

# Dosha → Herbal affinities for personalized recommendations
DOSHA_HERB_AFFINITY = {
    "vata":  ["Ashwagandha", "Shatavari", "Sesame"],
    "pitta": ["Brahmi", "Amla", "Shatavari"],
    "kapha": ["Ginger", "Turmeric", "Trikatu"]
}

@app.get("/")
async def root():
    return {"service": "AyurBot Vectorless Service", "status": "Active", "ai": "Gemini 2.5 Flash", "storage": "MongoDB", "rag": "BM25 (Vectorless)"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model": "gemini-2.5-flash", "database": "mongodb", "rag_engine": "bm25-vectorless"}

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
        
        # Retrieve RAG Context (BM25 — no API calls, instant)
        context = KnowledgeService.get_relevant_context(chat_message.message)
        if context:
            print(f"Retrieved BM25 context length: {len(context)}")
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
        
        try:
            bot_response = response.text
            print(f"Gemini response received: {bot_response[:50]}...")
        except ValueError:
            print("Gemini blocked response due to safety filters.")
            bot_response = "I apologize, but I cannot provide specific medical advice for that query. Please consult a qualified Ayurvedic practitioner for personalized guidance."
        
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
        
        # === Smart Cart v2: BM25-aware + Dosha-personalized + Single Batch Call ===
        products = []
        try:
            # Load known entities
            try:
                known_herbs = RecommendationService.get_all_known_herbs()
                known_symptoms = RecommendationService.get_all_known_symptoms()
                symptom_map = RecommendationService.load_symptom_herb_map()
            except Exception as e:
                print(f"SMART_CART: Error loading maps: {e}")
                known_herbs = []
                known_symptoms = []
                symptom_map = {}

            # --- Source 1: User Intent Tags (from user message) ---
            user_text = (chat_message.message or "").lower()
            user_intent_tags = [tag for tag in known_symptoms if tag.lower() in user_text]
            
            # --- Source 2: Herbs mentioned in Bot Response ---
            bot_text_lower = bot_response.lower()
            bot_herbs = [herb for herb in known_herbs if herb.lower() in bot_text_lower]
            
            # --- Source 3: Herbs found in BM25 Retrieved Context ---
            bm25_herbs = []
            if context:
                context_lower = context.lower()
                bm25_herbs = [herb for herb in known_herbs if herb.lower() in context_lower]
                if bm25_herbs:
                    print(f"SMART_CART: BM25 context contains herbs: {bm25_herbs[:5]}")

            # --- Source 4: Dosha-Aware Herb Affinity (if user has dosha assessment) ---
            dosha_herbs = []
            if chat_message.user_id:
                try:
                    assessments = await DoshaAssessmentModel.get_assessment_history(
                        chat_message.user_id, limit=1
                    )
                    if assessments:
                        primary_dosha = assessments[0].get('results', {}).get('primary_dosha', '').lower()
                        if primary_dosha in DOSHA_HERB_AFFINITY:
                            dosha_herbs = DOSHA_HERB_AFFINITY[primary_dosha][:2]  # Top 2 affinity herbs
                            print(f"SMART_CART: User dosha={primary_dosha} → affinity herbs: {dosha_herbs}")
                except Exception as e:
                    print(f"SMART_CART: Dosha lookup failed (non-fatal): {e}")

            # --- Compile Final Herb List ---
            all_herb_candidates = list(set(bot_herbs + bm25_herbs + dosha_herbs))
            
            # If intent tags found, filter herbs to only those mapped to the intent
            final_herbs = []
            if user_intent_tags:
                print(f"SMART_CART: Intent detected: {user_intent_tags}")
                valid_herbs_for_intent = set()
                for tag in user_intent_tags:
                    tag_key = tag.lower()
                    if tag_key in symptom_map:
                        valid_herbs_for_intent.update(symptom_map[tag_key].get("herbs", []))
                
                valid_lower = {h.lower() for h in valid_herbs_for_intent}
                final_herbs = [h for h in all_herb_candidates if h.lower() in valid_lower]
                # Also include dosha herbs (they're always relevant to the user)
                final_herbs.extend(dosha_herbs)
            else:
                print("SMART_CART: No intent tags — using all discovered herbs")
                final_herbs = all_herb_candidates
            
            # Deduplicate and clean
            final_herbs = list(set([h for h in final_herbs if h and len(h.strip()) > 2]))
            final_symptoms = list(set([t for t in user_intent_tags if t and len(t.strip()) > 1]))
            
            print(f"SMART_CART: Final → herbs={final_herbs}, symptoms={final_symptoms}")
            
            if final_herbs or final_symptoms:
                # Single batch call to /items/recommend (replaces N serial calls)
                products = await RecommendationService.search_catalog_recommend(
                    final_herbs, final_symptoms, limit=4
                )
                print(f"SMART_CART: Catalog returned {len(products)} products")

        except Exception as e:
            print(f"SMART_CART: CRITICAL ERROR: {e}")
            traceback.print_exc()
            products = []
        
        return ChatResponse(
            response=bot_response,
            session_id=session_id,
            suggestions=suggestions[:3],
            products=products
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


# ============== Diet Plan PDF Endpoint ==============
@app.get("/diet-plan/{dosha}")
async def get_diet_plan_pdf(dosha: str):
    """Generate and download a 7-day diet plan PDF for the specified dosha"""
    try:
        dosha = dosha.lower()
        if dosha not in ["vata", "pitta", "kapha"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid dosha. Must be one of: vata, pitta, kapha"
            )
        
        pdf_bytes = DietPlannerService.generate_diet_plan_pdf(dosha)
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={dosha}_diet_plan.pdf"
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate diet plan: {str(e)}")


# ============== Vision Assessment Endpoint ==============
class VisionAssessmentRequest(BaseModel):
    image: str  # Base64 encoded image
    analysis_type: str  # "face", "tongue", or "skin"


@app.post("/vision-assessment")
async def analyze_vision(request: VisionAssessmentRequest):
    """Analyze an image for dosha indicators using Gemini Vision"""
    try:
        if request.analysis_type not in ["face", "tongue", "skin"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid analysis_type. Must be 'face', 'tongue', or 'skin'"
            )
        
        result = await VisionService.analyze_image(
            request.image,
            request.analysis_type
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Vision analysis failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
