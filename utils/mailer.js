import nodemailer from "nodemailer";

let cachedTransporter = null;

const buildTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SERVICE } = process.env;

  if (SMTP_SERVICE && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      service: SMTP_SERVICE,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }

  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }

  return null;
};

export const sendMail = async ({ to, subject, text, html }) => {
  const fromUser = process.env.SMTP_USER;
  if (!cachedTransporter) {
    cachedTransporter = buildTransporter();
  }
  if (!cachedTransporter || !fromUser) {
    throw new Error("Email is not configured. Please set SMTP env variables.");
  }

  return cachedTransporter.sendMail({
    from: `"Divyaanza Stitch" <${fromUser}>`,
    to,
    subject,
    text,
    html,
  });
};
