# BrandTweet AI

React + Vite frontend with a Django backend. The app works in demo mode without an AI key. Add a Groq API key to enable AI-generated drafts.

## Start backend (terminal 1)
```powershell
cd backend
py -m pip install -r requirements.txt
py manage.py runserver 8000
```

## Start frontend (terminal 2)
```powershell
cd frontend
npm install
npm run dev
```
Open the URL shown by Vite, usually http://localhost:5173.

## Enable AI
Set `GROQ_API_KEY` in the environment before starting Django. Example PowerShell:
```powershell
$env:GROQ_API_KEY="your_key_here"
py manage.py runserver 8000
```
Never put the key in React code or commit it to GitHub.
