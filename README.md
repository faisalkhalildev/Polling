PollHub — MERN Polling & Voting Platform
A full-stack social polling app: create single/multiple-choice polls, vote in real time, see live animated results and analytics, like/save/share/comment, explore & search, and manage your profile — all in a green + white "heartbeatable" UI.

Stack
Frontend: React 18, Vite, React Router, Tailwind CSS, Axios, Recharts, react-icons, react-hot-toast
Backend: Node.js, Express, MongoDB/Mongoose, JWT auth, bcryptjs, (OTP emails), Cloudinary + Multer (image uploads)
Project structure
mern-poll-app/
├── backend/     # Express API (MVC: controllers, models, routes, middleware)
└── frontend/    # React app (Vite)
1. Backend setup
cd backend
npm install
cp .env.example .env
Fill in .env:

PORT=5000
MONGO_URI=your_mongodb_connection_string       # MongoDB Atlas or local
JWT_SECRET=some_long_random_string
JWT_EXPIRES_IN=7d
EMAIL_USER=your_gmail_address
EMAIL_PASSWORD=your_gmail_app_password         # Google Account → Security → App Passwords
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
Run it:

npm run dev      # nodemon, or `npm start` for plain node
API health check: GET http://localhost:5000/api/health

2. Frontend setup
cd frontend
npm install
cp .env.example .env
.env:

VITE_API_URL=http://localhost:5000/api
Run it:

npm run dev
Visit http://localhost:5173.

Notes on what's included
Auth: register (with optional profile picture), login, JWT-protected routes, full forgot-password flow (email → OTP via Nodemailer → verify → reset), OTP expiry (10 min), single-use OTPs, resend cooldown + hourly rate limiting.
Polls: single/multiple choice, dynamic add/remove/edit options (min 2), category, tags, expiration date, optional image, allow-comments/allow-anonymous toggles.
Voting: one vote per user per poll (enforced at the DB level via a unique index), instant result refresh, animated result bars, "Your vote has been counted! 🎉" confirmation. Live updates use a lightweight polling refresh (every 8s on the poll page) — the architecture is ready to swap in Socket.IO later without changing the data model.
Analytics: doughnut chart, bar chart, and a voting-activity-over-time line chart (Recharts), computed server-side.
Social features: like/unlike, save/unsave, share (Web Share API with clipboard fallback + link), comments (add/delete own/like), notifications (like/comment/vote/milestone) with unread count and mark-all-read.
Explore/Search: category filters, search by question/description/tags/username, sort by latest/trending/most-votes/most-liked/ending-soon.
Profile: stats, Created/Participated/Saved/History tabs, edit name/username/bio/photo.
Responsive: desktop top nav, mobile bottom nav bar.
Deliberately kept simple / not implemented
Follow/followers — the brief marked this "if implemented"; it's left out to keep the data model lean. The Notification model already supports a follow type if you want to add it later.
Real Socket.IO — the brief explicitly allowed a polling/refresh fallback if sockets added too much complexity; that's what's implemented, with the architecture (poll-scoped results endpoint) ready for a socket upgrade.
Multi-provider share buttons — the app uses the native Web Share API (covers WhatsApp/X/etc. on mobile) with a "copy link" clipboard fallback on desktop, rather than hand-building separate share-intent URLs for each platform.
Deployment
Backend: any Node host (Render, Railway, Fly.io) + MongoDB Atlas.
Frontend: any static host (Vercel, Netlify) — set VITE_API_URL to your deployed backend URL (with or without /api). In Vercel, add it under Settings → Environment Variables, then redeploy. Set the backend's CLIENT_URL to the exact deployed frontend origin, for example https://your-project.vercel.app; comma-separate multiple origins when needed. This is required for CORS and share links.
For a Vercel backend deployment, add the complete MongoDB Atlas connection string as MONGO_URI in the backend project's environment variables. In MongoDB Atlas, allow the Vercel deployment to reach the cluster (for example, add 0.0.0.0/0 in Network Access if you do not use a more restrictive network setup). A missing or blocked connection causes the API to return a 503 Database is temporarily unavailable response rather than queueing database queries.
