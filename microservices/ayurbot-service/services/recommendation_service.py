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
        """Search catalog service for herb products"""
        CATALOG_URL = os.getenv('CATALOG_SERVICE_URL', 'http://catalog-service:3002')
        
        try:
            async with httpx.AsyncClient() as client:
                # Search for each herb in the catalog
                results = []
                seen_titles = set()
                
                for herb_name in herb_names[:5]:  # Limit to top 5 herbs
                    if not herb_name or len(herb_name.strip()) < 2:
                        continue

                    response = await client.get(
                        f"{CATALOG_URL}/items",
                        params={"search": herb_name},
                        timeout=5.0
                    )
                    if response.status_code == 200:
                        items = response.json()
                        # Add matching items, avoiding duplicates
                        for item in items:
                            title = item.get('item_title', '')
                            if title and title not in seen_titles:
                                results.append(item)
                                seen_titles.add(title)
                                
                        if len(results) >= 20: # Collect more to allow filtering downstream
                            break
                
                return results[:20] # Let main.py filter and limit to 4
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
