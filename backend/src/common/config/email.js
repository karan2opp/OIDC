import { Resend } from 'resend';
import 'dotenv/config';  // ES modules syntax
const resend = new Resend(process.env.EMAIL_API_KEY);

const sendVerificationEmail = async (email, token) => {
  try {
    const url = `${process.env.ISSUER}/api/auth/verifyEmail/${token}`;
    
await resend.emails.send({
  from: "Karan <noreply@karanop.in>",
  to: email,
  subject: "Verify Your Email",
  html: `<h2>Welcome!</h2><p>Click <a href="${url}">here</a> to verify your email.</p>`,
});

  } catch (error) {
    console.log("Error sending verification email:", error);
  }
};

const sendResetPasswordEmail = async (email, token) => {
  try {
    const url = `${process.env.CLIENT_URL}/resetPassword/${token}`;

    await resend.emails.send({
      from: "Karan <noreply@karanop.in>",
      to: email,                          // ✅ dynamic
      subject: 'Reset Your Password',
      html: `
        <h2>Password Reset</h2>
        <p>You requested to reset your password.</p>
        <p>Click <a href="${url}">here</a> to reset your password.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

  } catch (error) {
    console.log("Error sending reset email:", error);
  }
};

export { sendVerificationEmail, sendResetPasswordEmail };