from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.graphics.shapes import Drawing, Wedge, String
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics import renderPDF
import math
import os

# Create a function to generate the Yes/No Decision Wheel Template
def create_yes_no_template(output_filename):
    doc = SimpleDocTemplate(output_filename, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Title'],
        fontSize=24,
        alignment=1,
        spaceAfter=20
    )
    
    heading_style = ParagraphStyle(
        'Heading',
        parent=styles['Heading2'],
        fontSize=16,
        spaceBefore=15,
        spaceAfter=10
    )
    
    normal_style = ParagraphStyle(
        'Normal',
        parent=styles['Normal'],
        fontSize=12,
        spaceBefore=6,
        spaceAfter=6
    )
    
    # Content elements
    elements = []
    
    # Title
    elements.append(Paragraph("Yes/No Decision Wheel Template", title_style))
    elements.append(Paragraph("Fortune Twister - www.fortunetwister.com", styles['Italic']))
    elements.append(Spacer(1, 20))
    
    # Introduction
    elements.append(Paragraph("Introduction", heading_style))
    intro_text = """
    This template helps you make binary (yes/no) decisions when you're feeling stuck or indecisive. 
    Use this wheel when you need a clear answer between two options and want to remove bias from your decision-making process.
    """
    elements.append(Paragraph(intro_text, normal_style))
    elements.append(Spacer(1, 10))
    
    # How to use section
    elements.append(Paragraph("How to Use This Template", heading_style))
    how_to_text = """
    1. <b>Define your question</b>: Write down a clear yes/no question in the space provided below.
    2. <b>Consider the implications</b>: Before spinning, write down what a "Yes" or "No" answer would mean for you.
    3. <b>Spin the wheel</b>: Use Fortune Twister's online wheel spinner at www.fortunetwister.com or print and use a physical spinner.
    4. <b>Reflect on your reaction</b>: Pay attention to your immediate emotional response to the result.
    5. <b>Make your decision</b>: Use the result as guidance, but remember you always have the final say.
    """
    elements.append(Paragraph(how_to_text, normal_style))
    elements.append(Spacer(1, 15))
    
    # Question section
    elements.append(Paragraph("Your Decision Question", heading_style))
    elements.append(Paragraph("Write your yes/no question here:", normal_style))
    
    # Create a table for the question box
    question_data = [[""]]
    question_table = Table(question_data, colWidths=[450], rowHeights=[40])
    question_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(question_table)
    elements.append(Spacer(1, 15))
    
    # Implications section
    elements.append(Paragraph("Decision Implications", heading_style))
    
    implications_data = [
        ["If YES:", "If NO:"],
        ["", ""],
        ["", ""],
        ["", ""]
    ]
    
    implications_table = Table(implications_data, colWidths=[225, 225], rowHeights=[20, 40, 40, 40])
    implications_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, colors.black),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (0, 0), (0, 0), colors.lightgreen),
        ('BACKGROUND', (1, 0), (1, 0), colors.lightcoral),
        ('FONTNAME', (0, 0), (1, 0), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (1, 0), 'CENTER'),
    ]))
    elements.append(implications_table)
    elements.append(Spacer(1, 20))
    
    # Create a simple wheel drawing
    elements.append(Paragraph("Decision Wheel", heading_style))
    
    # Create a drawing for the wheel
    wheel_size = 300
    drawing = Drawing(wheel_size, wheel_size)
    
    # Create the wheel with two segments
    center_x = wheel_size / 2
    center_y = wheel_size / 2
    radius = wheel_size / 2 - 10
    
    # Yes segment (green)
    yes_wedge = Wedge(center_x, center_y, radius, 0, 180, fillColor=colors.lightgreen)
    drawing.add(yes_wedge)
    
    # No segment (red)
    no_wedge = Wedge(center_x, center_y, radius, 180, 360, fillColor=colors.lightcoral)
    drawing.add(no_wedge)
    
    # Add text to the segments
    yes_text = String(center_x - radius/2, center_y + radius/3, "YES", fontSize=24, fillColor=colors.black)
    no_text = String(center_x + radius/2, center_y - radius/3, "NO", fontSize=24, fillColor=colors.black)
    drawing.add(yes_text)
    drawing.add(no_text)
    
    # Add a center point
    drawing.add(Wedge(center_x, center_y, 10, 0, 360, fillColor=colors.black))
    
    elements.append(drawing)
    elements.append(Spacer(1, 20))
    
    # Reflection section
    elements.append(Paragraph("Decision Reflection", heading_style))
    elements.append(Paragraph("After spinning the wheel, record your immediate reaction and final decision:", normal_style))
    
    reflection_data = [
        ["Wheel Result:", ""],
        ["My Immediate Reaction:", ""],
        ["Additional Thoughts:", ""],
        ["Final Decision:", ""]
    ]
    
    reflection_table = Table(reflection_data, colWidths=[150, 300], rowHeights=[30, 40, 60, 40])
    reflection_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, colors.black),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ]))
    elements.append(reflection_table)
    elements.append(Spacer(1, 20))
    
    # Footer
    footer_text = """
    <i>This template is provided by Fortune Twister (www.fortunetwister.com), a free online wheel spinner tool for random selection and decision making. 
    Visit our website for more templates and tools to help with decision-making, random selection, and more.</i>
    """
    elements.append(Paragraph(footer_text, normal_style))
    
    # Build the PDF
    doc.build(elements)
    
    return output_filename

# Create the Yes/No Decision Wheel Template
output_file = "/home/ubuntu/fortune-twister-seo/templates/decision-making/yes_no_decision_wheel_template.pdf"
create_yes_no_template(output_file)
