import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  secure: Number(env.SMTP_PORT) === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(to: string, name: string, rawToken: string) {
  const verifyUrl = `${env.APP_URL}/verify-email?token=${rawToken}`;

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: "Verifikasi email kamu - Research Copilot",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Halo, ${name} 👋</h2>
        <p>Terima kasih sudah daftar di Research Copilot. Klik tombol di bawah untuk verifikasi email kamu:</p>
        <p style="margin: 24px 0;">
          <a href="${verifyUrl}" style="background:#111827;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">
            Verifikasi Email
          </a>
        </p>
        <p>Atau copy link ini ke browser:</p>
        <p style="word-break: break-all; color:#555;">${verifyUrl}</p>
        <p>Link ini berlaku 30 menit.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, name: string, rawToken: string) {
  const resetUrl = `${env.APP_URL}/reset-password?token=${rawToken}`;

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: "Reset password kamu - Research Copilot",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Halo, ${name} 👋</h2>
        <p>Kami menerima permintaan untuk reset password akun kamu. Klik tombol di bawah:</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background:#dc2626;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">
            Reset Password
          </a>
        </p>
        <p>Atau copy link ini ke browser:</p>
        <p style="word-break: break-all; color:#555;">${resetUrl}</p>
        <p>Link ini berlaku 30 menit. Kalau kamu tidak meminta ini, abaikan email ini.</p>
      </div>
    `,
  });
}
