SEWA – Smart Excess Food Welfare & Assistance System

A Real-Time Food Donation, Pickup & Verification Platform

📝 Overview

SEWA is a full-stack MERN-based food donation management system designed to connect Hotels with NGOs in real-time. The platform ensures safe and efficient donation workflows using:

Real-time socket-based notifications

OTP-based pickup verification

Hotel blacklist & review mechanism

Admin analytics dashboard

Chat system between hotels and NGOs

Automated expiry tracking

Complaint management with evidence

Role-based authentication (Hotel, NGO, Admin)

🚀 Live Features
1. Role-Based Modules
User	Features
Hotel	Add donation, food expiry checks, real-time NGO accept alerts, OTP pickup verification, donation history, ratings & reviews
NGO	Accept/reject donations, generate/verify OTP, provide feedback, chat with hotels, track history
Admin	Review complaints, blacklist/unblacklist hotels, analytics dashboard, verify users
Common	Secure login, session management, chat system
🔥 Core Features
Food Donation Workflow

Hotels post food with:

Images

Location (lat, long)

Preparation & expiry time

Auto-expiry logic

NGOs can accept / reject donations

Hotels get instant socket notifications

Pickup OTP System

NGO generates OTP

Email sent to hotel

OTP auto-expires (time-limited)

Verification updates donation → picked-up

Real-Time Sockets

Food accepted

Pickup confirmed

Admin blacklists hotel

New complaint created
All trigger instant web updates.

Hotel Review & Blacklisting System

NGOs submit ratings & complaints

Admin inspects evidence

Admin may blacklist hotel automatically or manually

Admin Analytics Dashboard

Top Hotels

Top NGOs

Blacklisted list

Complaint Center

Weekly/monthly performance trends

Success Rate Calculation

📦 Tech Stack
Frontend

React.js (Vite)

Axios

Socket.io client

Lucide Icons

React-Router

Toastify

CSS Modules

Backend

Node.js + Express.js

MongoDB + Mongoose

Socket.io (real-time)

Nodemailer

Multer (image upload)

JWT Authentication

Cloud hosting (Render)

🛢 Database Models

Hotel

NGO

Food

Pickup

Review

Complaint

ChatMessage

(Each model includes timestamps, relations, blacklist flags, expiry data, etc.)

⚙️ Project Architecture
sewa-project/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── uploads/
│   ├── server.js
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   ├── CSS/
│   │   └── App.jsx
│   ├── vite.config.js
│   └── package.json
│
└── README.md

🔑 Environment Variables
Backend .env
MONGO_URI=<....
PORT=5000
GMAIL_APP_PASSWORD=_____


Frontend .env
VITE_API_URL=http://localhost:5000

🛠 Installation & Setup
1. Clone the repo
git clone https://github.com/your-username/sewa-project.git
cd sewa-project

2. Install backend
cd backend
npm install

3. Install frontend
cd frontend
npm install

4. Start backend
npm start

5. Start frontend
npm run dev

🌐 Deployment Guide
Backend – Render

Push backend to GitHub

Create new Web Service

Add environment variables

Use Build Command:

npm install


Run Command:

npm start

Frontend – Vercel/Netlify




Deploy

🔌 API Endpoints Overview
Food Routes
POST   /api/food/add
GET    /api/food/available
PUT    /api/food/:id/accept
PUT    /api/food/:id/reject
POST   /api/food/generate-otp
POST   /api/food/verify-otp

Chat Routes
POST /api/chat/send
GET  /api/chat/list/:userId

Hotel Routes
GET /api/hotel/:id/status
GET /api/hotel/:user/dashboard

Admin Routes
POST   /api/admin/login
GET    /api/admin/pending
GET    /api/admin/dashboard-stats
PATCH  /api/admin/blacklist/:hotelId


