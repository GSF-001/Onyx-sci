import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { hashPassword, comparePassword } from "../utils/password.util";
import { generateRawToken, hashToken, addMinutes, addDays } from "../utils/token.util";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.util";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/email.util";
import { env } from "../config/env";
import crypto from "crypto";

const REFRESH_COOKIE_NAME = "refresh_token";
const isProd = env.NODE_ENV === "production";

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    domain: env.COOKIE_DOMAIN,
    maxAge: Number(env.JWT_REFRESH_EXPIRES_IN_DAYS) * 24 * 60 * 60 * 1000,
    path: "/auth",
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/auth", domain: env.COOKIE_DOMAIN });
}

async function issueTokensForUser(
  userId: string,
  email: string,
  role: "USER" | "ADMIN",
  userAgent?: string,
  ipAddress?: string
) {
  const accessToken = signAccessToken({ sub: userId, email, role });

  // buat record refresh token dulu biar dapet id (jti) buat revoke nanti
  const rawRefresh = crypto.randomUUID();
  const refreshRecord = await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(rawRefresh),
      userId,
      expiresAt: addDays(new Date(), Number(env.JWT_REFRESH_EXPIRES_IN_DAYS)),
      userAgent,
      ipAddress,
    },
  });

  const refreshToken = signRefreshToken({ sub: userId, jti: refreshRecord.id });

  // simpan hash dari JWT refresh token itself supaya bisa divalidasi & direvoke
  await prisma.refreshToken.update({
    where: { id: refreshRecord.id },
    data: { tokenHash: hashToken(refreshToken) },
  });

  return { accessToken, refreshToken };
}

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: "Email sudah terdaftar. Coba login atau pakai email lain.",
    });
  }

  const passwordHash = await hashPassword(password);
  const rawVerifyToken = generateRawToken();

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      emailVerifyToken: hashToken(rawVerifyToken),
      emailVerifyExpires: addMinutes(new Date(), 30),
    },
  });

  try {
    await sendVerificationEmail(user.email, user.name, rawVerifyToken);
  } catch (err) {
    console.error("Gagal kirim email verifikasi:", err);
    // user tetap kebuat, mereka bisa minta kirim ulang nanti — jangan gagalkan registrasi
  }

  return res.status(201).json({
    success: true,
    message: "Registrasi berhasil. Cek email kamu untuk verifikasi akun.",
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
    },
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ success: false, message: "Email atau password salah." });
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ success: false, message: "Email atau password salah." });
  }

  const { accessToken, refreshToken } = await issueTokensForUser(
    user.id,
    user.email,
    user.role,
    req.headers["user-agent"],
    req.ip
  );

  setRefreshCookie(res, refreshToken);

  return res.status(200).json({
    success: true,
    message: "Login berhasil.",
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      accessToken,
    },
  });
}

export async function logout(req: Request, res: Response) {
  const tokenFromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
  const tokenFromBody = req.body?.refreshToken;
  const refreshToken = tokenFromCookie || tokenFromBody;

  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { userId: payload.sub, tokenHash: hashToken(refreshToken) },
        data: { revoked: true },
      });
    } catch {
      // token invalid/expired — tetap lanjut clear cookie, tidak perlu error ke user
    }
  }

  clearRefreshCookie(res);

  return res.status(200).json({ success: true, message: "Logout berhasil." });
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: "User tidak ditemukan." });
  }

  return res.status(200).json({ success: true, data: user });
}

export async function refreshTokenHandler(req: Request, res: Response) {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: "Refresh token tidak ditemukan." });
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    clearRefreshCookie(res);
    return res.status(401).json({ success: false, message: "Refresh token tidak valid atau expired." });
  }

  const record = await prisma.refreshToken.findUnique({
    where: { id: payload.jti },
  });

  if (
    !record ||
    record.revoked ||
    record.tokenHash !== hashToken(refreshToken) ||
    record.expiresAt < new Date()
  ) {
    clearRefreshCookie(res);
    return res.status(401).json({ success: false, message: "Sesi sudah tidak berlaku, silakan login ulang." });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    return res.status(401).json({ success: false, message: "User tidak ditemukan." });
  }

  // revoke token lama, issue token baru (refresh token rotation)
  await prisma.refreshToken.update({ where: { id: record.id }, data: { revoked: true } });

  const tokens = await issueTokensForUser(
    user.id,
    user.email,
    user.role,
    req.headers["user-agent"],
    req.ip
  );

  setRefreshCookie(res, tokens.refreshToken);

  return res.status(200).json({
    success: true,
    data: { accessToken: tokens.accessToken },
  });
}

export async function verifyEmail(req: Request, res: Response) {
  const { token } = req.body;
  const hashedIncoming = hashToken(token);

  const user = await prisma.user.findFirst({
    where: {
      emailVerifyToken: hashedIncoming,
      emailVerifyExpires: { gt: new Date() },
    },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Token verifikasi tidak valid atau sudah kedaluwarsa.",
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifyToken: null,
      emailVerifyExpires: null,
    },
  });

  return res.status(200).json({ success: true, message: "Email berhasil diverifikasi." });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  // Selalu balas sukses walau user tidak ketemu, biar tidak bisa dipakai enumerasi email
  if (!user) {
    return res.status(200).json({
      success: true,
      message: "Kalau email terdaftar, link reset password sudah dikirim.",
    });
  }

  const rawToken = generateRawToken();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashToken(rawToken),
      passwordResetExpires: addMinutes(new Date(), 30),
    },
  });

  try {
    await sendPasswordResetEmail(user.email, user.name, rawToken);
  } catch (err) {
    console.error("Gagal kirim email reset password:", err);
  }

  return res.status(200).json({
    success: true,
    message: "Kalau email terdaftar, link reset password sudah dikirim.",
  });
}

export async function resetPassword(req: Request, res: Response) {
  const { token, newPassword } = req.body;
  const hashedIncoming = hashToken(token);

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedIncoming,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Token reset password tidak valid atau sudah kedaluwarsa.",
    });
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  // revoke semua refresh token yang ada, paksa login ulang di semua device
  await prisma.refreshToken.updateMany({
    where: { userId: user.id, revoked: false },
    data: { revoked: true },
  });

  return res.status(200).json({ success: true, message: "Password berhasil direset. Silakan login ulang." });
}
