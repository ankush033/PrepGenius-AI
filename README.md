# 🚀 PrepGenius-AI

An AI-powered Interview Preparation Assistant built using the MERN stack, RAG (Retrieval-Augmented Generation), Gemini Embeddings, and Pinecone Vector Database.

Users can upload study PDFs, ask questions in natural language, and receive accurate, context-aware answers generated from their own documents.

---

## ✨ Features

- 🔐 JWT Authentication
- 📄 Upload PDF Notes
- 📚 Automatic PDF Parsing
- ✂️ Intelligent Text Chunking
- 🧠 Gemini Embedding Generation
- 🌲 Pinecone Vector Database
- 🔍 Semantic Similarity Search
- 🤖 AI-powered Chat using Gemini
- 💬 Context-aware Question Answering
- 📊 Dashboard with Uploaded Documents
- 🗑 Delete Uploaded Documents

---

## 🛠 Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- Axios
- React Router

### Backend
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication
- Multer

### AI / RAG
- Gemini API
- Gemini Embedding Model
- Pinecone Vector Database

---

# 📌 Project Architecture

```
              Upload PDF
                   │
                   ▼
             PDF Extraction
                   │
                   ▼
             Text Chunking
                   │
                   ▼
        Gemini Embedding Model
                   │
                   ▼
        Pinecone Vector Database
                   ▲
                   │
             User Question
                   │
                   ▼
        Gemini Embedding Model
                   │
                   ▼
         Similarity Search
                   │
                   ▼
          Relevant Chunks
                   │
                   ▼
           Gemini AI Answer
```

---

## 📁 Folder Structure

```
PrepGenius-AI
│
├── client
│   ├── src
│   ├── components
│   ├── pages
│   └── services
│
├── server
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── rag
│   ├── routes
│   ├── services
│   └── uploads
│
└── README.md
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/ankush033/PrepGenius-AI.git
```

### Backend

```bash
cd server
npm install
```

Create a `.env`

```
PORT=
MONGO_URI=
JWT_SECRET=
GEMINI_API_KEY=
PINECONE_API_KEY=
PINECONE_INDEX=
```

Run

```bash
npm run dev
```

---

### Frontend

```bash
cd client
npm install
```

Create `.env`

```
VITE_API_URL=http://localhost:5000/api
```

Run

```bash
npm run dev
```

---

## 📷 Screenshots

### Login Page

(Add Screenshot)

### Dashboard

(Add Screenshot)

### AI Chat

(Add Screenshot)

---

## 🚀 Deployment

Frontend : Vercel

Backend : Render

Database : MongoDB Atlas

Vector Database : Pinecone

---

## 📚 Future Improvements

- Voice-based Interview
- Resume Analysis
- Interview Score
- Mock Interview Mode
- AI Interview Feedback
- Multi-document Search
- Source Citation

---

## 👨‍💻 Author

Ankush Gupta

GitHub:
https://github.com/ankush033

LinkedIn:
(Add your LinkedIn)
