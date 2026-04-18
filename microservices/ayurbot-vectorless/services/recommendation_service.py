import json
import os
import httpx
from typing import List, Dict

class RecommendationService:
    """Service for herb and treatment recommendations"""
    
    @staticmethod
    def load_symptom_herb_map():
        """Load symptom to herb mapping"""
        current_dir = os.path.dirname(os.path.abspath(__file__))
        json_path = os.path.join(current_dir, '..', 'data', 'symptom_herb_map.json')
        
        with open(json_path, 'r') as f:
            return json.load(f)

    @staticmethod
    def get_all_known_herbs() -> List[str]:
        """Get list of all unique herbs known to the system"""
        symptom_map = RecommendationService.load_symptom_herb_map()
        herbs = set()
        for data in symptom_map.values():
            herbs.update(data.get("herbs", []))
        return list(herbs)

    @staticmethod
    def get_all_known_symptoms() -> List[str]:
        """Get list of all known symptoms/tags from the map"""
        symptom_map = RecommendationService.load_symptom_herb_map()
        return list(symptom_map.keys())
    
    @staticmethod
    def get_herb_recommendations(symptoms: List[str]) -> Dict:
        """Get herb recommendations based on symptoms"""
        symptom_map = RecommendationService.load_symptom_herb_map()
        
        recommended_herbs = set()
        descriptions = []
        
        for symptom in symptoms:
            symptom_lower = symptom.lower().replace(" ", "_")
            if symptom_lower in symptom_map:
                herbs = symptom_map[symptom_lower]["herbs"]
                desc = symptom_map[symptom_lower]["description"]
                recommended_herbs.update(herbs)
                descriptions.append({
                    "symptom": symptom,
                    "description": desc,
                    "herbs": herbs
                })
        
        return {
            "symptoms": symptoms,
            "recommended_herbs": list(recommended_herbs),
            "details": descriptions
        }
    
    @staticmethod
    async def search_catalog_herbs(herb_names: List[str]) -> List[Dict]:
        """Legacy: Search catalog service for herb products (backward compat)"""
        return await RecommendationService.search_catalog_recommend(herb_names, [])

    @staticmethod
    async def search_catalog_recommend(herb_names: List[str], symptom_tags: List[str], limit: int = 4) -> List[Dict]:
        """
        Search catalog via the /items/recommend endpoint (single batch call).
        Sends all herbs + symptoms in one request. The catalog handles:
        - Multi-field search (title, tags, details)
        - In-stock filtering
        - Relevance ranking
        """
        CATALOG_URL = os.getenv('CATALOG_SERVICE_URL', 'http://catalog-service:3002')
        
        # Clean and deduplicate terms
        herbs_csv = ",".join([h.strip() for h in herb_names if h and len(h.strip()) > 1][:8])
        symptoms_csv = ",".join([s.strip() for s in symptom_tags if s and len(s.strip()) > 1][:5])
        
        if not herbs_csv and not symptoms_csv:
            return []
        
        try:
            async with httpx.AsyncClient() as client:
                print(f"Calling /items/recommend → herbs={herbs_csv}, symptoms={symptoms_csv}")
                response = await client.get(
                    f"{CATALOG_URL}/items/recommend",
                    params={
                        "herbs": herbs_csv,
                        "symptoms": symptoms_csv,
                        "limit": str(limit)
                    },
                    timeout=5.0
                )
                if response.status_code == 200:
                    products = response.json()
                    print(f"Catalog returned {len(products)} ranked products")
                    return products
                else:
                    print(f"Catalog recommend returned status {response.status_code}")
        except Exception as e:
            print(f"Error calling /items/recommend: {e}")
        return []
    
    @staticmethod
    def format_herb_card(item: Dict) -> str:
        """Format herb item as a card for chat display"""
        return f"""
🌿 **{item.get('item_title', 'Unknown')}**
📝 {item.get('item_details', 'No description')}
💰 Price: ₹{item.get('item_price', 0)}
📦 Stock: {item.get('item_quantity', 0)} available
🆔 Item ID: {item.get('id')}
"""

