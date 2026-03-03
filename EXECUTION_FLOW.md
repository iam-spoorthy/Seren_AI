# SerenAI — Complete Execution Flow Map

> **Every file. Every function call. Every connection. In depth.**
>
> This document traces exactly WHERE execution starts, WHERE it goes next,
> and WHICH file calls WHICH file — for both backend and frontend.

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Backend Startup Flow](#2-backend-startup-flow)
3. [Frontend Startup Flow](#3-frontend-startup-flow)
4. [Feature Flows (End-to-End)](#4-feature-flows-end-to-end)
   - [Authentication (Signup / Login)](#41-authentication-signup--login)
   - [Assessment (7-Question Test)](#42-assessment-7-question-test)
   - [AI Chat (Therapist Conversation)](#43-ai-chat-therapist-conversation)
   - [Mood Tracking](#44-mood-tracking)
   - [Journal (AI Insights)](#45-journal-ai-insights)
   - [Breathing Exercise](#46-breathing-exercise)
5. [Middleware Pipeline](#5-middleware-pipeline)
6. [File Dependency Map](#6-file-dependency-map)
7. [Database Flow](#7-database-flow)
8. [Docker Startup Flow](#8-docker-startup-flow)
9. [Unused / Available Files](#9-unused--available-files)

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                               │
│                                                                     │
│  index.html                                                         │
│    └─► main.jsx                                                     │
│          └─► BrowserRouter                                          │
│                └─► AuthProvider (AuthContext.jsx)                    │
│                      └─► App.jsx (Routes)                           │
│                            ├─► LoginPage / SignupPage  (public)     │
│                            └─► ProtectedRoute                      │
│                                  ├─► DashboardPage                  │
│                                  ├─► AssessmentPage                 │
│                                  ├─► ChatPage                       │
│                                  ├─► MoodPage                       │
│                                  ├─► JournalPage                    │
│                                  └─► BreathingExercisePage          │
│                                                                     │
│  Every page calls ──► api.js (Axios) ──────────────────────────┐    │
└────────────────────────────────────────────────────────────────│────┘
                                                                 │
                            HTTP Request (with JWT)              │
                                                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     EXPRESS BACKEND (port 5000)                      │
│                                                                     │
│  Dockerfile CMD ──► server.js                                       │
│                       ├─► config/db.js (connect MongoDB)            │
│                       └─► app.js                                    │
│                             ├─► Middleware (JSON, CORS)             │
│                             ├─► routes/*.routes.js                  │
│                             │     └─► auth.middleware.js (JWT check) │
│                             │           └─► controllers/*.js        │
│                             │                 └─► services/*.js     │
│                             │                       ├─► models/*.js │
│                             │                       └─► Groq AI API │
│                             ├─► Error Handler                       │
│                             └─► 404 Handler                         │
└─────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
                              ┌───────────────────┐
                              │  MongoDB Database  │
                              │  (port 27017)      │
                              └───────────────────┘
```

---

## 2. Backend Startup Flow

### Step-by-step: What happens when `node src/server.js` runs

```
STEP 1: Dockerfile
  File: backend/Dockerfile
  Action: CMD ["node", "src/server.js"]
  Calls: ──► backend/src/server.js

STEP 2: server.js
  File: backend/src/server.js
  Action: require("dotenv").config()  → loads .env variables
  Action: require("./app")            → imports Express app
  Action: require("./config/db")      → imports connectDB function
  Calls: ──► connectDB()  (STEP 3)
  Then:  ──► app.listen(PORT)  (STEP 4)

STEP 3: config/db.js
  File: backend/src/config/db.js
  Action: mongoose.connect(process.env.MONGO_URL)
  Result: MongoDB connected ✅ → returns to server.js
  On Fail: process.exit(1) → server dies, never reaches STEP 4

STEP 4: app.js (loaded by require in STEP 2, runs now via listen)
  File: backend/src/app.js
  Action: Creates Express app, sets up middleware pipeline:
    4a. express.json()          → parse JSON request bodies
    4b. express.urlencoded()    → parse form data
    4c. cors({...})             → allow frontend cross-origin requests
    4d. GET "/"                 → health check endpoint
    4e. Mount routes:
        ├── "/api/auth"       → require("./routes/auth.routes")
        ├── "/api/assessment" → require("./routes/assessment.routes")
        ├── "/api/chat"       → require("./routes/chat.routes")
        ├── "/api/mood"       → require("./routes/mood.routes")
        └── "/api/journal"    → require("./routes/journal.routes")
    4f. Global error handler   → catches unhandled errors
    4g. 404 handler            → catches unknown routes

  Result: Server is running, accepting HTTP requests on PORT ✅
```

### Startup Flow Diagram

```
Dockerfile CMD
      │
      ▼
  server.js ──require──► app.js (configures Express)
      │                     │
      │                     ├── require ──► routes/auth.routes.js
      │                     ├── require ──► routes/assessment.routes.js
      │                     ├── require ──► routes/chat.routes.js
      │                     ├── require ──► routes/mood.routes.js
      │                     └── require ──► routes/journal.routes.js
      │
      ├── connectDB() ──► config/db.js ──► mongoose.connect() ──► MongoDB
      │
      └── app.listen(5000) ──► Server is live!
```

---

## 3. Frontend Startup Flow

### Step-by-step: What happens when user opens the app in browser

```
STEP 1: index.html
  File: frontend/index.html
  Action: Browser loads HTML, finds <script type="module" src="/src/main.jsx">
  Calls: ──► frontend/src/main.jsx

STEP 2: main.jsx
  File: frontend/src/main.jsx
  Action: ReactDOM.createRoot(document.getElementById('root'))
  Renders:
    <BrowserRouter>          ← enables client-side routing
      <AuthProvider>         ← provides auth state to entire app
        <App />              ← renders the route tree
      </AuthProvider>
    </BrowserRouter>
  Calls: ──► AuthContext.jsx (STEP 3)
  Then:  ──► App.jsx (STEP 4)

STEP 3: AuthContext.jsx (runs on mount)
  File: frontend/src/context/AuthContext.jsx
  Action: useEffect runs initAuth():
    3a. Read localStorage("serenai_token") and ("serenai_user")
    3b. If token found → call authAPI.verifyToken(token)
        Calls: ──► api.js → authAPI.verifyToken()
                ──► HTTP POST /api/auth/verify-token (BACKEND)
    3c. If valid → setUser(savedUser), setToken(savedToken)
    3d. If invalid → clear localStorage, user stays logged out
    3e. setLoading(false) → app can now render

STEP 4: App.jsx (renders after AuthContext loading = false)
  File: frontend/src/App.jsx
  Action: <Routes> matches current URL to a page component:
    /login       → LoginPage.jsx          (public)
    /signup      → SignupPage.jsx         (public)
    /dashboard   → ProtectedRoute ──► DashboardPage.jsx
    /assessment  → ProtectedRoute ──► AssessmentPage.jsx
    /chat        → ProtectedRoute ──► ChatPage.jsx
    /mood        → ProtectedRoute ──► MoodPage.jsx
    /journal     → ProtectedRoute ──► JournalPage.jsx
    /breathing   → ProtectedRoute ──► BreathingExercisePage.jsx
    /            → redirect to /dashboard
    *            → redirect to /dashboard

STEP 4b: ProtectedRoute.jsx (if route is protected)
  File: frontend/src/components/ProtectedRoute.jsx
  Action: Reads useAuth() → { isAuthenticated, loading }
    - If loading → show spinner
    - If !isAuthenticated → <Navigate to="/login" />
    - If authenticated → <Outlet /> (renders the matched child page)
```

### Frontend Startup Diagram

```
Browser opens URL
      │
      ▼
  index.html
      │
      ▼
  main.jsx
      │
      ├── BrowserRouter (routing)
      │     └── AuthProvider (AuthContext.jsx)
      │           │
      │           ├── useEffect → initAuth()
      │           │     ├── localStorage.getItem("serenai_token")
      │           │     └── authAPI.verifyToken() ──► api.js ──► Backend
      │           │
      │           └── Provides: { user, token, login, signup, logout }
      │
      └── App.jsx (Routes)
            │
            ├── /login ──► LoginPage.jsx
            ├── /signup ──► SignupPage.jsx
            │
            └── ProtectedRoute.jsx (auth guard)
                  │
                  ├── /dashboard ──► DashboardPage.jsx
                  ├── /assessment ──► AssessmentPage.jsx
                  ├── /chat ──► ChatPage.jsx
                  ├── /mood ──► MoodPage.jsx
                  ├── /journal ──► JournalPage.jsx
                  └── /breathing ──► BreathingExercisePage.jsx
```

---

## 4. Feature Flows (End-to-End)

> Think of every feature like a **relay race**. The baton (your data) gets
> passed from one file to the next. Here's exactly who passes to whom.

---

### 4.1 Signup — "I want to create an account"

**What the user does:** Fills in email + password on the Signup page, clicks Sign Up.

**Where the baton goes:**

1. **SignupPage.jsx** — User types email & password, hits the button
2. **AuthContext.jsx** — The page calls the `signup()` function that lives here
3. **api.js** — `signup()` calls `authAPI.signup()`, which sends the email & password to the backend
4. ---- *crosses the internet to the backend* ----
5. **auth.routes.js** — Backend receives it at `/api/auth/signup` (no login needed to sign up!)
6. **auth.controller.js** — Checks "did they send email and password?" If yes, passes it on
7. **auth.service.js** — The real work happens here:
   - Checks if that email already exists (asks **User.js** model to look in the database)
   - Scrambles the password so nobody can read it (bcrypt hashing)
   - Creates a new user in the database (through **User.js** model → MongoDB)
   - Creates a "ticket" (JWT token) that proves "this person is logged in" for 7 days
8. **User.js** (Model) — Saves the new user into MongoDB's `users` collection
9. ---- *response travels back to the frontend* ----
10. **AuthContext.jsx** — Saves the user info and token into the browser's memory (localStorage)
11. **SignupPage.jsx** — Sends the user to `/assessment` (to take the mental health test)

---

### 4.2 Login — "I already have an account"

**What the user does:** Types email + password on Login page, clicks Log In.

**Where the baton goes:**

1. **LoginPage.jsx** — User types credentials, hits the button
2. **AuthContext.jsx** — The page calls the `login()` function
3. **api.js** — Sends email + password to the backend
4. ---- *crosses to backend* ----
5. **auth.routes.js** — Receives it at `/api/auth/login` (no login needed to log in!)
6. **auth.controller.js** — Checks the request is okay, passes it on
7. **auth.service.js** — Does the real work:
   - Finds the user by email (asks **User.js** → MongoDB)
   - Compares the password with the scrambled version stored in the database
   - If they match → creates a JWT token (the "ticket")
   - If they don't match → says "wrong password"
8. ---- *response travels back* ----
9. **AuthContext.jsx** — Saves user + token in browser memory
10. **LoginPage.jsx** — Sends the user to `/dashboard`

---

### 4.3 Assessment — "How am I doing mentally?"

**What the user does:** Answers 7 questions (each scored 1–5), clicks Submit.

**Where the baton goes:**

1. **AssessmentPage.jsx** — Shows 7 questions. User picks answers and submits
2. **api.js** — Sends the 7 answers to the backend (with the JWT token so the backend knows WHO this is)
3. ---- *crosses to backend* ----
4. **assessment.routes.js** — Receives it at `/api/assessment/submit`
5. **auth.middleware.js** — Checks the JWT token first. "Are you really logged in?" If yes, attaches the userId to the request and lets it through
6. **assessment.controller.js** — Grabs the answers and userId, passes them on
7. **assessment.service.js** — Does the math:
   - **Stress score** = average of question 1 & 2, scaled to 0–100
   - **Anxiety score** = average of question 3 & 4, scaled to 0–100
   - **Sleep score** = question 5, inverted and scaled to 0–100
   - **Self-esteem score** = average of question 6 & 7, scaled to 0–100
   - **Risk level** = "low", "moderate", or "high" (based on average of all scores)
   - **Therapy style** = picks one of: "cbt", "supportive", or "mindfulness" (whichever fits your scores best)
   - Saves everything through **Assessment.js** model → MongoDB
8. **Assessment.js** (Model) — Stores the results in MongoDB's `assessments` collection
9. ---- *response travels back* ----
10. **AssessmentPage.jsx** — Shows the results (your scores, therapy style, risk level)
11. User goes to `/dashboard`

**Why this matters:** The therapy style chosen here controls HOW the AI therapist talks to you later in the Chat feature.

---

### 4.4 AI Chat — "Talk to my AI therapist"

**What the user does:** Opens the chat page, types a message, gets a response.

#### When the page first opens:

1. **ChatPage.jsx** — As soon as you open this page, it asks for your old messages
2. **api.js** — Sends a request: "give me this user's chat history"
3. ---- *crosses to backend* ----
4. **chat.routes.js** → **auth.middleware.js** (checks login) → **chat.controller.js** → **chat.service.js**
5. **chat.service.js** — Asks **ChatMessage.js** model to find your last 50 messages from MongoDB
6. ---- *sends them back* ----
7. **ChatPage.jsx** — Shows all your old messages on screen

#### When you send a new message:

1. **ChatPage.jsx** — You type "I've been feeling anxious" and click Send
2. **api.js** — Sends your message to the backend
3. ---- *crosses to backend* ----
4. **chat.routes.js** — Receives at `/api/chat/send`
5. **auth.middleware.js** — Checks your token, finds your userId
6. **chat.controller.js** — Grabs the message, passes it on
7. **chat.service.js** — This is where the magic happens:
   - **Step 1:** Looks up your assessment results (from **Assessment.js** model) to find your therapy style
   - **Step 2:** Fetches your last 10 messages (from **ChatMessage.js** model) so the AI remembers what you talked about
   - **Step 3:** Builds special instructions for the AI based on your therapy style:
     - If "cbt" → AI uses cognitive behavioral therapy techniques
     - If "supportive" → AI is warm, validating, uses reflective listening
     - If "mindfulness" → AI guides you toward present-moment awareness
   - **Step 4:** Sends everything to **Groq AI** (the brain):
     - The instructions (system prompt)
     - Your last 10 messages (memory)
     - Your new message
     - Groq processes it with the `llama-3.3-70b-versatile` model and returns a thoughtful response
   - **Step 5:** Saves BOTH your message AND the AI's response to the database (through **ChatMessage.js** → MongoDB)
8. ---- *response travels back* ----
9. **ChatPage.jsx** — Shows the AI's response in the chat bubble

#### Also on this page:
- **ElevenLabs Voice Widget** — A separate voice-based AI you can talk to out loud. This does NOT go through our backend at all. It talks directly to ElevenLabs' servers.

---

### 4.5 Mood Tracking — "How do I feel today?"

**What the user does:** Moves a slider (1–10), optionally writes a note, clicks Log.

#### When the page first opens:

1. **MoodPage.jsx** — Asks for your mood history
2. **api.js** → backend → **mood.routes.js** → **auth.middleware.js** → **mood.controller.js** → **mood.service.js**
3. **mood.service.js** — Asks **Mood.js** model for your moods from the last 30 days, also calculates stats (average, highest, lowest, trend)
4. ---- *sends it back* ----
5. **MoodPage.jsx** — Shows your mood entries and a bar chart

#### When you log a new mood:

1. **MoodPage.jsx** — You drag the slider to 7, type "feeling good today", click Log
2. **api.js** — Sends `{ moodScore: 7, note: "feeling good today" }` to the backend
3. ---- *crosses to backend* ----
4. **mood.routes.js** → **auth.middleware.js** → **mood.controller.js** → **mood.service.js**
5. **mood.service.js** — Checks the score is between 1–10, then saves it through **Mood.js** model → MongoDB's `moods` collection
6. ---- *response travels back* ----
7. **MoodPage.jsx** — Adds the new entry to the list, refreshes the chart

**No AI involved here** — just simple save and read from the database.

---

### 4.6 Journal — "Write my thoughts, get AI insights"

**What the user does:** Writes a journal entry, clicks Save, gets AI insight + sentiment.

#### When the page first opens:

1. **JournalPage.jsx** — Asks for your journal entries
2. **api.js** → backend → **journal.routes.js** → **auth.middleware.js** → **journal.controller.js** → **journal.service.js**
3. **journal.service.js** — Asks **Journal.js** model for your last 10 entries from MongoDB, calculates sentiment stats
4. ---- *sends them back* ----
5. **JournalPage.jsx** — Shows your entries with little sentiment badges (positive/negative/neutral/mixed)

#### When you create a new journal entry:

1. **JournalPage.jsx** — You write "Today I practiced mindfulness and felt calmer", click Save
2. **api.js** — Sends your text to the backend
3. ---- *crosses to backend* ----
4. **journal.routes.js** → **auth.middleware.js** → **journal.controller.js** → **journal.service.js**
5. **journal.service.js** — Makes TWO calls to Groq AI:
   - **AI Call 1:** "Read this journal entry and give a compassionate therapeutic insight" → Gets back something like "It's wonderful that you're exploring mindfulness..."
   - **AI Call 2:** "Is this entry positive, negative, neutral, or mixed?" → Gets back "positive"
   - Saves everything through **Journal.js** model → MongoDB's `journals` collection (the text + the AI insight + the sentiment)
6. ---- *response travels back* ----
7. **JournalPage.jsx** — Shows your new entry with the AI insight underneath and a sentiment badge

---

### 4.7 Breathing Exercise — "Help me calm down"

**What the user does:** Opens the page and does a breathing exercise.

1. **BreathingExercisePage.jsx** — That's it. Just this one file.
   - Shows a circle with a meditating Buddha
   - Guides you through: **Breathe in** (4 sec) → **Hold** (4 sec) → **Breathe out** (8 sec)
   - Plays gentle tones using your browser's audio (Web Audio API)
   - Counts how many breaths you've done

**No backend. No database. No API calls. No other files.** Everything runs right in your browser.

---

### Quick Summary: Every Feature in One Line

| Feature | Frontend Page | Backend Route | Service (brain) | Database Collection | AI Used? |
|---------|--------------|---------------|-----------------|--------------------|---------| 
| Signup | SignupPage → AuthContext → api.js | /api/auth/signup | auth.service.js | users | No |
| Login | LoginPage → AuthContext → api.js | /api/auth/login | auth.service.js | users | No |
| Assessment | AssessmentPage → api.js | /api/assessment/submit | assessment.service.js | assessments | No |
| Chat | ChatPage → api.js | /api/chat/send | chat.service.js | chatmessages | Yes (Groq) |
| Mood | MoodPage → api.js | /api/mood/log | mood.service.js | moods | No |
| Journal | JournalPage → api.js | /api/journal/create | journal.service.js | journals | Yes (Groq x2) |
| Breathing | BreathingExercisePage | none | none | none | No |

---

### The Golden Rule (every protected feature follows this pattern):

1. **Page** (user clicks something)
2. **api.js** (sends HTTP request with JWT token)
3. **routes file** (catches the URL)
4. **auth.middleware.js** (checks: "are you logged in?")
5. **controller** (checks: "is the data valid?")
6. **service** (does the actual work + talks to AI if needed)
7. **model** (saves/reads from MongoDB)
8. *...then everything flows back in reverse order to show the result*

---

## 5. Middleware Pipeline

Every protected request passes through this pipeline:

```
Incoming HTTP Request
      │
      ▼
  express.json()               ← Parse JSON body
      │
      ▼
  express.urlencoded()         ← Parse form data
      │
      ▼
  cors()                       ← Check origin against allowed list
      │                           (FRONTEND_URL from .env + localhost:*)
      ▼
  Route Matcher                ← app.use("/api/auth", authRoutes) etc.
      │
      ▼
  auth.middleware.js           ← (only on protected routes)
      │                           Extract "Bearer <token>" from header
      │                           jwt.verify(token, JWT_SECRET)
      │                           req.user = { userId, email }
      │                           If invalid → 401 Unauthorized
      ▼
  Controller Function          ← Business logic handler
      │
      ▼
  res.json({ ... })            ← Response sent to client
      │
      ▼
  (if error thrown anywhere)
      │
      ▼
  Global Error Handler         ← app.use((err, req, res, next))
      │                           Returns { success: false, error: message }
      │                           In dev mode: includes stack trace
      ▼
  (if no route matched)
      │
      ▼
  404 Handler                  ← { success: false, error: "Route not found" }
```

---

## 6. File Dependency Map

### WHO IMPORTS WHOM (Backend)

```
server.js
  ├── imports: app.js
  └── imports: config/db.js

app.js
  ├── imports: routes/auth.routes.js
  ├── imports: routes/assessment.routes.js
  ├── imports: routes/chat.routes.js
  ├── imports: routes/mood.routes.js
  └── imports: routes/journal.routes.js

routes/auth.routes.js
  ├── imports: controllers/auth.controller.js
  └── imports: middleware/auth.middleware.js

routes/assessment.routes.js
  ├── imports: controllers/assessment.controller.js
  └── imports: middleware/auth.middleware.js

routes/chat.routes.js
  ├── imports: controllers/chat.controller.js
  └── imports: middleware/auth.middleware.js

routes/mood.routes.js
  ├── imports: controllers/mood.controller.js
  └── imports: middleware/auth.middleware.js

routes/journal.routes.js
  ├── imports: controllers/journal.controller.js
  └── imports: middleware/auth.middleware.js

controllers/auth.controller.js
  └── imports: services/auth.service.js

controllers/assessment.controller.js
  └── imports: services/assessment.service.js

controllers/chat.controller.js
  └── imports: services/chat.service.js

controllers/mood.controller.js
  └── imports: services/mood.service.js

controllers/journal.controller.js
  └── imports: services/journal.service.js

services/auth.service.js
  └── imports: models/User.js

services/assessment.service.js
  └── imports: models/Assessment.js

services/chat.service.js
  ├── imports: models/ChatMessage.js
  └── imports: models/Assessment.js   (to read therapyStyle)
  └── creates: OpenAI client inline   (Groq API)

services/mood.service.js
  └── imports: models/Mood.js

services/journal.service.js
  └── imports: models/Journal.js
  └── creates: OpenAI client inline   (Groq API)

services/crisis.service.js
  └── imports: NOTHING (standalone keyword detection)

config/db.js
  └── imports: mongoose

middleware/auth.middleware.js
  └── imports: jsonwebtoken
```

### WHO IMPORTS WHOM (Frontend)

```
main.jsx
  ├── imports: App.jsx
  ├── imports: context/AuthContext.jsx
  └── imports: index.css

App.jsx
  ├── imports: pages/LoginPage.jsx
  ├── imports: pages/SignupPage.jsx
  ├── imports: pages/DashboardPage.jsx
  ├── imports: pages/AssessmentPage.jsx
  ├── imports: pages/ChatPage.jsx
  ├── imports: pages/MoodPage.jsx
  ├── imports: pages/JournalPage.jsx
  ├── imports: pages/BreathingExercisePage.jsx
  └── imports: components/ProtectedRoute.jsx

context/AuthContext.jsx
  └── imports: services/api.js (authAPI)

components/ProtectedRoute.jsx
  └── imports: context/AuthContext.jsx (useAuth)

pages/LoginPage.jsx
  └── imports: context/AuthContext.jsx (useAuth)

pages/SignupPage.jsx
  └── imports: context/AuthContext.jsx (useAuth)

pages/DashboardPage.jsx
  ├── imports: services/api.js (assessmentAPI, moodAPI, journalAPI)
  └── imports: context/AuthContext.jsx (useAuth)

pages/AssessmentPage.jsx
  └── imports: services/api.js (assessmentAPI)

pages/ChatPage.jsx
  └── imports: services/api.js (chatAPI)

pages/MoodPage.jsx
  └── imports: services/api.js (moodAPI)

pages/JournalPage.jsx
  └── imports: services/api.js (journalAPI)

pages/BreathingExercisePage.jsx
  └── imports: NOTHING (fully self-contained)

services/api.js
  └── imports: axios
  └── exports: authAPI, assessmentAPI, chatAPI, moodAPI, journalAPI
```

---

## 7. Database Flow

### How Data Flows to MongoDB

```
Frontend Page
      │
      ▼
api.js (Axios HTTP call)
      │
      ▼
Express Route (*.routes.js)
      │
      ▼
Auth Middleware (auth.middleware.js) → extracts userId from JWT
      │
      ▼
Controller (*.controller.js) → validates input, extracts params
      │
      ▼
Service (*.service.js) → business logic
      │
      ▼
Model (*.js) → Mongoose operation
      │
      ├── Model.create({...})       → INSERT into MongoDB
      ├── Model.find({...})         → SELECT from MongoDB
      ├── Model.findOne({...})      → SELECT ONE from MongoDB
      ├── Model.findById(id)        → SELECT by _id
      ├── Model.findByIdAndDelete() → DELETE from MongoDB
      └── Model.deleteMany({...})   → DELETE MANY from MongoDB
      │
      ▼
MongoDB Database (port 27017)
  │
  ├── Collection: users         ← User.js model
  │     Fields: email, password (bcrypt hash), isAnonymous, timestamps
  │
  ├── Collection: assessments   ← Assessment.js model
  │     Fields: userId, stressScore, anxietyScore, sleepScore,
  │             selfEsteemScore, therapyStyle, riskLevel, timestamps
  │
  ├── Collection: chatmessages  ← ChatMessage.js model
  │     Fields: userId, role (user/assistant), content, tokenCount, timestamps
  │
  ├── Collection: journals      ← Journal.js model
  │     Fields: userId, content, sentiment, aiInsight, timestamps
  │
  └── Collection: moods         ← Mood.js model
        Fields: userId, moodScore (1-10), note, timestamps
```

---

## 8. Docker Startup Flow

```
docker-compose up
      │
      ├─────────────────────────────┐
      │                             │
      ▼                             ▼
  mongo service                 redis service
  (mongo:latest)                (redis:latest)
  Port: 27017                   Port: 6379
  Volumes: mongo_data,          Volume: redis_data
           mongo_config         Command: --appendonly yes
      │                             │
      │   (waits for depends_on)    │
      │◄────────────────────────────┘
      │
      ▼
  backend service
  (built from Dockerfile)
      │
      ▼
  Dockerfile:
    FROM node:18-alpine
    WORKDIR /app
    COPY package*.json → npm install --omit=dev
    COPY . .
    ENV NODE_ENV=production
    EXPOSE 5000
    HEALTHCHECK: curl http://localhost:5000/health
    CMD ["node", "src/server.js"]
      │
      ▼
  server.js starts (see Section 2 above)
      │
      ▼
  connectDB() → connects to mongo://mongo:27017
      │
      ▼
  app.listen(5000) → Backend is live!
      │
      ▼
  Health check passes → Container marked "healthy"

Network: mindwise_network (bridge)
  ├── backend  → can reach mongo:27017 and redis:6379
  ├── mongo    → internal to network
  └── redis    → internal to network
```

---

## 9. Unused / Available Files

These files exist but are **NOT currently wired into the main execution flow**:

| File | What It Does | Why It's Unused |
|------|-------------|-----------------|
| `ai/openai.client.js` | Shared Groq client instance | `chat.service.js` and `journal.service.js` create their own inline clients instead |
| `ai/prompt.builder.js` | `buildPrompt(profile, memory, msg)` function | `chat.service.js` has its own inline `buildSystemPrompt()` |
| `ai/memory.manager.js` | `getRecentMemory(userId)` — fetches last 10 messages | `chat.service.js` fetches messages inline |
| `config/redis.js` | Redis client setup | File is empty — Redis not yet integrated into app logic |
| `services/crisis.service.js` | `checkCrisis(message)` — keyword detection for self-harm | Available but not called by any controller or service |
| `modules/` (all folders) | `assessment/`, `auth/`, `chat/`, `crisis/`, `journal/`, `mood/` | Empty module folders — possibly planned for future modular refactor |

### Suggested Integration TODOs

```
TODO: Import ai/openai.client.js in chat.service.js and journal.service.js
      instead of creating separate Groq clients (DRY principle)

TODO: Import ai/prompt.builder.js in chat.service.js instead of
      having buildSystemPrompt() defined inline

TODO: Import ai/memory.manager.js in chat.service.js instead of
      fetching last 10 messages inline

TODO: Integrate crisis.service.js into chat.service.js to detect
      crisis keywords before/after AI response

TODO: Implement config/redis.js for session caching or rate limiting

TODO: Populate modules/ folders if planning a modular architecture
```

---

## Quick Reference: Complete Request Lifecycle

```
USER ACTION
    │
    ▼
[Frontend Page]     ─── calls ───►  [api.js function]
                                         │
                                    Axios HTTP Request
                                    + JWT from localStorage
                                         │
                                         ▼
                                    [*.routes.js]     ─── calls ───►  [auth.middleware.js]
                                                                           │
                                                                      JWT verified
                                                                      req.user = { userId }
                                                                           │
                                                                           ▼
                                                                      [*.controller.js]
                                                                           │
                                                                      validates input
                                                                      calls service
                                                                           │
                                                                           ▼
                                                                      [*.service.js]
                                                                           │
                                                                      business logic
                                                                      ├── [Model.js] → MongoDB
                                                                      └── [Groq AI] (if AI feature)
                                                                           │
                                                                      returns data
                                                                           │
                                                                           ▼
                                                                      [*.controller.js]
                                                                      res.json({ success, data })
                                                                           │
                                                                           ▼
                                                                      HTTP Response
                                                                           │
    ┌──────────────────────────────────────────────────────────────────────┘
    │
    ▼
[Frontend Page]     ─── updates UI with response data
```

---

get an internship, so that u can enjoy as much as u can
