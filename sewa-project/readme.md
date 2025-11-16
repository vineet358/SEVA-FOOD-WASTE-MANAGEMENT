SEWA – Smart Excess Food Welfare & Assistance System

A Real-Time Food Donation, Pickup & Verification Platform

SEWA connects Hotels and NGOs in real-time to reduce food waste and support communities.
Built as a MERN stack application with real-time socket notifications, OTP-based pickup verification and an admin analytics dashboard.

Table of Contents

Project Overview

Live Features

Tech Stack

Folder Structure

Models & Schemas (detailed)

API Endpoints & Examples

Socket Events (Realtime)

Environment Variables

Installation & Local Setup

Deployment Guide

Testing & Seed Data

Admin & Maintenance Tasks

Security Considerations

Contributing Guidelines

Troubleshooting & FAQ

Changelog (suggested)

License & Acknowledgements

Project Overview

SEWA is a full-stack application focused on routing surplus food from Hotels to NGOs quickly and safely. The core goals:

Enable Hotels to post donations (with images, locations, timestamps)

Let NGOs accept/reject donations and generate OTP for pickup

Provide OTP verification and expiry handling

Real-time socket notifications for key events

Admin controls for blacklisting, complaints, analytics and verification

Chat between Hotels and NGOs for coordination

Audit trails and simple analytics for impact measurement

The architecture emphasizes reliability, usability and maintainability.

Live Features
Role-Based Modules

Hotel

Add donation entries (images, location, quantity, expiry)

Receive NGO accept alerts over socket

OTP-based pickup verification

View donation history

Ratings & reviews from NGOs

NGO

Browse & filter available donations

Accept/reject donations

Generate and verify OTP

Chat with hotels

Track pickup history

Admin

Review complaints and evidence

Blacklist/unblacklist hotels

View analytics dashboard

Verify users and review flags

Common

Secure authentication (JWT)

Real-time updates (Socket.io)

Role-based access control

Core Workflows

Donations: Hotels post donation → NGOs notified → NGO accepts → OTP generated → NGO picks up and verifies → donation marked as picked-up

Auto-expiry: Donations pass expiry → marked expired → removed from available feed

Blacklisting: Repeated complaints or manual review can blacklist a hotel; system prevents blacklisted hotels from posting

Chat & Audit: Chat for coordination and audit logs retained for admin review

Tech Stack

Frontend

React (Vite)

React Router

Axios

Socket.io-client

CSS Modules / Tailwind (optional)

Lucide Icons

React-Toastify

Backend

Node.js + Express

MongoDB + Mongoose

Socket.io

Nodemailer

Multer (file uploads)

JWT (auth)

Cloud hosting: Render / Heroku (example)

Optional: Redis for caching, rate-limits, or pub-sub

Dev Tools

ESLint, Prettier

Husky (optional) for pre-commit hooks

Postman / Insomnia for API testing

Folder Structure
sewa-project/
│
├── backend/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── services/
│   ├── uploads/
│   ├── tests/
│   ├── server.js
│   ├── seed/
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── CSS/
│   │   └── App.jsx
│   ├── vite.config.js
│   └── package.json
│
└── README.md

Models & Schemas (detailed)

NOTE: These are suggestion-level Mongoose schema shapes. Adjust fields and indexes as needed.

Hotel (models/Hotel.js)
const HotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownerName: String,
  email: { type: String, required: true, index: true },
  phone: String,
  address: String,
  location: {
    lat: Number,
    long: Number
  },
  isBlacklisted: { type: Boolean, default: false },
  blacklistReason: String,
  createdAt: { type: Date, default: Date.now }
});

NGO (models/Ngo.js)
const NgoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactPerson: String,
  email: { type: String, required: true, index: true },
  phone: String,
  address: String,
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

Food (models/Food.js)
const FoodSchema = new mongoose.Schema({
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  title: String,
  description: String,
  images: [String],        // paths or cloud URLs
  quantity: Number,
  tags: [String],
  city: String,
  location: { lat: Number, long: Number },
  preparedAt: Date,
  expiresAt: { type: Date, required: true },
  status: { type: String, enum: ['available','accepted','picked','expired','rejected'], default: 'available' },
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Ngo' },
  pickupOtp: {
    code: String,
    expiresAt: Date,
    verified: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});
FoodSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

Pickup (models/Pickup.js)
const PickupSchema = new mongoose.Schema({
  food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
  ngo: { type: mongoose.Schema.Types.ObjectId, ref: 'Ngo' },
  otp: String,
  otpGeneratedAt: Date,
  otpUsedAt: Date,
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

Review (models/Review.js)
const ReviewSchema = new mongoose.Schema({
  food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
  ngo: { type: mongoose.Schema.Types.ObjectId, ref: 'Ngo' },
  rating: Number,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

Complaint (models/Complaint.js)
const ComplaintSchema = new mongoose.Schema({
  complaintBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'byModel' },
  byModel: { type: String, enum: ['Ngo','Hotel','Admin'] },
  targetHotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
  evidence: [String], // image URLs
  reason: String,
  status: { type: String, enum: ['open','reviewed','closed'], default: 'open' },
  createdAt: { type: Date, default: Date.now }
});

ChatMessage (models/ChatMessage.js)
const ChatMessageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'fromModel' },
  fromModel: { type: String, enum: ['Hotel','Ngo','Admin'] },
  to: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'toModel' },
  toModel: { type: String, enum: ['Hotel','Ngo','Admin'] },
  message: String,
  attachments: [String],
  createdAt: { type: Date, default: Date.now }
});

API Endpoints & Examples

All endpoints assume Authorization: Bearer <JWT> for protected routes.

Auth

POST /api/auth/register — register hotel/ngo/admin

POST /api/auth/login — login, returns JWT

GET /api/auth/me — get current user

Example: login
curl -X POST https://api.example.com/api/auth/login \
 -H "Content-Type: application/json" \
 -d '{"email":"hotel@example.com","password":"pass123"}'

Food Routes

POST /api/food/add — create food donation (hotel only)

GET /api/food/available?city=haldwani — list available food

PUT /api/food/:id/accept — NGO accepts donation

PUT /api/food/:id/reject — NGO rejects donation

POST /api/food/generate-otp — generate OTP (NGO/hotel flow)

POST /api/food/verify-otp — verify OTP (hotel verifies)

Create Food (example request)
curl -X POST https://api.example.com/api/food/add \
 -H "Authorization: Bearer $TOKEN" \
 -F "title=Sandwiches" \
 -F "quantity=20" \
 -F "preparedAt=2025-11-10T08:00:00Z" \
 -F "expiresAt=2025-11-10T12:00:00Z" \
 -F "images=@/path/to/pic1.jpg" \
 -F "city=haldwani"

Accept donation
curl -X PUT https://api.example.com/api/food/<FOOD_ID>/accept \
 -H "Authorization: Bearer $NGO_TOKEN"

Generate OTP
curl -X POST https://api.example.com/api/food/generate-otp \
 -H "Authorization: Bearer $NGO_TOKEN" \
 -H "Content-Type: application/json" \
 -d '{"foodId":"<FOOD_ID>"}'

Verify OTP
curl -X POST https://api.example.com/api/food/verify-otp \
 -H "Authorization: Bearer $HOTEL_TOKEN" \
 -H "Content-Type: application/json" \
 -d '{"foodId":"<FOOD_ID>","otp":"123456"}'

Hotel Routes

GET /api/hotel/:id/status

GET /api/hotel/:user/dashboard

Admin Routes

POST /api/admin/login

GET /api/admin/pending — pending approvals/complaints

GET /api/admin/dashboard-stats

PATCH /api/admin/blacklist/:hotelId

Socket Events (Realtime)
Recommended event list

Server emits

food:new — new donation posted

food:accepted — donation accepted by NGO

food:otp:generated — OTP generated for pickup

food:otp:verified — OTP verified

hotel:blacklisted — hotel blacklisted

complaint:new — new complaint filed

review:new — new review submitted

Client emits

food:create

food:accept

food:reject

otp:generate

otp:verify

chat:message

Example socket.io usage (client)
socket.on('connect', () => {
  console.log('connected to realtime server');
});

socket.on('food:new', (food) => {
  // show toast or refresh feed
});

socket.emit('food:accept', { foodId: 'abc123' });

Environment Variables
Backend .env (example)
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/sewaDB
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
GMAIL_SERVICE_USER=youremail@gmail.com
GMAIL_APP_PASSWORD=your_app_password_here
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
UPLOADS_DIR=./uploads
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

Frontend .env (example)
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000

Installation & Local Setup
Prerequisites

Node.js (v16+)

npm / yarn / pnpm

MongoDB (local or Atlas)

Optional: Redis (for advanced features)

Steps
1. Clone repo
git clone https://github.com/your-username/sewa-project.git
cd sewa-project

2. Backend
cd backend
cp .env.example .env
npm install
npm run seed    # optional: seed sample data
npm start

3. Frontend
cd ../frontend
cp .env.example .env
npm install
npm run dev

4. Open app

Frontend usually at http://localhost:5173 (Vite default)

Backend API at http://localhost:5000

Deployment Guide (concise)
Backend on Render (example)

Push backend to GitHub.

On Render, create a new Web Service linking the repo.

Set environment variables in Render dashboard.

Build command: npm install

Start command: npm start

Add persistent storage for uploads (S3 recommended) or use a cloud bucket.

Frontend on Vercel

Link repo to Vercel.

Set VITE_API_URL in project settings.

Deploy.

Notes

Use S3 (or other object storage) for images; do not store large images on service filesystem.

Use HTTPS in production and set CORS properly.

Testing & Seed Data
Seed script outline

Create backend/seed/seed.js to populate:

5 Hotels (with location data)

5 NGOs

10 Food donations (varied expiry times)

3 Admin users

A few reviews and complaints

Sample seed snippet
const hotels = [
  { name: 'Hotel A', email: 'hotelA@example.com', location: { lat: 29.2183, long: 79.5130 } },
  // ...
];

Running tests

Use Jest for unit tests (backend) and React Testing Library for frontend

Add npm run test scripts in both projects

Admin & Maintenance Tasks
Auto-expiry job

Use a cron job (node-cron) or TTL index on expiresAt to mark expired donations

On expiry, emit food:expired socket event and update search/indexes

Blacklist automation

Define thresholds (e.g., 3 valid complaints within 30 days)

Auto-blacklist and notify admin for manual review

Cleanup

Clear old uploads periodically

Archive old chat logs (or store compressed backups)

Security Considerations

Authentication: Use strong JWT secrets and short expiry times (refresh tokens recommended)

Authorization: Role-based middlewares to restrict endpoints

Rate limiting: Protect login and OTP endpoints

File Uploads: Validate and sanitize uploaded files (size, extension); store in S3

Email: Use verified SMTP, do not expose credentials in logs

Input Validation: Validate all request bodies with Joi or express-validator

Audit Logging: Store important actions (blacklist, complaints, OTP generation) for audit

Contribution Guidelines

If you or a friend want to add a commit that’s visible on GitHub:

Fork or clone the repo.

Create a branch: git checkout -b feat/readme-enhancements

Make small, meaningful changes (README, docs, comments, seed data)

Commit with a clear message:

git add README.md
git commit -m "docs: expand README with API examples, models and deployment steps"
git push origin feat/readme-enhancements


Create a Pull Request and request a review.

If you must make a commit on someone else's behalf, get explicit consent and prefer Co-authored-by in the commit message:

git commit -m "docs: add extended README

Co-authored-by: Anjali483-prog <annumehra175@gmail.com>"

Suggested Large README Addition (for a 500+ line commit)

Below is a very long README expansion that you can paste into README.md in place of the current content. It's intentionally verbose, includes diagrams, full API specs, example payloads, seed data, troubleshooting tips and contribution guidelines — all content that is non-destructive and appropriate for a single large commit.

Important: This replacement is documentation-only and will not change application behavior. It creates a meaningful contribution that is visible in GitHub history (500+ insertions).

(BEGIN LONG README CONTENT)

The following section is the “big replacement”. Copy everything from here into your README.md file to create a large documentation commit.

SEWA — Full Documentation & Developer Guide
Short description

SEWA (Smart Excess Food Welfare & Assistance System) is a MERN application designed to reduce food waste by connecting hotels/restaurants with NGOs in real time. This guide covers architecture, API documentation, deployment, testing, and maintenance.

Table of detailed contents (developer-focused)

Architectural decisions

Data models & fields

API contract and response examples

Real-time events & message format

Database index strategy for performance

Caching & scaling options

Backup / restore strategy

Monitoring & alerts

Troubleshooting common errors

Contribution & code-style rules

CI/CD pipeline suggestions

Appendix: useful scripts

Architectural decisions

Why MERN? Familiarity and fast development. React for responsive UI, Node/Express for REST and socket layer, MongoDB for flexible schemas.

Why socket.io? Two-way real-time events to notify Hotels and NGOs instantaneously.

Stateless API: Use stateless JWT tokens for horizontal scalability.

File storage: Use S3 for images; keep only references in DB.

Indexes: Index expiresAt, city, status, and hotel / ngo references for fast queries.

Data modeling decisions & rationale

Use references for relations to avoid duplicating large objects.

TTL index on expiresAt or an expiry job ensures prompt cleanup and helps UX.

Separate Pickup entity to record OTP lifecycle and verification metadata.

API contract (complete list with examples)
Authentication

POST /api/auth/register
Request:

{
  "role": "Hotel",
  "name": "Hotel A",
  "email": "hotelA@example.com",
  "password": "strongpassword",
  "phone": "1234567890",
  "address": "Street 1"
}


Response:

{ "success": true, "data": { "userId": "..." } }


POST /api/auth/login
Request:

{ "email": "hotelA@example.com", "password": "strongpassword" }


Response:

{ "token": "JWT_TOKEN", "user": { "id":"...", "role":"Hotel" } }

Food Endpoints (expanded)

GET /api/food/available?city=haldwani&page=1&limit=20&tags=vegetarian
Response:

{
  "data": [ /* array of food objects */ ],
  "meta": { "page": 1, "limit": 20, "total": 102 }
}


PUT /api/food/:id/accept

Auth: NGO

Body:

{ "ngoId": "..." }


Response:

{ "success": true, "message": "Accepted", "data": { /* updated food */ } }


POST /api/food/generate-otp

Body:

{ "foodId":"abc123", "requestedBy":"ngoId" }


Response:

{ "otp": "123456", "expiresAt": "2025-11-10T10:30:00Z" }


POST /api/food/verify-otp

Body:

{ "foodId":"abc123", "otp":"123456" }


Response:

{ "success": true, "message": "OTP Verified", "pickedAt": "2025-11-10T10:32:00Z" }

Chat

POST /api/chat/send

{ "from":"hotelId", "to":"ngoId", "message":"We'll hold for 10 mins" }


Response:

{ "success": true, "messageId":"..." }

Socket message payloads (detailed)
{
  "event": "food:new",
  "payload": {
    "id": "abc123",
    "title": "Leftover Biriyani",
    "hotel": { "id":"h1", "name":"Hotel A" },
    "quantity": 20,
    "location": { "lat": 29.2183, "long":79.5130 },
    "expiresAt": "2025-11-10T12:00:00Z"
  }
}


For food:accepted:

{
  "event": "food:accepted",
  "payload": { "foodId":"abc123", "ngoId":"n1", "acceptedAt":"2025-11-10T09:20:00Z" }
}

Database index strategy (suggested)

Food: { status: 1, city:1, expiresAt: 1 }

Hotel: { email:1 }

Pickup: { otp:1, createdAt:1 }

TTL: expiresAt TTL index or scheduled job

Caching & scaling

Use Redis to cache frequently-read lists (e.g., available food by city).

Use Redis pub/sub if scaling socket servers across multiple instances (adapter for socket.io).

Horizontal scale API servers behind a load balancer.

Backup / Restore

Use mongodump for periodic backups or Atlas built-in backups.

Restore with mongorestore.

S3: lifecycle rules for images, versioning enabled.

Monitoring & Alerts

Integrate with Sentry for exception tracking.

Use Prometheus + Grafana for metrics.

Set alerts for DB connection errors, high response times and failed OTP deliveries.

Troubleshooting common errors

OTP not delivered: check SMTP credentials and FRONTEND_URL for email templates.

Expired donations visible: ensure TTL or expiry job is running; check server timezone differences.

Socket rooms not working: ensure socket adapter configured and socket.join() uses consistent room ids.

Image upload fails: check Multer limits and storage permissions.

CI/CD pipeline (suggestion)

On main branch push:

Run tests

Build backend (docker image)

Build frontend

Deploy backend to Render / Docker registry

Deploy frontend to Vercel

Use prettier/eslint checks on PRs

Useful scripts (dev)

npm run seed — seed sample data

npm run migrate — run any migrations

npm run cleanup:uploads — clean old images

npm run expire:check — manually run expiry checks

Contribution & code style rules

Follow consistent formatting (Prettier)

Write unit tests for new backend features

Keep API changes backwards-compatible where possible

Add documentation for new endpoints

Use feature branches and PRs for all changes

Appendix: Sample seed data (JSON)
{
  "hotels": [
    { "name":"Hotel A", "email":"hotelA@example.com", "location": { "lat":29.2183, "long":79.5130 } },
    { "name":"Hotel B", "email":"hotelB@example.com", "location": { "lat":29.2100, "long":79.5200 } }
  ],
  "ngos": [
    { "name":"NGO 1", "email":"ngo1@example.com" },
    { "name":"NGO 2", "email":"ngo2@example.com" }
  ],
  "foods": [
    {
      "title":"Chapati & Sabzi",
      "hotel": "<hotelId>",
      "quantity": 20,
      "expiresAt": "2025-11-10T12:30:00Z",
      "status": "available"
    }
  ]
}

Appendix: Sample Postman Collection (suggested)

Export and include a postman_collection.json with endpoints:

Auth Register / Login

Food add / list / accept / generate-otp / verify-otp

Hotel dashboard

Admin endpoints

Appendix: UX & Accessibility Notes

Ensure color contrast for accessibility

Provide keyboard navigation for major flows

Toast messages for success/failure

Loading placeholders for list views

Appendix: Privacy & Compliance

Do not store sensitive PII beyond email and phone if not required

Ensure email templates do not leak other user data

Use GDPR-like best practices for deletion requests

Appendix: Future Enhancements (roadmap)

Multi-day scheduling and pre-orders for NGOs

Integration with mapping APIs for route optimization

ML-based suggestions for matching donations to NGOs

Offline support and progressive web app features

End of Long README content block

(END LONG README CONTENT)

How to replace README safely and commit as a single large change

Backup current README:

cp README.md README.md.bak


Replace content:

Overwrite README.md with the long content above (copy-paste entire block).

Stage & commit:

git add README.md
git commit -m "docs: comprehensive README — architecture, API, seed data, deployment and contribution guide"


If you want commit to show under your friend's name:

git commit --author="Anjali483-prog <annumehra175@gmail.com>" -m "docs: comprehensive README — architecture, API, seed data, deployment and contribution guide"


Or add Co-authored-by (preferred when you did the work but want to credit):

git commit -m "docs: comprehensive README — architecture, API, seed data, deployment and contribution guide

Co-authored-by: Anjali483-prog <annumehra175@gmail.com>"


Push:

git push origin main
