# Auth Module — Research Copilot

Auth routes lengkap: register, login, logout, me, refresh-token, verify-email, forgot-password, reset-password.

## 1. Install dependencies

```bash
npm install express prisma @prisma/client bcrypt jsonwebtoken zod dotenv cookie-parser cors nodemailer express-rate-limit
npm install -D typescript @types/express @types/bcrypt @types/jsonwebtoken @types/cookie-parser @types/cors @types/nodemailer @types/node ts-node-dev
```

## 2. Setup Prisma

Merge isi `prisma/schema.prisma` di folder ini ke schema Prisma utama project lo (model `User`, `RefreshToken`, enum `Role`). Kalau `User` model udah ada, tinggal tambahin field yang belum ada.

```bash
npx prisma migrate dev --name add_auth_fields
npx prisma generate
```

## 3. Copy file

Copy semua isi folder `src/` ke project lo (jangan copy `index.example.ts`, itu cuma contoh cara wiring — sesuaikan ke `index.ts` yang udah ada).

## 4. Setup .env

Copy `.env.example` jadi `.env`, isi semua value-nya. Generate JWT secret pakai:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## 5. Wire ke app utama

```ts
import authRoutes from "./routes/auth.routes";
app.use(cookieParser());
app.use("/auth", authRoutes);
```

## Endpoint yang jadi

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | /auth/register | - | Daftar akun baru, kirim email verifikasi |
| POST | /auth/login | - | Login, dapet accessToken + refreshToken (httpOnly cookie) |
| POST | /auth/logout | - | Revoke refresh token, clear cookie |
| GET | /auth/me | ✅ Bearer token | Data user yang lagi login |
| POST | /auth/refresh-token | - | Tukar refresh token jadi access token baru (rotation) |
| POST | /auth/verify-email | - | Verifikasi email pakai token dari email |
| POST | /auth/forgot-password | - | Kirim email reset password |
| POST | /auth/reset-password | - | Set password baru pakai token dari email |

## Cara pakai `requireAuth` middleware di route lain

```ts
import { requireAuth, requireRole } from "../middleware/auth.middleware";

router.get("/users/:userId/saved-papers", requireAuth, getSavedPapers);
router.delete("/admin/users/:userId", requireAuth, requireRole("ADMIN"), deleteUser);
```

`req.user` akan berisi `{ sub, email, role }` di semua route yang pakai `requireAuth`.

## Security notes

- Password di-hash pakai bcrypt (12 salt rounds).
- Refresh token disimpan di DB dalam bentuk hash (bukan plaintext) + rotation setiap kali dipakai.
- Email verification & reset password token juga di-hash sebelum disimpan (raw token cuma ada di email).
- Rate limiting di endpoint login/register (10x/15menit) dan forgot-password (5x/jam) buat cegah brute force.
- `forgot-password` selalu balas sukses walau email tidak ketemu (cegah user enumeration).
