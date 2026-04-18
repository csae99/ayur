"""
Vision Service - Uses Gemini Vision to analyze photos for dosha indicators
"""
import google.generativeai as genai
import base64
import json
import re
from typing import Dict, Any


class VisionService:
    """Service for analyzing images to determine dosha characteristics"""
    
    ANALYSIS_PROMPTS = {
        "face": """You are an expert Ayurvedic practitioner analyzing a face photo for dosha (Vata, Pitta, Kapha) indicators.

Analyze the facial features in this image and identify dosha characteristics:

VATA indicators: Thin/narrow face, dry skin, small/asymmetric features, dark circles, fine wrinkles, thin lips
PITTA indicators: Medium/sharp facial structure, warm/ruddy complexion, oily T-zone, freckles/moles, penetrating eyes, medium lips
KAPHA indicators: Round/full face, thick/oily skin, large eyes, thick hair, full lips, smooth/youthful appearance

Provide your analysis in this EXACT JSON format (no markdown, just JSON):
{
  "dosha_indicators": {
    "vata": <percentage 0-100>,
    "pitta": <percentage 0-100>,
    "kapha": <percentage 0-100>
  },
  "primary_dosha": "<Vata|Pitta|Kapha>",
  "observations": [
    "<observation 1>",
    "<observation 2>",
    "<observation 3>"
  ],
  "recommendations": [
    "<recommendation 1>",
    "<recommendation 2>",
    "<recommendation 3>"
  ]
}

IMPORTANT: Percentages must add up to 100. Be specific about what you observe in the image.""",

        "tongue": """You are an expert Ayurvedic practitioner analyzing a tongue photo for dosha (Vata, Pitta, Kapha) indicators.

Analyze the tongue in this image for dosha characteristics:

VATA indicators: Thin/pointed tongue, dry/cracked surface, trembling, grayish coating, cold appearance
PITTA indicators: Red/inflamed tongue, yellow coating, sharp pointed tip, burning sensation indicators, medium size
KAPHA indicators: Thick/swollen tongue, white/thick coating, pale color, smooth surface, wet/moist appearance

Provide your analysis in this EXACT JSON format (no markdown, just JSON):
{
  "dosha_indicators": {
    "vata": <percentage 0-100>,
    "pitta": <percentage 0-100>,
    "kapha": <percentage 0-100>
  },
  "primary_dosha": "<Vata|Pitta|Kapha>",
  "observations": [
    "<observation 1>",
    "<observation 2>",
    "<observation 3>"
  ],
  "recommendations": [
    "<recommendation 1>",
    "<recommendation 2>",
    "<recommendation 3>"
  ]
}

IMPORTANT: Percentages must add up to 100. Be specific about what you observe in the image.""",

        "skin": """You are an expert Ayurvedic practitioner analyzing a skin photo for dosha (Vata, Pitta, Kapha) indicators.

Analyze the skin in this image for dosha characteristics:

VATA indicators: Dry/rough texture, thin skin, visible veins, dark/dusky tone, cold to touch appearance, fine lines
PITTA indicators: Warm/flushed appearance, oily, sensitive, prone to redness/inflammation, freckles, medium thickness
KAPHA indicators: Thick/oily skin, smooth texture, pale/cool tone, large pores, prone to congestion, moist appearance

Provide your analysis in this EXACT JSON format (no markdown, just JSON):
{
  "dosha_indicators": {
    "vata": <percentage 0-100>,
    "pitta": <percentage 0-100>,
    "kapha": <percentage 0-100>
  },
  "primary_dosha": "<Vata|Pitta|Kapha>",
  "observations": [
    "<observation 1>",
    "<observation 2>",
    "<observation 3>"
  ],
  "recommendations": [
    "<recommendation 1>",
    "<recommendation 2>",
    "<recommendation 3>"
  ]
}

IMPORTANT: Percentages must add up to 100. Be specific about what you observe in the image."""
    }
    
    @staticmethod
    async def analyze_image(image_base64: str, analysis_type: str) -> Dict[str, Any]:
        """
        Analyze an image using Gemini Vision for dosha indicators
        
        Args:
            image_base64: Base64 encoded image string
            analysis_type: Type of analysis - "face", "tongue", or "skin"
            
        Returns:
            Dict with dosha_indicators, observations, and recommendations
        """
        if analysis_type not in VisionService.ANALYSIS_PROMPTS:
            raise ValueError(f"Invalid analysis type: {analysis_type}. Must be 'face', 'tongue', or 'skin'")
        
        # Get the appropriate prompt
        prompt = VisionService.ANALYSIS_PROMPTS[analysis_type]
        
        # Initialize Gemini model (gemini-2.5-flash supports vision)
        model = genai.GenerativeModel('models/gemini-2.5-flash')
        
        # Prepare image data
        # Remove data URL prefix if present
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        image_data = base64.b64decode(image_base64)
        
        # Create image part for Gemini
        image_part = {
            "mime_type": "image/jpeg",
            "data": image_data
        }
        
        try:
            # Generate response with image
            response = model.generate_content([prompt, image_part])
            
            # Parse JSON response
            response_text = response.text.strip()
            
            # Try to extract JSON from response
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                result = json.loads(json_match.group())
            else:
                raise ValueError("Could not parse JSON from response")
            
            # Validate and normalize percentages
            indicators = result.get("dosha_indicators", {})
            total = sum(indicators.values())
            if total != 100 and total > 0:
                # Normalize to 100%
                for dosha in indicators:
                    indicators[dosha] = round((indicators[dosha] / total) * 100)
            
            # Add analysis type to result
            result["analysis_type"] = analysis_type
            
            return result
            
        except Exception as e:
            print(f"Vision analysis error: {e}")
            # Return a default response on error
            return {
                "analysis_type": analysis_type,
                "dosha_indicators": {
                    "vata": 33,
                    "pitta": 34,
                    "kapha": 33
                },
                "primary_dosha": "Balanced",
                "observations": [
                    "Unable to fully analyze the image",
                    "Please ensure the image is clear and well-lit",
                    "Try uploading a different photo"
                ],
                "recommendations": [
                    "Take the Dosha Quiz for more accurate results",
                    "Consult with an Ayurvedic practitioner",
                    "Ensure proper lighting when taking photos"
                ],
                "error": str(e)
            }
