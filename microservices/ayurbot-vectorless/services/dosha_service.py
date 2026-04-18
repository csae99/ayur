from typing import Dict, List
import json
import os

class DoshaService:
    """Service for dosha assessment and calculations"""
    
    # Dosha quiz questions
    QUESTIONS = [
        {
            "id": 1,
            "question": "What is your body frame?",
            "options": {
                "A": {"text": "Thin, light", "dosha": "vata"},
                "B": {"text": "Medium, moderate", "dosha": "pitta"},
                "C": {"text": "Large, heavy", "dosha": "kapha"}
            }
        },
        {
            "id": 2,
            "question": "How is your body weight?",
            "options": {
                "A": {"text": "Hard to gain weight", "dosha": "vata"},
                "B": {"text": "Easy to gain or lose", "dosha": "pitta"},
                "C": {"text": "Easy to gain, hard to lose", "dosha": "kapha"}
            }
        },
        {
            "id": 3,
            "question": "How is your skin?",
            "options": {
                "A": {"text": "Dry, rough, cool", "dosha": "vata"},
                "B": {"text": "Warm, oily, sensitive", "dosha": "pitta"},
                "C": {"text": "Thick, oily, cool", "dosha": "kapha"}
            }
        },
        {
            "id": 4,
            "question": "How is your appetite?",
            "options": {
                "A": {"text": "Variable, irregular", "dosha": "vata"},
                "B": {"text": "Strong, cannot skip meals", "dosha": "pitta"},
                "C": {"text": "Steady, can skip meals", "dosha": "kapha"}
            }
        },
        {
            "id": 5,
            "question": "How is your digestion?",
            "options": {
                "A": {"text": "Irregular, gas, bloating", "dosha": "vata"},
                "B": {"text": "Quick, strong, loose stools", "dosha": "pitta"},
                "C": {"text": "Slow, heavy, regular", "dosha": "kapha"}
            }
        },
        {
            "id": 6,
            "question": "How is your energy level?",
            "options": {
                "A": {"text": "Comes in bursts", "dosha": "vata"},
                "B": {"text": "High, intense", "dosha": "pitta"},
                "C": {"text": "Steady, enduring", "dosha": "kapha"}
            }
        },
        {
            "id": 7,
            "question": "How is your sleep?",
            "options": {
                "A": {"text": "Light, interrupted", "dosha": "vata"},
                "B": {"text": "Moderate, sound", "dosha": "pitta"},
                "C": {"text": "Deep, prolonged", "dosha": "kapha"}
            }
        },
        {
            "id": 8,
            "question": "How do you respond to stress?",
            "options": {
                "A": {"text": "Anxious, worried", "dosha": "vata"},
                "B": {"text": "Irritable, angry", "dosha": "pitta"},
                "C": {"text": "Withdrawn, depressed", "dosha": "kapha"}
            }
        },
        {
            "id": 9,
            "question": "How do you make decisions?",
            "options": {
                "A": {"text": "Quickly, impulsively", "dosha": "vata"},
                "B": {"text": "Analytically, decisively", "dosha": "pitta"},
                "C": {"text": "Slowly, thoughtfully", "dosha": "kapha"}
            }
        },
        {
            "id": 10,
            "question": "How is your memory?",
            "options": {
                "A": {"text": "Quick to learn, quick to forget", "dosha": "vata"},
                "B": {"text": "Sharp, clear", "dosha": "pitta"},
                "C": {"text": "Slow but permanent", "dosha": "kapha"}
            }
        }
    ]
    
    @staticmethod
    def get_questions():
        """Get dosha quiz questions"""
        return DoshaService.QUESTIONS
    
    @staticmethod
    def calculate_dosha(answers: Dict[int, str]) -> Dict:
        """
        Calculate dosha percentages from quiz answers
        answers: {question_id: "A"|"B"|"C"}
        """
        dosha_scores = {"vata": 0, "pitta": 0, "kapha": 0}
        
        for question_id, answer in answers.items():
            question_id = int(question_id)
            question = next((q for q in DoshaService.QUESTIONS if q["id"] == question_id), None)
            
            if question and answer in question["options"]:
                dosha = question["options"][answer]["dosha"]
                dosha_scores[dosha] += 1
        
        total = sum(dosha_scores.values())
        if total == 0:
            return {"vata": 33.33, "pitta": 33.33, "kapha": 33.33, "primary_dosha": "Balanced"}
        
        percentages = {
            dosha: round((count / total) * 100, 2)
            for dosha, count in dosha_scores.items()
        }
        
        primary_dosha = max(dosha_scores, key=dosha_scores.get).capitalize()
        
        return {
            **percentages,
            "primary_dosha": primary_dosha
        }
    
    @staticmethod
    def get_dosha_recommendations(primary_dosha: str) -> List[str]:
        """Get recommendations based on primary dosha"""
        recommendations = {
            "Vata": [
                "Follow a regular routine with consistent meal and sleep times",
                "Favor warm, cooked, grounding foods (soups, stews, root vegetables)",
                "Use warming spices like ginger, cinnamon, and black pepper",
                "Practice calming activities like gentle yoga and meditation",
                "Get plenty of rest and avoid overexertion",
                "Herbs: Ashwagandha, Shatavari, Brahmi"
            ],
            "Pitta": [
                "Keep cool and avoid excessive heat or sun exposure",
                "Favor cooling foods (cucumbers, melons, leafy greens)",
                "Avoid spicy, oily, and fried foods",
                "Practice moderation and avoid overwork",
                "Engage in calming activities like swimming or walking in nature",
                "Herbs: Brahmi, Shatavari, Amalaki, Neem"
            ],
            "Kapha": [
                "Stay active with regular vigorous exercise",
                "Favor light, dry, warm foods; reduce heavy, oily foods",
                "Use pungent spices like ginger, black pepper, and cayenne",
                "Wake up early and avoid daytime napping",
                "Seek variety and new experiences",
                "Herbs: Trikatu, Guggul, Triphala"
            ]
        }
        
        return recommendations.get(primary_dosha, [])
