# 🤖 Sai Teja Reddy - AI-Powered Interactive Resume

A next-generation interactive resume website showcasing AI/ML engineering expertise through cutting-edge technology and intelligent interactions.

## 🌟 Features

### 🎯 Core Functionality
- **AI-Powered Chatbot**: Dual-mode AI assistant (Strict/Open) with RAG capabilities
- **Interactive Elements**: Click any resume element for AI explanations
- **Dynamic Resume Generation**: Both uploaded PDF and dynamically generated versions
- **Real-time Analytics**: Custom analytics dashboard with user engagement tracking
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### 🚀 Advanced Features
- **Text Selection AI**: Select any text for instant AI explanations
- **Space-themed Intro**: Immersive landing page with sound effects and animations
- **Resizable Chat Interface**: Drag to resize, minimize, and customize chat experience
- **Performance Optimized**: Lazy loading, debounced interactions, and efficient rendering
- **Theme Toggle**: Dark/Light mode with smooth transitions

### 🧠 AI Capabilities
- **Retrieval Augmented Generation (RAG)**: Context-aware responses using FAISS vector search
- **LLM Integration**: Together API with Llama-2 for intelligent conversations
- **Semantic Search**: Sentence transformers for relevant content retrieval
- **Conversation Memory**: Persistent chat history and session management

## 🛠 Technology Stack

### Frontend
- **HTML5/CSS3**: Modern semantic structure and styling
- **Vanilla JavaScript**: High-performance interactive features
- **CSS Animations**: Space-themed particle effects and smooth transitions
- **Web APIs**: Speech recognition, file handling, and analytics

### Backend
- **Python Flask**: Lightweight and scalable REST API
- **Sentence Transformers**: For text embeddings and semantic search
- **FAISS**: Vector similarity search for RAG implementation
- **ReportLab**: Dynamic PDF generation
- **Together API**: LLM integration for chat responses

### AI/ML Components
- **RAG Pipeline**: Custom implementation with vector storage
- **Text Processing**: NLTK and spaCy for natural language understanding
- **Embedding Generation**: all-MiniLM-L6-v2 for semantic similarity
- **Context Management**: Intelligent context retrieval and conversation flow

## 📁 Project Structure

```
sai-ai-resume/
├── frontend/                          # Static files for Netlify
│   ├── index.html                    # Landing page
│   ├── main.html                     # Main resume website
│   ├── admin.html                    # Analytics dashboard
│   ├── assets/
│   │   ├── css/
│   │   │   ├── main.css             # Main styling
│   │   │   ├── animations.css        # Advanced animations
│   │   │   └── intro.css            # Landing page styles
│   │   ├── js/
│   │   │   ├── main.js              # Core functionality
│   │   │   ├── chatbot.js           # AI chat interface
│   │   │   ├── analytics.js         # Custom analytics
│   │   │   └── utils.js             # Utility functions
│   │   ├── sounds/                   # Audio effects
│   │   ├── videos/                   # Background videos
│   │   └── images/                   # Profile and tech icons
│   └── resumes/
│       └── sai_resume.pdf           # Original PDF resume
├── backend/                          # Python Flask server
│   ├── app.py                       # Main Flask application
│   ├── models/
│   │   ├── rag_model.py            # RAG implementation
│   │   └── chat_model.py           # Chat logic
│   ├── utils/
│   │   ├── analytics.py            # Analytics processing
│   │   └── pdf_generator.py        # Dynamic PDF creation
│   └── data/
│       ├── resume_data.json        # Resume content
│       ├── conversations.json      # Chat history
│       └── analytics.json          # User analytics
├── requirements.txt                 # Python dependencies
├── netlify.toml                    # Netlify configuration
└── README.md                       # This file
```

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+ (for deployment tools)
- Git

### Local Development

1. **Clone the repository**:
```bash
git clone <your-repo-url>
cd sai-ai-resume
```

2. **Set up Python environment**:
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
```

3. **Install Python dependencies**:
```bash
pip install -r requirements.txt
```

4. **Create environment variables**:
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

5. **Run the backend**:
```bash
cd backend
python app.py
```

6. **Serve the frontend**:
```bash
# Install Live Server extension in VS Code
# Right-click on frontend/index.html
# Select "Open with Live Server"
```

### Environment Variables

Create a `.env` file in the project root:

```env
TOGETHER_API_KEY=your_together_api_key_here
FLASK_SECRET_KEY=your_secret_key_here
ADMIN_PASSWORD=your_admin_password
FLASK_ENV=development
```

## 🌐 Deployment

### Backend Deployment (Railway)

1. **Install Railway CLI**:
```bash
npm install -g @railway/cli
```

2. **Deploy**:
```bash
railway login
railway init
railway up
```

### Frontend Deployment (Netlify)

1. **Build and deploy**:
   - Drag and drop `frontend` folder to Netlify
   - Or connect GitHub repository
   - Set publish directory to `frontend`

2. **Update API URL**:
   - Replace `API_BASE_URL` in JavaScript files
   - Point to your deployed backend URL

## 🎯 Key Features Implementation

### AI Chatbot
- **Dual Mode Operation**: Strict (resume-focused) and Open (general conversation)
- **RAG Integration**: Uses FAISS for semantic search across resume content
- **Context Awareness**: Understands current page section and selected text
- **Response Personalization**: Always maintains positive tone and highlights strengths

### Interactive Elements
- **Text Selection**: Select any text for AI-powered explanations
- **Clickable Components**: Every skill, experience, and project is interactive
- **Hover Effects**: Dynamic particle effects and smooth animations
- **Scroll Animations**: Elements animate into view as user scrolls

### Analytics Dashboard
- **Real-time Tracking**: Page views, chat interactions, and user engagement
- **Heatmap Data**: Mouse movement and click tracking
- **Session Analysis**: Time spent, scroll depth, and conversion funnel
- **Privacy-Focused**: Respects user preferences and GDPR compliance

## 🔧 Customization

### Resume Content
Edit `backend/data/resume_data.json` to update:
- Personal information
- Work experience
- Skills and competencies
- Projects and achievements
- Educational background

### AI Behavior
Modify `backend/models/chat_model.py` to adjust:
- Response tone and style
- Knowledge base integration
- Context processing logic
- Follow-up suggestions

### Styling and Animations
Update `frontend/assets/css/` files to customize:
- Color scheme and themes
- Animation effects and transitions
- Layout and responsive design
- Component styling

## 📊 Analytics Features

### User Engagement Tracking
- Page load times and performance metrics
- Click patterns and user flow analysis
- Chat interaction quality and completion rates
- Geographic and demographic insights

### Custom Events
- Resume download tracking
- Section navigation patterns
- AI chat mode preferences
- Feature usage analytics

## 🎨 Design Philosophy

### AI-First Experience
Every interaction showcases artificial intelligence capabilities while maintaining a human touch. The website doesn't just display information—it intelligently responds and adapts to user behavior.

### Performance Optimized
- Lazy loading for images and heavy resources
- Debounced interactions to prevent excessive API calls
- Efficient vector search with FAISS indexing
- Progressive enhancement for all devices

### Accessibility Focused
- Semantic HTML structure
- Keyboard navigation support
- Screen reader compatibility
- High contrast ratios and readable fonts

## 🤝 Contributing

This project serves as a comprehensive example of AI-powered web development. Feel free to:

1. **Fork the repository**
2. **Create feature branches**
3. **Submit pull requests**
4. **Share improvements and suggestions**

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🌟 Acknowledgments

- **Together AI** for LLM API access
- **Hugging Face** for transformer models and tools
- **Sentence Transformers** for semantic embedding generation
- **FAISS** for efficient similarity search
- **ReportLab** for PDF generation capabilities

## 📞 Contact

**Sai Teja Reddy**
- Email: saitejareddyg97@gmail.com
- LinkedIn: [Sai Teja Reddy](https://www.linkedin.com/in/sai-teja-reddy-b5846322b/)
- Phone: +1 (248) 803-3210
- Location: Edmond, Oklahoma, USA

---

*Built with ❤️ and cutting-edge AI technology to showcase the future of interactive resumes.*