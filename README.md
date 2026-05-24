# 🏆 Tournament Management System

A production-ready, enterprise-grade sports tournament management platform built with the MERN stack. Features a premium SaaS-quality UI/UX with dark mode, real-time updates, and comprehensive role-based access control.

---

## ✨ Features

### 🔐 Authentication & Security
- Multi-step registration with OTP email verification
- JWT access + refresh token system with rotation & reuse detection
- Role-based access control (User, Organizer, Admin)
- Government ID document upload & admin verification
- Account lockout after failed login attempts
- Rate limiting on all API endpoints
- Helmet security headers, MongoDB sanitization

### 🏟️ Tournament Management
- Multi-step tournament creation wizard
- Automatic bracket generation (single elimination, round robin)
- Registration approval workflow
- Real-time participant counter
- Tournament status lifecycle management
- Admin approval queue

### 👥 Team Management
- Create and manage teams with member roles
- Player stats tracking
- Team performance analytics

### 📊 Analytics & Dashboards
- Role-specific dashboards (User/Organizer/Admin)
- Platform analytics with Recharts visualizations
- User growth, tournament creation trends
- Registration status breakdowns

### 🔔 Real-time Features
- Socket.io live notifications
- Real-time tournament bracket updates
- Match result broadcasting
- Command palette (Ctrl+K)

### 🎨 UI/UX
- Dark/Light mode
- Glassmorphism effects
- Framer Motion animations
- Skeleton loaders & shimmer effects
- Responsive mobile-first design
- Toast notifications
- Modal transitions

---

## 🗂️ Project Structure

```
tournament-system/
├── backend/
│   ├── config/         # DB, Logger, Socket, Swagger, Cloudinary
│   ├── controllers/    # Auth, Tournament, Registration, Admin, Analytics
│   ├── middleware/     # Auth, Error Handler
│   ├── models/         # User, Tournament, Team, Ground, Registration, Payment, Notification, AuditLog, Event
│   ├── routes/         # All API routes
│   ├── services/       # Notification Service
│   ├── tests/          # Jest tests
│   ├── utils/          # AppError, JWT, Email, Bracket Generator, Pagination, Audit Log, Seeder
│   ├── server.js
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/ # Navbar, Sidebar, DashboardHeader, TournamentCard, NotificationDropdown, CommandPalette, UI components
│   │   ├── features/   # Auth, UI, Notifications Redux slices
│   │   ├── layouts/    # PublicLayout, DashboardLayout
│   │   ├── pages/
│   │   │   ├── auth/       # Login, Register, VerifyEmail, ForgotPassword, ResetPassword
│   │   │   ├── public/     # Landing, Tournaments, TournamentDetail, 404
│   │   │   ├── user/       # Dashboard, Teams, Registrations, Payments, Profile
│   │   │   ├── organizer/  # Dashboard, Tournaments, CreateTournament, ManageTournament, Grounds
│   │   │   └── admin/      # Dashboard, Users, Tournaments, Analytics, AuditLogs, PendingApprovals
│   │   ├── services/   # API (axios), Socket
│   │   ├── store/      # Redux store
│   │   └── App.tsx
│   └── .env.example
└── docker-compose.yml
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 7+ (local or Atlas)
- npm or yarn

### 1. Clone and Setup Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secrets, email credentials

npm install
npm run seed   # Seed demo data
npm run dev    # Start backend on http://localhost:5000
```

### 2. Setup Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env if needed

npm install
npm run dev    # Start frontend on http://localhost:5173
```

### 3. Or use Docker Compose (Recommended)

```bash
# Copy env files
cp backend/.env.example backend/.env
# Edit backend/.env

docker-compose up --build
# App available at http://localhost
# API at http://localhost:5000
# API Docs at http://localhost:5000/api/docs
```

---

## 🔑 Demo Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tournamentsystem.com | Admin@123456 |
| Organizer | cricket@organizer.com | Organizer@123 |
| User | rahul@user.com | User@12345 |

---

## 🌐 API Documentation

After starting the backend, visit:
- **Swagger UI**: http://localhost:5000/api/docs
- **Health Check**: http://localhost:5000/api/health

### Key API Endpoints

```
POST   /api/auth/register         - User registration
POST   /api/auth/login            - Login
POST   /api/auth/refresh-token    - Token refresh
POST   /api/auth/verify-email     - OTP email verification
POST   /api/auth/forgot-password  - Forgot password OTP
POST   /api/auth/reset-password   - Reset password

GET    /api/tournaments           - List tournaments (public)
POST   /api/tournaments           - Create tournament (organizer)
GET    /api/tournaments/:id       - Tournament detail
PUT    /api/tournaments/:id       - Update tournament
POST   /api/tournaments/:id/approve - Admin approve
POST   /api/tournaments/:id/generate-bracket - Generate bracket

POST   /api/registrations         - Register team
GET    /api/registrations/my      - User's registrations
PUT    /api/registrations/:id/approve - Approve registration
PUT    /api/registrations/:id/reject  - Reject registration

GET    /api/admin/stats           - Platform stats (admin)
GET    /api/admin/users           - All users (admin)
GET    /api/admin/pending-approvals - Pending items
GET    /api/admin/audit-logs      - Activity logs

GET    /api/analytics/platform    - Platform analytics (admin)
GET    /api/analytics/organizer   - Organizer analytics
GET    /api/analytics/user        - User analytics
```

---

## 🗄️ Database Schema

### Collections
- **Users** - User accounts with roles, status, documents
- **Tournaments** - Tournament listings with brackets
- **Teams** - Team management with members
- **Grounds** - Venue management
- **Registrations** - Team tournament registrations
- **Payments** - Payment records
- **Notifications** - Real-time notifications
- **AuditLogs** - System activity logs
- **Events** - Match events within tournaments

---

## 🧪 Testing

```bash
cd backend
npm test
```

---

## ⚙️ Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/tournament_system
JWT_ACCESS_SECRET=your_secret_32_chars_min
JWT_REFRESH_SECRET=your_secret_32_chars_min
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM="Tournament System <noreply@tournamentsystem.com>"
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🚢 Production Deployment

1. Set `NODE_ENV=production` in backend `.env`
2. Update `CLIENT_URL` to your frontend domain
3. Use MongoDB Atlas for production database
4. Configure Cloudinary for file uploads
5. Set strong JWT secrets (32+ random chars)
6. Build frontend: `npm run build`
7. Deploy using Docker Compose or cloud platform

---

## 📝 License

MIT License - See LICENSE for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
