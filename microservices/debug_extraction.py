
response_text = """
Hello! I'm AyurBot...
In Ayurveda, strong digestion (Agni) is considered the foundation of good health.
Absorbs nutrients... eliminates waste... vitality and robust immunity.
To support your digestive process...
For enhancing your digestive health, Triphala is a renowned Ayurvedic herbal blend.
supports healthy digestion, detoxification, regular bowel movements...
"""

# Tags from symptom_map
symptom_tags = ["immunity", "digestion", "detox", "stress", "skin"] 
known_herbs = ["Triphala", "Ashwagandha", "Kumkumadi", "Chyawanprash"]

found = []
for tag in symptom_tags:
    if tag.lower() in response_text.lower():
        found.append(f"TAG: {tag}")

for herb in known_herbs:
    if herb.lower() in response_text.lower():
        found.append(f"HERB: {herb}")

print("--- FOUND ENTITIES ---")
for f in found:
    print(f)
