# Pathway — Interactive Learning Platform

Pathway is a MERN-stack interactive learning platform built for the CSE470 course project. It features user authentication, role-based dashboards (Student, Instructor, Admin), and category/course management.

---

## Project Structure

```text
├── backend/            # Express.js API & MongoDB Models
├── frontend/           # React (Vite) + Tailwind CSS Frontend
└── .gitignore          # Root Git ignore rules
```

---

## Tech Stack

- **Frontend:** React 19 (Vite), Tailwind CSS v4, React Router v7, Lucide Icons
- **Backend:** Node.js, Express.js, MongoDB (Mongoose)
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs

---

## Setup & Running the Project

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (Local instance or MongoDB Atlas account)

### 🛠️ Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Update the `.env` file with your MongoDB connection string and JWT secret:
   ```text
   PORT=5000
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   ```
5. *(Optional)* Seed the database with the default Admin user (`admin@pathway.com` / `adminPassword123`):
   ```bash
   node scripts/seedAdmin.js
   ```
6. Start the backend development server:
   ```bash
   npm run dev
   ```

### 💻 Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```

---

## Features Implemented
- **Authentication System:** Secure registration and login flow with roles (Student, Instructor, Admin).
- **Role-Based Dashboards:** Protected routes and separate UI views for different user roles.
- **Admin Management:** Script to seed admin account and endpoints to manage content categories.
