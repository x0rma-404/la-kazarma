# ⚔ La Kazarma de BHOS CE 25

**Private Academic Workspace** for BHOS Computer Engineering Class of 2025.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (v22+) |
| Framework | Express.js |
| Database | SQLite (`node:sqlite` built-in) |
| Sessions | SQLite Session Store (`express-session`) |
| Templating | EJS |
| Auth | bcryptjs (12 rounds) |
| Email | nodemailer |
| CSS/JS | Vanilla (no external frameworks) |

---

## Quick Start

### 1. Install dependencies

```bash
cd la-kazarma
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Start the server

```bash
# Production
npm start

# Development (with auto-restart)
npm run dev
```

The app starts at **http://localhost:3000**

---

## Default Credentials

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `Admin@123` |
| Student Code | `ADMIN-001` |
| Role | Admin |

> ⚠ **Change the admin password immediately after first login.**

---

## Initial Invitation Code

```
BHOS-CE25-INIT
```

Use this code during registration to get **instant approval** (no admin review needed).

---

## Project Structure

```
la-kazarma/
├── src/
│   ├── config/         # Database & mailer config
│   ├── controllers/    # Route handlers
│   ├── middleware/     # Auth & role guards
│   ├── models/         # Database models
│   └── routes/         # Express routers
├── views/              # EJS templates
│   ├── partials/       # Reusable partials (head, sidebar, flash)
│   ├── auth/           # Login, register, password reset
│   ├── dashboard/      # Main dashboard
│   ├── profile/        # User profile
│   ├── settings/       # Account settings
│   └── admin/          # Admin panel
├── public/             # Static assets
│   ├── css/            # Stylesheets
│   └── js/             # Client-side scripts
├── database/           # SQLite database (auto-created)
├── uploads/            # File uploads (auto-created)
├── app.js              # Application entry point
└── .env                # Environment variables
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3000` |
| `SESSION_SECRET` | Session encryption key | (required) |
| `NODE_ENV` | Environment | `development` |
| `MAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP port | `587` |
| `MAIL_USER` | SMTP username | — |
| `MAIL_PASS` | SMTP password | — |
| `MAIL_FROM` | From address | `noreply@kazarma.local` |

> If `MAIL_USER` is not set, password reset links are logged to the console instead of emailed.

---

## Routes

### Auth
| Method | Route | Description |
|---|---|---|
| GET | `/login` | Login page |
| POST | `/login` | Authenticate |
| GET | `/register` | Registration page |
| POST | `/register` | Create account |
| GET | `/forgot-password` | Forgot password page |
| POST | `/forgot-password` | Send reset link |
| GET | `/reset-password?token=...` | Reset password page |
| POST | `/reset-password` | Update password |
| POST | `/logout` | Sign out |

### Dashboard
| Method | Route | Description |
|---|---|---|
| GET | `/dashboard` | Main dashboard |

### Profile & Settings
| Method | Route | Description |
|---|---|---|
| GET | `/profile` | View profile |
| POST | `/profile/update` | Update profile |
| GET | `/settings` | Settings page |
| POST | `/settings/password` | Change password |

### Admin (admin role required)
| Method | Route | Description |
|---|---|---|
| GET | `/profile/admin` | Admin panel |
| POST | `/profile/admin/users/:id/approve` | Approve user |
| POST | `/profile/admin/users/:id/reject` | Reject user |
| POST | `/profile/admin/users/:id/suspend` | Suspend user |
| POST | `/profile/admin/users/:id/reactivate` | Reactivate user |
| POST | `/profile/admin/invitation-codes` | Generate invite code |
| POST | `/profile/admin/invitation-codes/:id/deactivate` | Deactivate code |

---

## Security Features

- Passwords hashed with **bcrypt** (12 rounds)
- Sessions stored in SQLite with **httpOnly** + **SameSite=Lax** cookies
- Origin/Referer check on state-changing requests (CSRF mitigation)
- Admin routes protected by role middleware
- Password reset tokens expire after 1 hour
- User enumeration prevention on forgot-password

---

*La Kazarma de BHOS CE 25 — Built with ⚔ and ☕*
