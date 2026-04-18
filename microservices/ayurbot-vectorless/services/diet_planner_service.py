"""
Diet Planner Service - Generates personalized 7-day Ayurvedic diet plans as PDF
"""
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import datetime


class DietPlannerService:
    """Service for generating dosha-based 7-day diet plans as PDF"""
    
    DOSHA_INFO = {
        "vata": {
            "name": "Vata",
            "element": "Air + Space",
            "qualities": "Cold, Dry, Light, Mobile",
            "description": "Vata governs movement and change. When balanced, you are creative, flexible, and quick-thinking. When imbalanced, you may experience anxiety, dry skin, and digestive issues.",
            "dietary_principles": [
                "Favor warm, cooked, moist foods",
                "Include healthy oils and fats (ghee, sesame oil)",
                "Use warming spices: ginger, cinnamon, cumin, cardamom",
                "Eat at regular times in a calm environment",
                "Avoid cold, raw, dry foods and caffeine"
            ],
            "color": colors.Color(0.6, 0.4, 0.8)  # Purple
        },
        "pitta": {
            "name": "Pitta",
            "element": "Fire + Water",
            "qualities": "Hot, Sharp, Light, Oily",
            "description": "Pitta governs digestion and metabolism. When balanced, you are focused, intelligent, and a natural leader. When imbalanced, you may experience inflammation, anger, and skin issues.",
            "dietary_principles": [
                "Favor cool, refreshing foods",
                "Include sweet, bitter, and astringent tastes",
                "Use cooling spices: coriander, fennel, mint, turmeric",
                "Avoid hot, spicy, oily, and fried foods",
                "Stay hydrated with room temperature or cool water"
            ],
            "color": colors.Color(0.8, 0.4, 0.2)  # Orange
        },
        "kapha": {
            "name": "Kapha",
            "element": "Earth + Water",
            "qualities": "Heavy, Slow, Cool, Oily",
            "description": "Kapha governs structure and lubrication. When balanced, you are calm, loving, and steady. When imbalanced, you may experience weight gain, congestion, and lethargy.",
            "dietary_principles": [
                "Favor light, dry, warm foods",
                "Include pungent, bitter, and astringent tastes",
                "Use stimulating spices: ginger, black pepper, cayenne, mustard",
                "Eat your main meal at noon when digestion is strongest",
                "Avoid heavy, oily, cold, and sweet foods"
            ],
            "color": colors.Color(0.2, 0.6, 0.4)  # Green
        }
    }
    
    MEAL_PLANS = {
        "vata": [
            {"day": "Day 1", "breakfast": "Warm oatmeal with ghee, cinnamon, and stewed apples", "lunch": "Basmati rice with mung dal, cooked vegetables, and ghee", "dinner": "Vegetable soup with whole wheat bread"},
            {"day": "Day 2", "breakfast": "Cream of wheat with almonds and dates", "lunch": "Khichdi with steamed carrots and beets", "dinner": "Pasta with creamy vegetable sauce"},
            {"day": "Day 3", "breakfast": "Warm milk with turmeric and honey", "lunch": "Quinoa with roasted root vegetables", "dinner": "Miso soup with tofu and vegetables"},
            {"day": "Day 4", "breakfast": "Poha (flattened rice) with peanuts and curry leaves", "lunch": "Rice with paneer curry and spinach", "dinner": "Whole wheat chapati with dal"},
            {"day": "Day 5", "breakfast": "Upma with vegetables and ghee", "lunch": "Sweet potato and chickpea curry with rice", "dinner": "Vegetable stew with crusty bread"},
            {"day": "Day 6", "breakfast": "Banana pancakes with maple syrup", "lunch": "Pasta with pesto and grilled vegetables", "dinner": "Tomato soup with grilled cheese"},
            {"day": "Day 7", "breakfast": "French toast with warm berries", "lunch": "Buddha bowl with tahini dressing", "dinner": "Risotto with mushrooms and peas"}
        ],
        "pitta": [
            {"day": "Day 1", "breakfast": "Coconut milk smoothie with mango and mint", "lunch": "Cucumber raita with basmati rice and coriander dal", "dinner": "Salad with avocado and lemon dressing"},
            {"day": "Day 2", "breakfast": "Overnight oats with berries and coconut", "lunch": "Khichdi with cooling cucumber salad", "dinner": "Zucchini noodles with pesto"},
            {"day": "Day 3", "breakfast": "Fresh fruit bowl with pomegranate", "lunch": "Rice with bitter gourd sabzi and yogurt", "dinner": "Watermelon gazpacho"},
            {"day": "Day 4", "breakfast": "Coconut water with chia seeds", "lunch": "Quinoa bowl with roasted vegetables", "dinner": "Steamed rice with vegetable curry"},
            {"day": "Day 5", "breakfast": "Aloe vera juice with fresh fruits", "lunch": "Buddha bowl with tahini dressing", "dinner": "Stuffed bell peppers with rice"},
            {"day": "Day 6", "breakfast": "Melon smoothie with rose water", "lunch": "Pasta with olive oil and fresh herbs", "dinner": "Cucumber and mint soup"},
            {"day": "Day 7", "breakfast": "Rice porridge with cardamom and saffron", "lunch": "Mixed greens salad with grilled paneer", "dinner": "Vegetable biryani with raita"}
        ],
        "kapha": [
            {"day": "Day 1", "breakfast": "Warm lemon water, then light muesli with low-fat milk", "lunch": "Spicy vegetable soup with millet bread", "dinner": "Steamed vegetables with ginger-garlic sauce"},
            {"day": "Day 2", "breakfast": "Green tea with dry toast and honey", "lunch": "Quinoa salad with roasted vegetables", "dinner": "Clear vegetable broth with herbs"},
            {"day": "Day 3", "breakfast": "Warm apple with cinnamon and cloves", "lunch": "Barley vegetable soup", "dinner": "Stir-fried greens with tofu"},
            {"day": "Day 4", "breakfast": "Ginger tea with light crackers", "lunch": "Spicy lentil salad with lemon", "dinner": "Grilled vegetables with herbs"},
            {"day": "Day 5", "breakfast": "Buckwheat porridge with berries", "lunch": "Mung bean sprout salad", "dinner": "Vegetable curry with minimal oil"},
            {"day": "Day 6", "breakfast": "Hot water with lemon and cayenne", "lunch": "Ragi (finger millet) upma with vegetables", "dinner": "Mixed dal with minimal rice"},
            {"day": "Day 7", "breakfast": "Fresh vegetable juice", "lunch": "Jowar roti with spicy vegetables", "dinner": "Light soup with sprouted moong"}
        ]
    }
    
    @staticmethod
    def generate_diet_plan_pdf(dosha: str) -> bytes:
        """Generate a PDF diet plan for the specified dosha"""
        dosha = dosha.lower()
        if dosha not in DietPlannerService.DOSHA_INFO:
            raise ValueError(f"Invalid dosha: {dosha}")
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=0.5*inch,
            leftMargin=0.5*inch,
            topMargin=0.5*inch,
            bottomMargin=0.5*inch
        )
        
        styles = getSampleStyleSheet()
        story = []
        
        dosha_info = DietPlannerService.DOSHA_INFO[dosha]
        
        # Title
        title_style = ParagraphStyle(
            'Title',
            parent=styles['Title'],
            fontSize=24,
            spaceAfter=20,
            textColor=dosha_info['color']
        )
        story.append(Paragraph(f"🌿 {dosha_info['name']} Dosha", title_style))
        story.append(Paragraph("7-Day Ayurvedic Diet Plan", styles['Heading2']))
        story.append(Spacer(1, 0.2*inch))
        
        # Dosha Info Box
        info_style = ParagraphStyle(
            'Info',
            parent=styles['Normal'],
            fontSize=10,
            leading=14
        )
        story.append(Paragraph(f"<b>Element:</b> {dosha_info['element']}", info_style))
        story.append(Paragraph(f"<b>Qualities:</b> {dosha_info['qualities']}", info_style))
        story.append(Spacer(1, 0.1*inch))
        story.append(Paragraph(dosha_info['description'], info_style))
        story.append(Spacer(1, 0.2*inch))
        
        # Dietary Principles
        story.append(Paragraph("📋 Dietary Principles", styles['Heading3']))
        for principle in dosha_info['dietary_principles']:
            story.append(Paragraph(f"• {principle}", info_style))
        story.append(Spacer(1, 0.3*inch))
        
        # 7-Day Meal Plan Table
        story.append(Paragraph("🍽️ Your 7-Day Meal Plan", styles['Heading3']))
        story.append(Spacer(1, 0.1*inch))
        
        # Table Header
        meal_plan = DietPlannerService.MEAL_PLANS[dosha]
        table_data = [["Day", "Breakfast", "Lunch", "Dinner"]]
        
        for day in meal_plan:
            table_data.append([
                day['day'],
                Paragraph(day['breakfast'], info_style),
                Paragraph(day['lunch'], info_style),
                Paragraph(day['dinner'], info_style)
            ])
        
        table = Table(table_data, colWidths=[0.6*inch, 2.0*inch, 2.2*inch, 2.0*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), dosha_info['color']),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.Color(0.95, 0.95, 0.95)),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.Color(0.95, 0.95, 0.95)]),
            ('TOPPADDING', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ]))
        
        story.append(table)
        story.append(Spacer(1, 0.3*inch))
        
        # Disclaimer
        disclaimer_style = ParagraphStyle(
            'Disclaimer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            leading=10
        )
        story.append(Paragraph(
            "<b>Disclaimer:</b> This diet plan is for general wellness information only and should not replace professional medical advice. "
            "Please consult a qualified Ayurvedic practitioner or healthcare provider before making significant dietary changes.",
            disclaimer_style
        ))
        story.append(Spacer(1, 0.1*inch))
        story.append(Paragraph(
            f"Generated by AyurVeda Platform on {datetime.now().strftime('%B %d, %Y')}",
            disclaimer_style
        ))
        
        doc.build(story)
        return buffer.getvalue()
