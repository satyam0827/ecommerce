# E-com

A full-stack e-commerce app with:

- Spring Boot + PostgreSQL backend
- React (Vite) frontend
- JWT login + Google OAuth login
- Cart, address management, Stripe checkout, and basic admin order view

This repo has both apps in one place:

- backend at project root (`src/main/...`)
- frontend in `client/`

---

## What works in this project

- User registration and login (`/users/register`, `/users/login`)
- Google OAuth sign-in (`/oauth2/**`)
- Product listing (public), product create/update/delete (admin only)
- Cart operations (add/update/remove/count)
- Address CRUD with default address support
- Stripe Checkout session creation + webhook handling
- Admin orders endpoint at `/admin/orders`
- File uploads served from `/uploads/**`

---

## Tech stack

**Backend**

- Java 21
- Spring Boot 4
- Spring Security + OAuth2 Client
- Spring Data JPA
- PostgreSQL
- Stripe Java SDK
- JWT (`jjwt`)

**Frontend**

- React 19
- Vite
- React Router
- Axios

---

## Project structure

```text
E-com/
├─ src/main/java/com/Ecommerce/E_com/   # Spring Boot source
├─ src/main/resources/application.yml   # Backend config
├─ .env                                 # Backend env vars (loaded by Spring)
├─ client/
│  ├─ src/                              # React source
│  ├─ .env                              # Frontend env vars
│  └─ package.json
├─ pom.xml
└─ mvnw.cmd
```

---

## Prerequisites

Install these first:

1. Java 21 (JDK)
2. PostgreSQL 14+ (or compatible)
3. Node.js 18+ and npm

---

## Environment setup

### 1) Backend `.env` (project root)

Create/update `E-com\.env` with:

```env
DB_URL=jdbc:postgresql://localhost:5432/e_com
DB_USERNAME=postgres
DB_PASSWORD=your_password

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

JWT_SECRET=change-this-to-a-long-random-value
FRONTEND_URL=http://localhost:5173
UPLOAD_DIR=uploads

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin_password
ADMIN_NAME=Super Admin
```

Notes:

- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` are required for startup.
- Google and Stripe values are required only for those features.
- `ADMIN_*` creates/updates one admin user at startup.

### 2) Frontend `.env` (`client/.env`)

```env
VITE_BACKEND_URL=http://localhost:8080
```

---

## Run locally

Open two terminals.

### Terminal 1: start backend

```powershell
cd C:\path\to\E-com
.\mvnw.cmd spring-boot:run
```

Backend default: `http://localhost:8080`

### Terminal 2: start frontend

```powershell
cd C:\path\to\E-com\client
npm install
npm run dev
```

Frontend default: `http://localhost:5173`

---

## Auth and access rules

- Public routes:
  - `POST /users/register`
  - `POST /users/login`
  - `/oauth2/**`
  - `POST /payments/webhook`
  - `GET /products`, `GET /products/{id}`
  - `GET /uploads/**`
- Admin only:
  - `POST /products`
  - `PUT /products/{id}`
  - `DELETE /products/{id}`
  - `GET /admin/orders`
- Everything else needs a Bearer token.

JWT is stored client-side (localStorage) and sent as `Authorization: Bearer <token>`.

---

## API overview (main endpoints)

| Area | Method | Path |
|---|---|---|
| Users | POST | `/users/register` |
| Users | POST | `/users/login` |
| Users | GET | `/users/me` |
| Users | PUT | `/users/me` (multipart for profile image) |
| Products | GET | `/products` |
| Products | GET | `/products/{id}` |
| Products | POST | `/products` (admin) |
| Products | PUT | `/products/{id}` (admin) |
| Products | DELETE | `/products/{id}` (admin) |
| Cart | GET | `/cart` |
| Cart | GET | `/cart/count` |
| Cart | POST | `/cart/{productId}` |
| Cart | PATCH | `/cart/{cartItemId}/quantity` |
| Cart | DELETE | `/cart/{cartItemId}` |
| Address | GET | `/addresses` |
| Address | POST | `/addresses` |
| Address | PUT | `/addresses/{id}` |
| Address | DELETE | `/addresses/{id}` |
| Address | PATCH | `/addresses/{id}/default` |
| Payments | POST | `/payments/checkout-session` |
| Payments | GET | `/payments/checkout-session/{sessionId}` |
| Payments | POST | `/payments/webhook` |
| Admin | GET | `/admin/orders` |

---

## Stripe checkout notes

- Backend creates Stripe Checkout sessions.
- Frontend redirects user to `session.url`.
- Webhook endpoint: `POST /payments/webhook`.

For local webhook testing, use Stripe CLI and forward events to:

```text
http://localhost:8080/payments/webhook
```

---

## Google OAuth notes

- Security config allows `/oauth2/**` and `/login/oauth2/**`.
- After OAuth success, backend redirects to frontend `/oauth-success?token=...`.

If you change frontend URL for deployment, update OAuth redirect behavior accordingly.

---

## Useful commands

Backend:

```powershell
.\mvnw.cmd test
.\mvnw.cmd clean package
```

Frontend:

```powershell
npm run dev
npm run build
npm run lint
```

---

## Common startup issues

1. **Backend fails immediately**  
   Usually missing DB env vars or PostgreSQL not reachable.

2. **`Could not resolve placeholder ...`**  
   `.env` is missing or command is run from wrong working directory.

3. **Frontend cannot call API**  
   Check `client/.env` (`VITE_BACKEND_URL`) and backend CORS (`FRONTEND_URL`).

4. **Stripe checkout fails**  
   Confirm `STRIPE_SECRET_KEY` and (for webhooks) `STRIPE_WEBHOOK_SECRET`.

