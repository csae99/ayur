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
from services.knowledge_service import KnowledgeService
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
        
        # Smart Cart: Identify mentioned herbs and fetch products
        products = []
        try:
            # Safe loading of known entities
            try:
                known_herbs = RecommendationService.get_all_known_herbs()
                known_symptoms = RecommendationService.get_all_known_symptoms()
                symptom_map = RecommendationService.load_symptom_herb_map()
            except Exception as e:
                print(f"DEBUGGING: Error loading maps: {e}")
                known_herbs = []
                known_symptoms = []
                symptom_map = {}

            # 1. Identify User Intent (Tags) - from USER MESSAGE ONLY
            user_text = (chat_message.message or "").lower()
            user_intent_tags = [tag for tag in known_symptoms if tag.lower() in user_text]
            
            # 2. Identify Potential Herbs - from BOT RESPONSE
            bot_text_lower = bot_response.lower()
            potential_herbs = [herb for herb in known_herbs if herb.lower() in bot_text_lower]

            # 3. Compile Search List
            final_entities = []
            
            if user_intent_tags:
                print(f"DEBUG: Search Intent Detected: {user_intent_tags}")
                
                # If intent is known (e.g. 'digestion'), ONLY allow herbs mapped to that intent.
                valid_herbs_for_intent = set()
                for tag in user_intent_tags:
                    # Map keys might be lowercase
                    tag_key = tag.lower() 
                    if tag_key in symptom_map:
                        valid_herbs_for_intent.update(symptom_map[tag_key].get("herbs", []))
                    # Handle exact case match if needed, though load_symptom_herb_map should correspond
                    elif tag in symptom_map:
                        valid_herbs_for_intent.update(symptom_map[tag].get("herbs", []))
                
                valid_herbs_lower = {h.lower() for h in valid_herbs_for_intent}
                
                # Filter strict: Only keep herbs that match the intent
                matched_herbs = [h for h in potential_herbs if h.lower() in valid_herbs_lower]
                final_entities.extend(matched_herbs)
                
                # Add the tags themselves to find generic items like "Digestive Syrup"
                final_entities.extend(user_intent_tags)
                
            else:
                print("DEBUG: No specific intent tags found. Searching for all mentioned herbs.")
                final_entities.extend(potential_herbs)

            # Deduplicate and Clean
            final_entities = list(set([e for e in final_entities if e and len(e.strip()) > 2]))
            print(f"DEBUG: Final Search Entities sent to Catalog: {final_entities}")
            
            if final_entities:
                # Fetch from Catalog
                raw_products = await RecommendationService.search_catalog_herbs(final_entities)
                
                # 4. POST-CATALOG HARD FILTER (Safety Net)
                final_products = []
                
                if user_intent_tags: # Strict Mode
                    valid_intent_set = set(t.lower() for t in user_intent_tags)
                    
                    for prod in raw_products:
                        prod_tags = (prod.get('item_tags') or "").lower()
                        prod_title = (prod.get('item_title') or "").lower()
                        
                        is_relevant = False
                        
                        # Rule A: Product explicitly tagged with intent (e.g. 'digestion')
                        # Split tags by comma to avoid partial matches like 'indigestion' matching 'digestion' if careless
                        prod_tag_list = [t.strip() for t in prod_tags.split(',')]
                        if any(intent in prod_tag_list for intent in valid_intent_set):
                            is_relevant = True
                            
                        # Rule B: Product Title matches a Valid Herb for that intent
                        if not is_relevant:
                            # We already calculated valid_herbs_lower for this intent
                            if any(herb in prod_title for herb in valid_herbs_lower):
                                is_relevant = True
                        
                        if is_relevant:
                            final_products.append(prod)
                        else:
                            print(f"DEBUG: Dropped Rejection: {prod_title} (Tags: {prod_tags}) vs Intent: {valid_intent_set}")
                else:
                    # Relaxed Mode
                    final_products = raw_products

                print(f"DEBUG: Showing {len(final_products)} products after filtering.")
                products = final_products[:4]  # Limit to 4 products for display

        except Exception as e:
            print(f"DEBUG: CRITICAL ERROR in Smart Cart Logic: {e}")
            traceback.print_exc()
            # Fallback: empty products list, do not crash chat
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
