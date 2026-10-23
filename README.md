# BrandTweet AI Studio

An AI-powered tweet generation web application built with a React + Vite frontend and a Django backend. The application supports demo mode without an AI key and can generate AI-powered tweet drafts when configured with a Groq API key.

## 🚀 Live Demo

**Live Project:** https://brand-tweet-ai.vercel.app

## ✨ Features

- AI-powered tweet draft generation using the Groq API
- Demo mode available without an AI API key
- React-based frontend
- Django backend
- Configurable AI integration

## 🛠️ Tech Stack

- **Frontend:** React.js, Vite
- **Backend:** Python, Django
- **AI Integration:** Groq API

## 💻 Run Locally

### 1. Start the backend

```powershell
cd backend
py -m pip install -r requirements.txt
py manage.py runserver 8000
```

### 2. Start the frontend

Open another terminal and run:

```powershell
cd frontend
npm install
npm run dev
```

Open the URL displayed by Vite, usually `http://localhost:5173`.

## 🔑 Enable AI Generation

Set the `GROQ_API_KEY` environment variable before starting Django:

```powershell
$env:GROQ_API_KEY="your_key_here"
py manage.py runserver 8000
```

**Security:** Never expose your API key in frontend code or commit it to GitHub.

## 👩‍💻 Project Purpose

BrandTweet AI Studio demonstrates full-stack web development and Generative AI integration through a practical application for creating social media content.
