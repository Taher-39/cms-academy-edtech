# CMS Academy (EdTech)

- Live site: **https://cms-academy.vercel.app**
- GitHub: **https://github.com/Taher-39/cms-academy-edtech**

## Overview
CMS Academy is an EdTech platform (Bangla-focused) for **students in Bangladesh education tracks** and **job seekers**. It provides:
- Structured courses (academic + job-prep)
- **Prerecorded** lectures (with media/notes)
- **Live classes** (with streaming link + post-class recordings)
- A **student-only QnA** area
- Role-based access for **Super Admin / Admin / Teacher / Student**

## Main Features
### 1) Courses & Learning
- Course catalog with course detail pages
- Course variants (as supported by the product concept):
  - Full course
  - Revision course
  - MCQ-only course
  - Chapter-based course
  - Free courses
  - Paid courses with **preview/free lecture(s)**
- Lecture content types:
  - Video lectures (commonly via unlisted links)
  - Lecture notes/material links (e.g., Drive links)

### 2) Live Classes
- Live course/class provides a meeting link (e.g., Google Meet)
- After class, recordings are uploaded/attached in the app

### 3) Enrollment, Access & Expiry
- Students enroll into courses
- Access is restricted based on enrollment and **course validity/expiry**
  - When a course period ends, the student no longer has access to that course’s content and QnA.

### 4) QnA (Student-only)
- QnA section is available for eligible enrolled students
- Only students can access/post in QnA for their active/eligible course(s)

### 5) Authentication & Security
- Registration + **email OTP** using **Nodemailer**
- Forgot password + **OTP verification**
- Change password
- Google login via **Firebase**
- Token/session handling via **JWT**

### 6) Payments (Paid Courses)
- Paid course payment via **SSLCommerz**
- Payment lifecycle endpoints (init/success/fail/cancel/ipn)

### 7) Media & Uploads
- Media handling via **Cloudinary**
- Upload handling supported via **multer**

### 8) UX
- **Dark/Light mode** via `next-themes`
- Public pages: **FAQ**, **Terms & Conditions**, **Contact**

## Tech Stack
- **Next.js (App Router)**
- **TypeScript**
- **Tailwind CSS v4**
- **MongoDB + Mongoose**
- **JWT**
- **Firebase** (Google login)
- **Nodemailer** (OTP + email flows)
- **Zod** (validation)
- **react-hook-form** (forms)
- **Zustand** (client state)
- **Cloudinary** (media storage)
- **sslcommerz-lts** (payments)
- **multer** (uploads)

## Codebase Structure (high-level)

### `src/app/`
- `layout.tsx` – root layout + app providers
- `globals.css` – global styles
- `page.tsx` – landing/home
- `middleware.ts` – route protection / session checks

Routes:
- `src/app/courses/` + `src/app/courses/[id]/` – course pages
- `src/app/dashboard/` – user dashboard
- `src/app/faq/`, `src/app/terms/`, `src/app/contact/`

Auth-related UI/API routes are under:
- `src/app/(auth)/`

### `src/app/api/` (backend routes)
- `src/app/api/auth/*`
  - `register`, `login`, `google`, `forgot-password`, `verify-otp`, `reset-password`, `change-password`
- `src/app/api/courses/*`
  - course APIs and lecture/live/QnA related endpoints
- `src/app/api/enroll*`
  - enrollment + course access control
- `src/app/api/live/*`
  - live class endpoints and recordings
- `src/app/api/qna/*`
  - QnA questions and answers
- `src/app/api/payment/*`
  - init/success/fail/cancel + ipn
- `src/app/api/contact/`
  - contact form handling

### `src/components/`
Reusable UI components:
- `Header`, `Footer`
- `CourseCard`
- `ThemeToggle`
- `Providers`

### `src/models/`
Mongoose models:
- `User`, `Course`, `Enrollment`, `Lecture`, `LiveClass`, `QnA`

### `src/lib/`
Integrations/utilities:
- `db.ts` (MongoDB connection)
- `firebase.ts`
- `jwt.ts`
- `otp.ts`
- `store.ts` (Zustand setup)
- `api.ts` (API helper)

### `src/utils/` and `src/config/`
- `utils/emailService.ts` – Nodemailer mail helper
- `config/cloudinary.ts`, `config/nodemailer.ts`, `config/sslcommerz.ts`

## Local Development
1. Install dependencies:
```bash
npm install
```

2. Add environment variables (Firebase, MongoDB, Nodemailer/OTP, Cloudinary, SSLCommerz, JWT secrets, etc.).

3. Run the app:
```bash
npm run dev
```

4. Open:
- http://localhost:3000

## Deployment
- Designed for deployment on **Vercel** (Next.js).

