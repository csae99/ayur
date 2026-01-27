
import json

# MOCK DATA
known_herbs = ["Ashwagandha", "Triphala", "Brahmi", "Tulsi"]
known_symptoms = ["stress", "digestion", "immunity"]
symptom_map = {
    "stress": {"herbs": ["Ashwagandha", "Brahmi"]},
    "digestion": {"herbs": ["Triphala"]},
    "immunity": {"herbs": ["Tulsi", "Ashwagandha"]}
}

mock_catalog_response = [
    {"item_title": "Ashwagandha Capsules", "item_tags": "stress, immunity"}, # Should be REJECTED for digestion
    {"item_title": "Triphala Churna", "item_tags": "digestion, detox"},      # Should be ACCEPTED
    {"item_title": "Kumkumadi Tailam", "item_tags": "skin"},                 # Should be REJECTED
    {"item_title": "Digestive Aid", "item_tags": "digestion"}                # Should be ACCEPTED
]

def run_test(user_message, bot_response):
    print(f"\n--- TEST: User='{user_message}' | Bot='{bot_response}' ---")
    
    # 1. User Intent
    user_text = user_message.lower()
    user_intent_tags = [tag for tag in known_symptoms if tag.lower() in user_text]
    print(f"Intent Tags: {user_intent_tags}")
    
    # 2. Potential Herbs
    potential_herbs = [herb for herb in known_herbs if herb.lower() in bot_response.lower()]
    print(f"Potential Herbs: {potential_herbs}")
    
    # 3. Filter Search Entities
    final_entities = []
    if user_intent_tags:
        valid_herbs_for_intent = set()
        for tag in user_intent_tags:
            if tag in symptom_map:
                valid_herbs_for_intent.update(symptom_map[tag]["herbs"])
        
        valid_herbs_lower = {h.lower() for h in valid_herbs_for_intent}
        
        matched_herbs = [h for h in potential_herbs if h.lower() in valid_herbs_lower]
        final_entities.extend(matched_herbs)
        final_entities.extend(user_intent_tags)
    else:
        final_entities.extend(potential_herbs)
        
    print(f"Search Entities: {final_entities}")
    
    # 4. Post-Catalog Filter (Simulated)
    final_products = []
    if user_intent_tags:
        valid_intent_set = set(t.lower() for t in user_intent_tags)
        
        # Re-calc valid herbs for checking titles
        valid_herbs_lower = set()
        for tag in user_intent_tags:
             if tag in symptom_map:
                 valid_herbs_lower.update([h.lower() for h in symptom_map[tag]["herbs"]])

        for prod in mock_catalog_response:
            prod_tags = prod.get('item_tags', '').lower()
            prod_title = prod.get('item_title', '').lower()
            
            is_relevant = False
            
            # Rule A: Tag Match
            prod_tag_list = [t.strip() for t in prod_tags.split(',')]
            if any(intent in prod_tag_list for intent in valid_intent_set):
                is_relevant = True
            
            # Rule B: Title Match
            if not is_relevant:
                 if any(herb in prod_title for herb in valid_herbs_lower):
                     is_relevant = True
            
            if is_relevant:
                final_products.append(prod['item_title'])
            else:
                print(f"  DROPPED: {prod['item_title']}")
    else:
        final_products = [p['item_title'] for p in mock_catalog_response]
        
    print(f"FINAL RESULT: {final_products}")
    return final_products

# Scenario: Digestion
result = run_test("How to improve digestion?", "You should try Triphala and Ashwagandha.")
assert "Ashwagandha Capsules" not in result
assert "Triphala Churna" in result    
