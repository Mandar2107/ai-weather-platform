# AI Weather Platform

AI Weather Platform is a full-stack application for weather monitoring, farmer management, AI-driven advisory, and alert workflows.

## Tech Stack

- Backend: Node.js, Express, Sequelize, SQLite, Socket.IO
- Frontend: React (Create React App), socket.io-client

## Project Structure

- `server.js`: backend entry point (runs on port `5000`)
- `src/`: backend app, routes, services, models
- `frontend/`: React client app (runs on port `3000`)

## Prerequisites

- Node.js 18+
- npm 9+

## Setup

1. Install backend dependencies:

```bash
npm install
```

2. Install frontend dependencies:

```bash
cd frontend
npm install
cd ..
```

3. Create a `.env` file in the project root:

```env
JWT_SECRET=change_me
WEATHER_API_KEY=

NOTIFICATION_MODE=mock
SMS_PROVIDER=mock
VOICE_PROVIDER=mock
SMS_WEBHOOK_URL=
VOICE_WEBHOOK_URL=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

Notes:
- SQLite database file is `database.sqlite` in project root.
- Twilio values are optional when using mock notification mode.

## Run Locally

Start backend:

```bash
npm run dev
```

Start frontend in a second terminal:

```bash
cd frontend
npm start
```

## URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Health check: `GET http://localhost:5000/`

## API Route Prefixes

- `/api/auth`
- `/api/farmers`
- `/api/weather`
- `/api/ai`
- `/api/alerts`
- `/api/settings`

## Scripts

Backend (`package.json`):
- `npm start` -> run backend with Node
- `npm run dev` -> run backend with nodemon

Frontend (`frontend/package.json`):
- `npm start` -> run React dev server
- `npm run build` -> production build
- `npm test` -> test runner
