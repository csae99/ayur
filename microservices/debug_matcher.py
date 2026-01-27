import json

# Mock the Map
symptom_map = {
    "stress": ["Ashwagandha", "Brahmi", "Tulsi"],
    "digestion": ["Triphala", "Ginger", "Fennel"],
    "immunity": ["Tulsi", "Turmeric", "Amla"],
    "inflammation": ["Turmeric", "Boswellia", "Ginger"],
    "joint_pain": ["Boswellia", "Turmeric", "Guggul"],
    "fatigue": ["Ashwagandha", "Shatavari", "Gokshura"],
    "skin": ["Neem", "Turmeric", "Manjistha"],
    "hair": ["Bhringraj", "Amla", "Brahmi"],
    "min": ["Mint"] # Hypothetical short herb
}

known_herbs = set()
for herbs in symptom_map.values():
    known_herbs.update(herbs)
known_herbs = list(known_herbs)

known_symptoms = list(symptom_map.keys())

# Text from User Screenshot
bot_response = """
Hello there! I'm AyurBot...
In Ayurveda, good digestion is paramount...
To support your digestion, a foundational Ayurvedic herbal blend is Triphala.
It's renowned for gently cleansing...
Other helpful herbs can include Turmeric, which supports a healthy inflammatory response...
stoke Agni.
Beyond specific herbs...
Medical Disclaimer...
"""

print(f"Analyzing text length: {len(bot_response)}")

# Logic from main.py
found_herbs = [herb for herb in known_herbs if herb.lower() in bot_response.lower()]
found_tags = [tag for tag in known_symptoms if tag.lower() in bot_response.lower()]

found_entities = found_herbs + found_tags
# Filter
found_entities = list(set([e for e in found_entities if e and len(e.strip()) > 2]))

print("\n--- RESULTS ---")
print(f"Found Herbs: {found_herbs}")
print(f"Found Tags: {found_tags}")
print(f"Final Search List: {found_entities}")
