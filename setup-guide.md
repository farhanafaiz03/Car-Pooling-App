# Commute.io Setup Guide with GenAI Chatbot

This guide will walk you through setting up the complete Commute.io application with the integrated GenAI chatbot feature.

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** - For the backend server
- **Node.js 16+** - For the frontend application
- **OpenAI API Key** - For the AI chatbot functionality
- **Git** - For version control

### 1. Environment Setup

#### Backend Environment
```bash
cd backend
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
# Database
DATABASE_URL=sqlite:///./commute_io.db

# Security
SECRET_KEY=your-super-secret-key-change-in-production

# OpenAI (REQUIRED for AI Chat)
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo

# Email (Optional)
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:8081

# Environment
ENVIRONMENT=development
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup database
alembic upgrade head

# Start backend server
python run_server.py
```

The backend will be available at: `http://localhost:8000`
API Documentation: `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
# Navigate to project root (if in backend directory)
cd ..

# Install dependencies
npm install

# Start frontend development server
npm run dev
```

The frontend will be available at: `http://localhost:8081`

## 🤖 GenAI Chatbot Features

### What's Included

1. **OpenAI Integration**: Uses GPT-3.5-turbo for intelligent responses
2. **Context-Aware**: Understands rideshare-specific queries
3. **Real-time Chat**: Instant responses with typing indicators
4. **Status Monitoring**: Shows AI service availability
5. **Error Handling**: Graceful fallbacks when AI is unavailable

### How to Use

1. **Access the Chat**: Navigate to the "Ride Chat" screen from the home page
2. **Start Chatting**: Type your rideshare-related questions
3. **Get Help**: Ask about booking rides, safety tips, app features, etc.

### Example Queries

- "How do I book a ride?"
- "What safety features does the app have?"
- "How do I become a driver?"
- "What should I do if my ride is late?"
- "How does the rating system work?"

## 🔧 Configuration

### OpenAI API Key Setup

1. **Get API Key**:
   - Visit [OpenAI Platform](https://platform.openai.com/)
   - Create an account or sign in
   - Go to API Keys section
   - Create a new secret key

2. **Add to Environment**:
   ```env
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

3. **Test the Integration**:
   - Start both backend and frontend
   - Navigate to the AI chat screen
   - Send a test message

### Model Configuration

You can change the AI model in your `.env` file:
```env
OPENAI_MODEL=gpt-3.5-turbo  # Default (recommended)
# OPENAI_MODEL=gpt-4        # More powerful but slower/expensive
```

## 🧪 Testing the Setup

### 1. Backend Health Check
```bash
curl http://localhost:8000/api/health
```

### 2. AI Service Status
```bash
curl http://localhost:8000/api/ai/chat/status
```

### 3. Test AI Chat
```bash
curl -X POST http://localhost:8000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message": "Hello, how can you help me?"}'
```

## 🚨 Troubleshooting

### Common Issues

#### 1. "AI service is currently unavailable"
- **Cause**: Missing or invalid OpenAI API key
- **Solution**: Check your `.env` file and ensure `OPENAI_API_KEY` is set correctly

#### 2. "Failed to fetch" errors
- **Cause**: Backend server not running
- **Solution**: Start the backend server with `python run_server.py`

#### 3. Database errors
- **Cause**: Database not initialized
- **Solution**: Run `alembic upgrade head` in the backend directory

#### 4. CORS errors
- **Cause**: Frontend and backend on different ports
- **Solution**: Ensure `FRONTEND_URL` in `.env` matches your frontend URL

### Debug Mode

Enable debug logging by setting:
```env
ENVIRONMENT=development
```

This will show detailed logs including AI responses and API calls.

## 📱 Mobile Development

### Running on Mobile Device

1. **Install Expo Go** on your mobile device
2. **Start the development server**: `npm run dev`
3. **Scan QR code** with Expo Go app
4. **Test AI chat** on your mobile device

### Building for Production

```bash
# Web build
npm run build:web

# Mobile builds (requires EAS)
npx eas build --platform ios
npx eas build --platform android
```

## 🔒 Security Considerations

### API Key Security
- Never commit API keys to version control
- Use environment variables for all sensitive data
- Rotate API keys regularly
- Monitor API usage and costs

### Rate Limiting
The OpenAI integration includes basic error handling, but consider implementing:
- Request rate limiting
- User message quotas
- Cost monitoring

## 📊 Monitoring & Analytics

### AI Usage Tracking
Monitor your AI chatbot usage:
- OpenAI API dashboard for usage statistics
- Backend logs for error tracking
- User feedback collection

### Performance Optimization
- Cache common responses
- Implement conversation context limits
- Use streaming responses for long messages

## 🆘 Support

### Getting Help
1. Check the troubleshooting section above
2. Review backend logs for error details
3. Test API endpoints individually
4. Verify environment configuration

### Development Resources
- **Backend API Docs**: `http://localhost:8000/docs`
- **OpenAI Documentation**: https://platform.openai.com/docs
- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **React Native Documentation**: https://reactnative.dev/

## 🎉 Success!

If everything is set up correctly, you should have:
- ✅ Backend server running on port 8000
- ✅ Frontend app running on port 8081
- ✅ AI chatbot responding to messages
- ✅ Real-time chat interface working
- ✅ Status indicators showing AI availability

Your Commute.io app with GenAI chatbot is now ready for development and testing!