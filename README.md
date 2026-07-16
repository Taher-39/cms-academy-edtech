# CMS Academy (EdTech)

- Live site: **https://cms-academy.vercel.app**
- GitHub: **https://github.com/Taher-39/cms-academy-edtech**

## Overview
CMS Academy is a Bangla-medium EdTech platform for academic students (class 6–12) and
job-seekers (BCS/NTRCA and similar prep), built as two separate apps:
- **`frontend/`** — Next.js (App Router) site
- **`backend/`** — a standalone Express + MongoDB API, deployed as a Vercel serverless function

Courses aren't limited to any fixed subject list — admins can add any subject/category at
any time, so the platform can host math, ICT, science, tech, or any other course as needed.

Four roles: **Student**, **Teacher**, **Admin**, **Super Admin**.

## Main Features

### 1) Courses & Learning
- Course catalog + detail pages, with admin-managed **categories/subjects** that can be
  added anytime (not hardcoded to a fixed subject list)
- Course types: full course, revision, MCQ-only, chapter-based
- Free and paid courses, with regular-price/discount-percent display
- Course approval workflow (pending → approved/rejected) and "featured" flag, managed by admin
- Lecture content: video (YouTube, typically unlisted) + notes (e.g. Google Drive links),
  grouped by chapter, with free-preview lectures for non-enrolled visitors
- Custom video player: renders its own play/pause/seek/mute/fullscreen controls instead of
  YouTube's native player chrome, so there's no Share button or end-of-video "watch next"
  suggestions grid on lecture/trailer videos
- Live classes with a meeting link, plus recordings attached after the session

### 2) Teacher Module
- Only admin/superAdmin can create or edit courses — a course is created *with* a teacher
  assigned to it, not by the teacher themselves
- Teachers manage lectures (create/edit/delete) only for the course(s) assigned to them
- Admin/superAdmin create teacher accounts directly (name/email/password, no OTP step) from
  the dashboard; the new teacher gets a branded email with their login credentials
- Self-registration always creates a **student** account — admin/teacher accounts can only
  be created or promoted by an existing admin/superAdmin (granting admin/superAdmin itself
  is restricted to superAdmin)

### 3) Enrollment, Access & Expiry
- Students enroll (free instant-enroll, or via payment for paid courses); access expires
  based on the course's configured duration
- **Super Admin** has default access to every course, with no enrollment record needed
- **Admin** does *not* get blanket access — Super Admin can grant an admin free, revocable
  access to specific courses individually (dashboard → এডমিন অ্যাক্সেস)
- Progress tracking (lectures watched, percent complete) per enrollment
- Coupon codes (flat or percent discount) applicable at checkout
- Admin/superAdmin can view all enrollments and issue refunds (SSLCommerz refund API)

### 4) QnA (Student-only)
- Enrolled students can ask questions on their course; teachers/admins can answer
- Access is gated by an active (non-expired) enrollment

### 5) Authentication & Security
- Registration with **email OTP** verification (Nodemailer)
- Forgot password / reset via OTP, plus authenticated change-password
- Google login via **Firebase**
- JWT-based sessions; role-based route/endpoint guards throughout the API

### 6) Payments (Paid Courses)
- SSLCommerz integration: init / success / fail / cancel / IPN callback routes
- Coupon-aware pricing and refund flow

### 7) AI Assistant & Support Widgets
- Floating WhatsApp + AI chat assistant button (bottom-right), the assistant is backed by
  the free-tier **Google Gemini API**, answering questions about courses/enrollment/account
  in Bangla
- Branded HTML emails (OTP, account-created) with phone/WhatsApp/Facebook contact footer

### 8) Site Content & Marketing
- Super Admin-managed site content: homepage banners, FAQ entries, terms & conditions text
- Footer social links (Facebook group, YouTube, LinkedIn, Instagram, X, TikTok)
- Public **"Apply as Teacher"** page (linked from the footer) — submissions email the admin

### 9) Admin/Super Admin Dashboard
- Users: list, change role, delete
- Courses: create/edit/delete/approve/reject/feature, assign teacher
- Categories: add/edit/delete subjects available when creating a course
- Coupons: create/edit/delete
- Analytics overview (students, teachers, courses, revenue)
- Payments/enrollments: view all, refund
- Admin course-access grants (Super Admin only)
- Site content editor (Super Admin only)

### 10) Media & UX
- Media uploads via **Cloudinary** (course thumbnails, avatars), handled with **multer**
- Dark/Light mode via a custom theme provider
- Public pages: About, FAQ, Terms & Conditions, Contact

## Tech Stack

**Frontend** (`frontend/`)
- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- Zustand (client state, persisted auth)
- axios (API client)
- Firebase (client-side Google sign-in)
- Zod, react-hook-form

**Backend** (`backend/`)
- Express + TypeScript, run locally via `tsx`
- MongoDB + Mongoose
- JWT (`jsonwebtoken`) + `bcryptjs`
- Zod (request validation)
- Nodemailer (OTP + transactional emails)
- Cloudinary (media storage) + `multer` (uploads)
- `sslcommerz-lts` (payments)
- Firebase Admin (Google ID token verification)
- Google Gemini API (AI assistant, called directly via `fetch`, no SDK dependency)
- Deployed to Vercel as a serverless function (`backend/api/index.ts` + `backend/vercel.json`)

## Codebase Structure (high-level)

### `frontend/src/`
- `app/` — routes (App Router): `courses/`, `courses/[id]/`, `courses/[id]/learn/`,
  `dashboard/` (+ role-gated subpages), `apply-teacher/`, `(auth)/`, `about/`, `contact/`,
  `faq/`, `terms/`
- `components/` — `Header`, `Footer`, `LayoutWrapper`, `Providers`, `ThemeProvider`,
  `Toast`, `FloatingAssistant` (WhatsApp + AI chat), `YouTubeEmbed` (custom player),
  `DeleteConfirmDialog`, `QnAThread`
- `lib/` — `api.ts` (axios client), `store.ts` (Zustand), `firebase.ts`
- `types/`, `utils/`

### `backend/src/`
- `app.ts` — the Express app (middleware + all routes), imported by both the local dev
  entrypoint and the Vercel serverless function
- `index.ts` — local dev bootstrap only (DNS workaround, `connectToDB`, `app.listen`)
- `modules/` — one folder per domain, each typically with `*.routes.ts`, `*.controller.ts`,
  `*.service.ts`, `*.validation.ts`:
  `auth` (incl. `admin.routes.ts` for user/teacher management), `course`, `category`,
  `enrollment`, `payment`, `qna`, `live`, `coupon`, `contact`, `settings`, `analytics`,
  `assistant`
- `shared/models/` — Mongoose models: `User`, `Course`, `Lecture`, `Enrollment`, `QnA`,
  `LiveClass`, `Coupon`, `Category`, `Settings`
- `shared/config/` — `db.ts`, `cloudinary.ts`, `nodemailer.ts`, `sslcommerz.ts`,
  `firebaseAdmin.ts`
- `shared/utils/` — `emailService.ts`, `emailTemplate.ts` (shared branded HTML wrapper)
- `shared/middleware/` — `auth.middleware.ts` (`authMiddleware`, `requireRole`, `optionalAuth`)

### `backend/api/`
- `index.ts` — Vercel serverless entrypoint (re-exports the Express app from `src/app.ts`)

## Local Development

This is two separate apps — run each from its own directory.

**Backend**
```bash
cd backend
npm install
cp .env.example .env   # fill in MongoDB/JWT/Nodemailer/Cloudinary/SSLCommerz/Firebase/Gemini values
npm run dev            # http://localhost:4000
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env.local   # fill in NEXT_PUBLIC_API_URL + Firebase client values
npm run dev                  # http://localhost:3000
```

## Deployment

Deployed as **two separate Vercel projects** (not a single Next.js app):
- One project with Root Directory `backend`, using `backend/vercel.json`'s rewrite so every
  path is served by the single serverless function at `backend/api/index.ts`
- One project with Root Directory `frontend` (standard Next.js zero-config deploy)

Env vars are set per-project in the Vercel dashboard, matching each app's `.env.example`.
The backend's `FRONTEND_URL` and the frontend's `NEXT_PUBLIC_API_URL` must point at each
other's deployed URLs.
