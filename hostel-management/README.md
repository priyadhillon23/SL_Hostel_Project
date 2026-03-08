# 🏫 Hostel Management System

A full-stack, production-ready Hostel Management Web Application with **Role-Based Access Control (RBAC)**, JWT authentication, and separate dashboards for 5 roles.

---

## 🚀 Tech Stack
- **Frontend**: React.js (18), React Router v6, Axios, react-hot-toast
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT + bcryptjs
- **Email**: Nodemailer (SMTP/Gmail)
- **Security**: Helmet, CORS, Rate Limiting, Input Validation

---

## 📦 Project Structure
```
hostel-management/
├── backend/
│   ├── config/          # Database connection
│   ├── middleware/       # Auth, error handler
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API routes
│   ├── utils/            # Email service, JWT, seeder
│   ├── server.js         # Entry point
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/   # Sidebar component
    │   ├── context/      # Auth context
    │   ├── pages/        # Dashboard pages
    │   ├── styles/       # Global CSS
    │   └── utils/        # Axios instance
    └── public/
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone / Copy Files
Copy both `backend/` and `frontend/` folders to your system.

### 2. Backend Setup
```bash
cd backend
npm install

# Copy .env.example to .env and configure
cp .env.example .env
# Edit .env with your MongoDB URI and email credentials

# Seed the database with demo data
npm run seed

# Start the backend server
npm run dev  # or npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start the React development server
npm start
```

The frontend runs on **http://localhost:3000** and proxies API calls to **http://localhost:5000**.

---

## 🔑 Login Credentials (After Seeding)

| Role | Login Method | Identifier | Password |
|------|-------------|------------|----------|
| 🎓 Student | Roll Number | `CS2021001` | `9876543210` |
| 🎓 Student | Email | `student@college.edu` | `9876543210` |
| 👮 Warden | Employee ID | `W001` | `warden123` |
| 🍽️ Mess Admin | Employee ID | `M001` | `mess123` |
| ⚡ Worker | Employee ID | `EW001` | `worker123` |
| 🛡️ Super Admin | Email | `superadmin@hostel.com` | `superadmin123` |

> **Note**: Default student password is their mobile number.

---

## 📧 Email Configuration

To enable email notifications, configure these in `.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password   # Use App Password for Gmail
EMAIL_FROM=Hostel Management <your_email@gmail.com>
```

**For Gmail**: Enable 2FA → Generate App Password → Use it as `EMAIL_PASS`

---

## 🔐 Role Capabilities

### 🎓 Student
- Apply for leave (auto-fills profile data)
- View leave status (Pending/Approved/Rejected)
- View daily/weekly mess menu
- Give mess ratings & feedback
- Raise maintenance complaints
- Track complaint status
- Change password

### 👮 Warden
- View all leave requests (filter by status)
- Approve/Reject leaves with remark
- Email sent to parent automatically
- View student directory with full details

### 🍽️ Mess Admin
- Upload/Edit/Delete daily menu
- View all student reviews
- See average ratings & feedback

### ⚡ Worker (Repair Staff)
- View assigned/unassigned complaints
- Update complaint status (Pending → Working → Resolved)
- Add resolution notes
- Student gets email notification on resolution

### 🛡️ Super Admin
- Full user management (Add/Edit/Delete/Disable)
- Add students with complete profile
- Add staff (Warden, Mess Admin, Worker)
- Reset user passwords
- View system-wide analytics

---

## 🌐 API Endpoints

### Auth
- `POST /api/auth/login` - Login (all roles)
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/change-password` - Change password

### Leave
- `POST /api/leave` - Apply leave (Student)
- `GET /api/leave/my` - My leaves (Student)
- `GET /api/leave/all` - All leaves (Warden)
- `PUT /api/leave/:id` - Approve/Reject (Warden)

### Mess
- `GET /api/mess/menu` - Weekly menu (All)
- `POST /api/mess/menu` - Add menu (Mess Admin)
- `PUT /api/mess/menu/:id` - Update menu (Mess Admin)
- `DELETE /api/mess/menu/:id` - Delete menu (Mess Admin)
- `POST /api/mess/review` - Submit review (Student)
- `GET /api/mess/reviews` - All reviews (Mess Admin)

### Complaints
- `POST /api/complaints` - Raise complaint (Student)
- `GET /api/complaints/my` - My complaints (Student)
- `GET /api/complaints/all` - All complaints (Worker/Warden)
- `PUT /api/complaints/:id` - Update status (Worker)

### Admin (Super Admin)
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Add user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `PUT /api/admin/users/:id/reset-password` - Reset password
- `GET /api/admin/analytics` - System analytics

---

## 🔒 Security Features
- JWT tokens with expiry
- bcryptjs password hashing
- Role-based route protection
- Rate limiting (200 req/15min, 20 login/15min)
- Helmet HTTP security headers
- Input validation with express-validator
- MongoDB injection protection via Mongoose

---

## 📱 UI Features
- Responsive sidebar navigation
- Color-coded status badges
- Toast notifications for all actions
- Empty states for no-data scenarios
- Modal dialogs for forms
- Auto-fill from user profile
- Filter tabs for data tables
Added email and WhatsApp notification feature