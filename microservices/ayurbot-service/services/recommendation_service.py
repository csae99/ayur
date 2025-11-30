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
        """Search catalog service for herb products"""
        CATALOG_URL = os.getenv('CATALOG_SERVICE_URL', 'http://catalog-service:3002')
        
        try:
            async with httpx.AsyncClient() as client:
                # Search for each herb in the catalog
                results = []
                for herb_name in herb_names[:5]:  # Limit to top 5 herbs
                    response = await client.get(
                        f"{CATALOG_URL}/items",
                        params={"search": herb_name},
                        timeout=5.0
                    )
                    if response.status_code == 200:
                        items = response.json()
                        # Add matching items
                        for item in items[:2]:  # Top 2 per herb
                            results.append(item)
                
                return results
        except Exception as e:
            print(f"Error searching catalog: {e}")
            return []
    
    @staticmethod
    def format_herb_card(item: Dict) -> str:
        """Format herb item as a card for chat display"""
        return f"""
🌿 **{item.get('item_name', 'Unknown')}**
📝 {item.get('description', 'No description')}
💰 Price: ₹{item.get('item_price', 0)}
📦 Stock: {item.get('item_quantity', 0)} available
🆔 Item ID: {item.get('id')}
"""
