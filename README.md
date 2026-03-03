# Seren AI

Seren AI is an AI-powered mental health support platform with a React + Vite frontend and a Node.js + Express backend. It provides a structured intake assessment, personalized therapy-style chat, mood tracking, and AI-assisted journaling, plus a guided breathing exercise for calming support.

## What We Built

- Structured 7-question mental health assessment that personalizes the AI therapy style.
- AI therapist chat with memory and risk-aware prompts.
- Voice therapy experience via Gemini conversational AI.
- Mood tracking with trends and statistics.
- AI-assisted journaling with sentiment analysis and insights.
- Privacy-first authentication with optional anonymous access.

## Tech Stack

Frontend
- React 19 + Vite 7
- React Router
- Tailwind CSS
- Axios
- Gemini Conversational AI (voice therapy)

Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- OpenAI-compatible LLM client (Groq)
- Optional Docker + Docker Compose

## Architecture Overview

- Frontend (React) calls the backend API using Axios.
- Backend (Express) handles auth, assessments, chat, mood, and journal features.
- MongoDB stores users, assessments, chat messages, mood entries, and journal entries.
- LLM integration generates therapy-style responses and journal insights.

## Repository Structure

- backend/ - Express server, API routes, services, MongoDB models
- frontend/ - React app, routes, UI pages, API client
- idea.md - Initial planning notes

## Setup

Clone the repository:

```bash
git clone https://github.com/iam-spoorthy/serenai
cd serenai
```

### Prerequisites

- Node.js 18+
- MongoDB (local or Docker)
- Groq API key (OpenAI-compatible)
- Gemini API key
- (Optional) Docker + Docker Compose

### Backend

From the repository root:

```bash
cd backend
npm install
```

Create a .env file in backend/:

```bash
PORT=5000
MONGO_URL=mongodb://localhost:27017/mindwise_db
JWT_SECRET=your_random_secret
GROQ_API_KEY=your_groq_api_key
# Optional override
GROQ_MODEL=llama-3.3-70b-versatile
NODE_ENV=development
```

Start the server:

```bash
npm run dev
```

Docker (optional):

```bash
docker-compose up --build
```

### Frontend

From the repository root:

```bash
cd frontend
npm install
```

Create a .env file in frontend/:

```bash
VITE_GEMINI_API_KEY=your_gemini_api_key
```

Start the frontend:

```bash
npm run dev
```

By default, the frontend expects the backend at http://localhost:5000/api. You can update the base URL in frontend/src/services/api.js if needed.

## Key Features by Module

Frontend pages
- Login and Signup with anonymous access option
- Dashboard for assessment summary and navigation
- Assessment flow (7 questions) with results and therapy style
- AI Chat with Gemini voice and transcript history
- Mood tracker with stats and trends
- Journal with AI insights and sentiment labels
- Guided breathing exercise (4-4-8)

Backend services
- Auth service (JWT, anonymous accounts)
- Assessment scoring and recommendations
- Chat service with memory, therapy-style prompts, and risk handling
- Mood tracking service with stats
- Journal service with sentiment analysis and AI insights

## Scripts

Backend
- npm run dev - start server with nodemon
- npm start - start server

Frontend
- npm run dev - start Vite dev server
- npm run build - production build
- npm run preview - preview build
- npm run lint - run ESLint

## Notes

- MindWise AI is not a substitute for professional mental health care.
- If you enable real deployments, update the frontend API base URL and configure secure secrets.
