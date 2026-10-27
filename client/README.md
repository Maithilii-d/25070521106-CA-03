# Wellnest — Your Everyday Wellness Companion

A beginner-friendly full-stack wellness tracker built with React + Vite, Node.js + Express, and local MongoDB.

## Features
- Registration, login, logout (JWT + bcrypt)
- Wellness dashboard with daily score and streak summary
- Customizable daily habits and completion tracking
- Mood journal with notes
- Hydration goal and water logging
- Sleep and activity logs
- Weekly insights charts and milestone badges
- Wellness challenges
- Guided breathing exercise
- Customizable wellness routine
- Profile/settings page
- Data is stored per signed-in user in MongoDB

> This is a personal wellness organizer, not a medical or diagnostic tool. The wellness score is a simple progress indicator, not a health assessment.

## Requirements
- Node.js LTS (install from https://nodejs.org/)
- MongoDB Community Server (local) and MongoDB Compass
- VS Code

## 1. Start local MongoDB
Install MongoDB Community Server and make sure the MongoDB service is running. Open MongoDB Compass and connect to:

`mongodb://localhost:27017`

The app uses database `wellnest`.

## 2. Start the backend
Open this project folder in VS Code. Open Terminal and run:

```bash
cd server
npm install
```

Copy `.env.example` to `.env` (Windows PowerShell):
```powershell
Copy-Item .env.example .env
```

You can keep the default local MongoDB URI. Then run:
```bash
npm run dev
```

Expected backend URL: `http://localhost:5000`
Health check: `http://localhost:5000/api/health`

## 3. Start the frontend
Open a **second** VS Code terminal (keep backend running):
```bash
cd client
npm install
npm run dev
```
Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

## 4. Use the app
1. Register a new account.
2. Log in.
3. Add or complete habits, record your mood, add water, sleep/activity, and try the breathing exercise.
4. In MongoDB Compass, refresh and open `wellnest` to see collections and saved records.

## Folder structure
```text
Wellnest/
  client/       React frontend
  server/       Express API + Mongoose models
  README.md
```

## Troubleshooting
- **MongoDB connection error:** confirm MongoDB Community Server is installed and running; Compass alone is only the GUI.
- **Port 5000 in use:** change `PORT` in `server/.env`.
- **Frontend cannot reach backend:** backend must be running on port 5000.
- **PowerShell blocks a command:** use the commands above exactly, or use the VS Code Command Prompt terminal.
- Never share your `.env` or JWT secret publicly.
