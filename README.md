# CampusAI-RAG 🚀

CampusAI-RAG is a production-ready AI Student Assistant powered by Retrieval-Augmented Generation (RAG). Students can upload document PDFs or query existing campus resources to get precise, citation-backed answers powered by Google Gemini and Supabase pgvector.

## 🌟 Key Features

- **Futuristic AI UI**: Dark neon landing page (`#050816`) with glassmorphism cards, glowing 3D AI orb, orbit rings, floating notification cards, and smooth animations.
- **RAG Pipeline**: PDF text extraction, smart chunking with page retention, Gemini 768d vector embeddings (`text-embedding-004`), and Supabase pgvector similarity search.
- **ChatGPT-Style Chat Experience**: SSE Streaming responses, typing indicators, auto-scrolling markdown answer rendering, and exact page citation cards.
- **Voice Assistant**: Speech-to-text input query recording and optional Text-to-speech auto-reading.
- **Authentication & Roles**: Supabase Auth integration supporting Student and Admin accounts.
- **Admin Dashboard**: Secure management interface for uploading and deleting campus PDF documents.

## 🏗️ Tech Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion
- **Backend**: Node.js, Express, TypeScript, Multer, PDF-Parse
- **Database & Storage**: Supabase PostgreSQL, pgvector extension, Supabase Storage
- **AI Models**: Google Gemini (`gemini-1.5-flash`, `text-embedding-004`)

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18+)
- Supabase Account & Project (with `pgvector` enabled)
- Google Gemini API Key

### Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## 🚀 Deployment

- **Frontend**: Deploy on Vercel
- **Backend**: Deploy on Render
- **Database**: Supabase PostgreSQL with `supabase_setup.sql` applied
