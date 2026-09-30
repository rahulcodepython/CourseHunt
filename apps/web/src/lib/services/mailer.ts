import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTPEmail(
  to: string,
  otp: string,
  purpose: "sign-in" | "email-verification" | "forget-password" | "change-email",
) {
  const subject = {
    "sign-in": "Your CourseHunt sign-in code",
    "email-verification": "Verify your CourseHunt email",
    "forget-password": "Reset your CourseHunt password",
    "change-email": "Confirm your new CourseHunt email",
  }[purpose];

  const from = process.env.EMAIL_FROM || "CourseHunt <onboarding@resend.dev>";

  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `[resend] RESEND_API_KEY is not set. OTP for ${to} (${purpose}) is: ${otp}`,
    );
    return;
  }

  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    text: `Your CourseHunt verification code is: ${otp}\n\nThis code expires in 5 minutes. If you didn't request this, you can ignore this email.`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#059669">CourseHunt</h2>
            <p>Your verification code is:</p>
            <p style="font-size:32px;font-weight:700;letter-spacing:6px;color:#111">${otp}</p>
            <p style="color:#666;font-size:14px">This code expires in 5 minutes. If you didn't request this, you can safely ignore this email.</p>
        </div>`,
  });

  if (error) {
    console.error("[resend] Failed to send OTP email:", error);
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }

  return data;
}
