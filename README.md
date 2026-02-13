# Trainer Lab Access Portal (CloudBlitz)

A secure, full-stack web application designed for training institutes to manage lab access, schedule batches, and assign multiple trainers seamlessly. Featuring role-based authentication, real-time status updates, and a premium SaaS-style UI.

## 🚀 Key Features

### 🔐 Authentication & Security
- **Role-Based Access Control (RBAC)**: secure logins for **Admins** and **Trainers**.
- **Secure Authentication**: JWT-based auth with HttpOnly cookies, access/refresh token rotation.
- **Advanced Security**: Password hashing (bcrypt), rate limiting, Helmet headers, and CORS protection.
- **Admin Protection**: Admin registration requires a specific invite code.

### 📅 Batch Management
- **Comprehensive Scheduling**: Create, update, delete, and cancel training batches.
- **Multi-Trainer Support**: Assign **multiple trainers** to a single batch for collaborative sessions.
- **Conflict Detection**: Automatic overlap detection prevents double-booking any assigned trainer.
- **Status Tracking**: Real-time status updates (Upcoming, Live, Expired, Cancelled).

### 💻 Lab Access Control
- **Secure Credentials**: Lab credentials (URL, username, password) are stored securely.
- **Time-Based Access**: Credentials are **only visible** to assigned trainers/students when the batch is **Live**.
- **Auto-Expiry**: Access is automatically revoked (hidden) once the batch ends.
- **Visual Indicators**: Live countdown timers and status badges on the dashboard.

### 🎨 Premium UI/UX
- **Modern Design**: Built with Tailwind CSS v4, featuring glassmorphism and smooth gradients.
- **Responsive**: Fully optimized for desktop and tablet experiences.
- **Interactive**: Real-time form validation, toast notifications, and loading skeletons.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: React Context API
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios
- **Validation**: Zod (Client-side)
- **Date Handling**: Native Date object + custom helpers

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) + Mongoose
- **Authentication**: JSON Web Tokens (JWT) + bcrypt
- **Validation**: Zod (Server-side)
- **Security**: Helmet, CORS, Express Rate Limit, XSS Clean

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (Local instance or Atlas connection string)

### 1. Installation

You can install dependencies for both Frontend and Backend from the root directory:

```bash
# Installs dependencies for both Frontend and Backend
npm install
```

### 2. Environment Setup

Create a `.env` file in the **Backend** directory based on `.env.example`:

**Backend/.env**
```env
# Server Configuration
NODE_ENV=development
PORT=3000
CLIENT_ORIGIN=http://localhost:5173

# Database
MONGO_URI=mongodb://localhost:27017/trainer-portal

# JWT Secrets (Use strong random strings in production)
JWT_ACCESS_SECRET=your_access_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Security
ADMIN_INVITE_CODE=cloudblitz-admin-2026
```

### 3. Running the Application

You need to run the Backend and Frontend in separate terminals.

**Terminal 1: Start Backend**
```bash
cd Backend
npm run dev
```
*Server will start on http://localhost:3000*

**Terminal 2: Start Frontend**
```bash
cd Frontend
npm run dev
```
*Frontend will start on http://localhost:5173*

### 4. Building for Production

To build the entire project (Frontend static assets + Backend preparation):

```bash
# Runs build scripts for both Frontend and Backend
npm run build
```

---

## 🔌 API Documentation

### Auth Endpoints
- `POST /api/auth/register` - Register a new user (Trainer/Admin).
- `POST /api/auth/login` - User login.
- `POST /api/auth/logout` - Secure logout.
- `POST /api/auth/refresh` - Refresh access token.
- `GET /api/auth/me` - Get current user profile.

### Batch Endpoints
- `GET /api/batches` - List batches (Admin: all, Trainer: assigned only).
- `POST /api/batches` - Create a new batch (Admin only).
- `GET /api/batches/:id` - Get batch details.
- `PUT /api/batches/:id` - Update batch details.
- `DELETE /api/batches/:id` - Delete a batch.
- `PATCH /api/batches/:id/cancel` - Cancel a batch.
- `GET /api/batches/:id/credentials` - Get lab credentials (Live batches only).

### User Endpoints
- `GET /api/users/trainers` - Get list of all trainers (Admin only).

---

## 📂 Project Structure

```
Trainer-Lab-Access-Portal/
├── Backend/                # Express API Server
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Mongoose schemas (User, Batch)
│   │   ├── routes/         # API routes
│   │   ├── middlewares/    # Auth, Error, Validation middlewares
│   │   ├── utils/          # Helpers (Tokens, Passwords, Validation)
│   │   ├── app.js          # App setup
│   │   └── server.js       # Entry point
│   ├── .env                # Environment variables
│   └── package.json
│
├── Frontend/               # React Client
│   ├── src/
│   │   ├── api/            # API service calls
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Auth & Toast context
│   │   ├── pages/          # Page views (Dashboard, Login, Register, etc.)
│   │   ├── utils/          # Helpers
│   │   ├── App.jsx         # Main component
│   │   └── main.jsx        # Entry point
│   ├── vite.config.js
│   └── package.json
│
├── package.json            # Root scripts (install, build)
└── README.md               # Project documentation
```

## 🔐 Accounts

### Admin Account
- **Registration**: Use code `cloudblitz-admin-2026` during signup.
- **Capabilities**: Manage batches, view all trainers, assign trainers, cancel sessions.

### Trainer Account
- **Registration**: Select "Trainer" role (no code required).
- **Capabilities**: View assigned batches, access lab credentials during live sessions.

---

## 📄 License

This project is proprietary and confidential. Unauthorized copying or distribution is strictly prohibited.
