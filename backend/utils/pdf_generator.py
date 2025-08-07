# backend/utils/pdf_generator.py
import os
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, black, white
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.platypus import PageBreak, KeepTogether
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class PDFGenerator:
    def __init__(self):
        self.primary_color = HexColor('#667eea')
        self.secondary_color = HexColor('#764ba2')
        self.text_color = HexColor('#1e293b')
        self.light_gray = HexColor('#f8fafc')
        
    def generate_resume_pdf(self, resume_data):
        """Generate a professional PDF resume from resume data"""
        try:
            # Create output directory
            output_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'resumes', 'generated')
            os.makedirs(output_dir, exist_ok=True)
            
            # Generate filename with timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'sai_teja_reddy_resume_{timestamp}.pdf'
            filepath = os.path.join(output_dir, filename)
            
            # Create PDF document
            doc = SimpleDocTemplate(
                filepath,
                pagesize=letter,
                rightMargin=0.75*inch,
                leftMargin=0.75*inch,
                topMargin=0.75*inch,
                bottomMargin=0.75*inch
            )
            
            # Build content
            story = []
            styles = self._create_styles()
            
            # Add header
            self._add_header(story, resume_data, styles)
            story.append(Spacer(1, 0.3*inch))
            
            # Add professional summary
            self._add_summary(story, resume_data, styles)
            story.append(Spacer(1, 0.2*inch))
            
            # Add core competencies
            self._add_competencies(story, resume_data, styles)
            story.append(Spacer(1, 0.2*inch))
            
            # Add experience
            self._add_experience(story, resume_data, styles)
            story.append(Spacer(1, 0.2*inch))
            
            # Add education
            self._add_education(story, resume_data, styles)
            story.append(Spacer(1, 0.2*inch))
            
            # Add skills
            self._add_skills(story, resume_data, styles)
            story.append(Spacer(1, 0.2*inch))
            
            # Add projects
            self._add_projects(story, resume_data, styles)
            
            # Add certifications
            self._add_certifications(story, resume_data, styles)
            
            # Build PDF
            doc.build(story)
            logger.info(f"Generated PDF resume: {filepath}")
            
            return filepath
            
        except Exception as e:
            logger.error(f"Error generating PDF: {str(e)}")
            raise Exception(f"Failed to generate PDF resume: {str(e)}")
    
    def _create_styles(self):
        """Create custom styles for the PDF"""
        styles = getSampleStyleSheet()
        
        # Header styles
        styles.add(ParagraphStyle(
            name='Name',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=self.primary_color,
            fontName='Helvetica-Bold',
            alignment=TA_CENTER,
            spaceAfter=6
        ))
        
        styles.add(ParagraphStyle(
            name='Title',
            parent=styles['Normal'],
            fontSize=14,
            textColor=self.secondary_color,
            fontName='Helvetica',
            alignment=TA_CENTER,
            spaceAfter=12
        ))
        
        styles.add(ParagraphStyle(
            name='Contact',
            parent=styles['Normal'],
            fontSize=10,
            textColor=self.text_color,
            fontName='Helvetica',
            alignment=TA_CENTER,
            spaceAfter=12
        ))
        
        # Section styles
        styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=self.primary_color,
            fontName='Helvetica-Bold',
            spaceBefore=12,
            spaceAfter=8,
            borderWidth=0,
            borderColor=self.primary_color,
            borderPadding=4
        ))
        
        styles.add(ParagraphStyle(
            name='JobTitle',
            parent=styles['Normal'],
            fontSize=12,
            textColor=self.text_color,
            fontName='Helvetica-Bold',
            spaceBefore=8,
            spaceAfter=2
        ))
        
        styles.add(ParagraphStyle(
            name='Company',
            parent=styles['Normal'],
            fontSize=11,
            textColor=self.primary_color,
            fontName='Helvetica-Bold',
            spaceAfter=2
        ))
        
        styles.add(ParagraphStyle(
            name='Duration',
            parent=styles['Normal'],
            fontSize=10,
            textColor=self.text_color,
            fontName='Helvetica',
            spaceAfter=6
        ))
        
        styles.add(ParagraphStyle(
            name='BulletPoint',
            parent=styles['Normal'],
            fontSize=10,
            textColor=self.text_color,
            fontName='Helvetica',
            leftIndent=20,
            bulletIndent=10,
            spaceAfter=3
        ))
        
        return styles
    
    def _add_header(self, story, resume_data, styles):
        """Add header with name and contact information"""
        personal = resume_data.get('personal_info', {})
        
        # Name
        name = personal.get('name', 'Sai Teja Reddy')
        story.append(Paragraph(name, styles['Name']))
        
        # Title
        title = personal.get('title', 'AI/ML Engineer & Data Scientist')
        story.append(Paragraph(title, styles['Title']))
        
        # Contact information
        contact_info = []
        if personal.get('email'):
            contact_info.append(personal['email'])
        if personal.get('phone'):
            contact_info.append(personal['phone'])
        if personal.get('location'):
            contact_info.append(personal['location'])
        if personal.get('linkedin'):
            contact_info.append('LinkedIn Profile Available')
        
        contact_text = ' | '.join(contact_info)
        story.append(Paragraph(contact_text, styles['Contact']))
    
    def _add_summary(self, story, resume_data, styles):
        """Add professional summary"""
        story.append(Paragraph('PROFESSIONAL SUMMARY', styles['SectionHeader']))
        
        personal = resume_data.get('personal_info', {})
        summary = personal.get('summary', 
            'Experienced AI/ML Engineer with 5+ years of production experience in machine learning, '
            'deep learning, and data science. Passionate about using technology to solve real-world '
            'problems and help others through education and innovation.')
        
        story.append(Paragraph(summary, styles['Normal']))
    
    def _add_competencies(self, story, resume_data, styles):
        """Add core competencies"""
        competencies = resume_data.get('core_competencies', [])
        if not competencies:
            return
        
        story.append(Paragraph('CORE COMPETENCIES', styles['SectionHeader']))
        
        # Split competencies into columns for better layout
        comp_text = ' • '.join(competencies)
        story.append(Paragraph(comp_text, styles['Normal']))
    
    def _add_experience(self, story, resume_data, styles):
        """Add work experience"""
        experiences = resume_data.get('experience', [])
        if not experiences:
            return
        
        story.append(Paragraph('PROFESSIONAL EXPERIENCE', styles['SectionHeader']))
        
        for exp in experiences:
            # Job title and company
            title = exp.get('title', '')
            company = exp.get('company', '')
            location = exp.get('location', '')
            start_date = exp.get('start_date', '')
            end_date = exp.get('end_date', 'Present')
            
            story.append(Paragraph(title, styles['JobTitle']))
            story.append(Paragraph(f"{company}, {location}", styles['Company']))
            story.append(Paragraph(f"{start_date} - {end_date}", styles['Duration']))
            
            # Responsibilities
            responsibilities = exp.get('responsibilities', [])
            for resp in responsibilities:
                story.append(Paragraph(f"• {resp}", styles['BulletPoint']))
            
            # Achievements
            achievements = exp.get('achievements', [])
            if achievements:
                for achievement in achievements:
                    story.append(Paragraph(f"⭐ {achievement}", styles['BulletPoint']))
            
            story.append(Spacer(1, 0.1*inch))
    
    def _add_education(self, story, resume_data, styles):
        """Add education information"""
        education = resume_data.get('education', [])
        if not education:
            return
        
        story.append(Paragraph('EDUCATION', styles['SectionHeader']))
        
        for edu in education:
            degree = edu.get('degree', '')
            field = edu.get('field', '')
            institution = edu.get('institution', '')
            location = edu.get('location', '')
            start_date = edu.get('start_date', '')
            end_date = edu.get('end_date', '')
            gpa = edu.get('gpa', '')
            
            # Degree and field
            degree_text = f"{degree}"
            if field:
                degree_text += f" in {field}"
            story.append(Paragraph(degree_text, styles['JobTitle']))
            
            # Institution and location
            story.append(Paragraph(f"{institution}, {location}", styles['Company']))
            
            # Duration and GPA
            duration_text = f"{start_date} - {end_date}"
            if gpa:
                duration_text += f" | GPA: {gpa}"
            story.append(Paragraph(duration_text, styles['Duration']))
            
            story.append(Spacer(1, 0.1*inch))
    
    def _add_skills(self, story, resume_data, styles):
        """Add skills section"""
        skills = resume_data.get('skills', {})
        if not skills:
            return
        
        story.append(Paragraph('TECHNICAL SKILLS', styles['SectionHeader']))
        
        for category, skill_list in skills.items():
            if skill_list:
                category_name = category.replace('_', ' ').title()
                skills_text = ', '.join(skill_list)
                story.append(Paragraph(f"<b>{category_name}:</b> {skills_text}", styles['Normal']))
                story.append(Spacer(1, 0.05*inch))
    
    def _add_projects(self, story, resume_data, styles):
        """Add projects section"""
        projects = resume_data.get('projects', [])
        if not projects:
            return
        
        story.append(Paragraph('KEY PROJECTS', styles['SectionHeader']))
        
        for project in projects[:3]:  # Limit to top 3 projects for space
            title = project.get('title', '')
            description = project.get('description', '')
            technologies = project.get('technologies', [])
            achievements = project.get('achievements', [])
            
            story.append(Paragraph(title, styles['JobTitle']))
            story.append(Paragraph(description, styles['Normal']))
            
            if technologies:
                tech_text = f"<b>Technologies:</b> {', '.join(technologies)}"
                story.append(Paragraph(tech_text, styles['Normal']))
            
            if achievements:
                for achievement in achievements[:2]:  # Limit achievements
                    story.append(Paragraph(f"• {achievement}", styles['BulletPoint']))
            
            story.append(Spacer(1, 0.1*inch))
    
    def _add_certifications(self, story, resume_data, styles):
        """Add certifications section"""
        certifications = resume_data.get('certifications', [])
        if not certifications:
            return
        
        story.append(Paragraph('CERTIFICATIONS', styles['SectionHeader']))
        
        for cert in certifications:
            name = cert.get('name', '')
            issuer = cert.get('issuer', '')
            date = cert.get('date', '')
            
            cert_text = f"• {name}"
            if issuer:
                cert_text += f" - {issuer}"
            if date:
                cert_text += f" ({date})"
            
            story.append(Paragraph(cert_text, styles['BulletPoint']))
        
        story.append(Spacer(1, 0.1*inch))