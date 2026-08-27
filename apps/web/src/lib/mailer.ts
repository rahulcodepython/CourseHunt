import nodemailer from "nodemailer";

// Local dev points this at Mailpit (docker-compose service, web UI on
// http://localhost:8025) — no real inbox needed. Swap SMTP_* in production.
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "localhost",
    port: Number(process.env.SMTP_PORT) || 1025,
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
});

export async function sendOTPEmail(to: string, otp: string, purpose: "sign-in" | "email-verification" | "forget-password" | "change-email") {
    const subject = {
        "sign-in": "Your CourseHunt sign-in code",
        "email-verification": "Verify your CourseHunt email",
        "forget-password": "Reset your CourseHunt password",
        "change-email": "Confirm your new CourseHunt email",
    }[purpose];

    await transporter.sendMail({
        from: process.env.SMTP_FROM || "CourseHunt <no-reply@coursehunt.localhost>",
        to,
        subject,
        text: `Your CourseHunt verification code is: ${otp}\n\nThis code expires in 5 minutes. If you didn't request this, you can ignore this email.`,
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#059669">CourseHunt</h2>
            <p>Your verification code is:</p>
            <p style="font-size:32px;font-weight:700;letter-spacing:6px;color:#111">${otp}</p>
            <p style="color:#666;font-size:14px">This code expires in 5 minutes. If you didn't request this, you can safely ignore this email.</p>
        </div>`,
    });
}
