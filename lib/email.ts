import nodemailer from "nodemailer";

export interface ClientFeedbackEmailInput {
  to: string;
  clientName: string;
  projectName: string;
  projectNumber: string;
  feedbackUrl: string;
}

export function getAppUrl(): string {
  const raw =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export function buildFeedbackUrl(token: string): string {
  return `${getAppUrl()}/feedback/${token}`;
}

function buildFeedbackEmailHtml(input: ClientFeedbackEmailInput): string {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Customer Feedback Request</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f7f8fa;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f7f8fa;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
            <tr>
              <td style="background-color:#0f766e;padding:24px 32px;">
                <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.04em;">SOLiDPRO</p>
                <p style="margin:6px 0 0;color:#ccfbf1;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">Customer Feedback Review</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#18181b;">Hi ${escapeHtml(input.clientName)},</p>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#52525b;">
                  You have been invited to provide customer feedback for the following project. Please rate Quality of Work, Delivery Timeliness, Communication Quality, Technical Competence, and Overall Satisfaction.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f8fa;border:1px solid #e4e4e7;border-radius:8px;">
                  <tr>
                    <td style="padding:20px 24px;">
                      ${detailRow("Project", input.projectName)}
                      ${detailRow("Project Number", input.projectNumber, true)}
                    </td>
                  </tr>
                </table>
                <p style="margin:28px 0 16px;text-align:center;">
                  <a href="${escapeHtml(input.feedbackUrl)}" style="display:inline-block;background-color:#0f766e;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:8px;">
                    Provide Feedback
                  </a>
                </p>
                <p style="margin:0;font-size:12px;line-height:1.5;color:#71717a;text-align:center;">
                  This link expires in 24 hours.<br /><br />
                  If the button does not work, copy and paste this link into your browser:<br />
                  <a href="${escapeHtml(input.feedbackUrl)}" style="color:#0f766e;word-break:break-all;">${escapeHtml(input.feedbackUrl)}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;border-top:1px solid #e4e4e7;background:#f7f8fa;">
                <p style="margin:0;font-size:11px;color:#a1a1aa;text-align:center;">© 2026 SOLiDPRO. This is an automated message.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
}

function detailRow(label: string, value: string, last = false): string {
  return `
    <p style="margin:0 0 ${last ? "0" : "12px"};">
      <span style="display:block;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#a1a1aa;">${escapeHtml(label)}</span>
      <span style="display:block;margin-top:2px;font-size:14px;font-weight:600;color:#18181b;">${escapeHtml(value)}</span>
    </p>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendClientFeedbackEmail(input: ClientFeedbackEmailInput): Promise<void> {
  const html = buildFeedbackEmailHtml(input);
  const subject = `Feedback requested: ${input.projectName}`;
  const text = [
    `Dear ${input.clientName},`,
    "",
    `You have been invited to provide customer feedback.`,
    `Please rate Quality of Work, Delivery Timeliness, Communication Quality, Technical Competence, and Overall Satisfaction.`,
    `Project: ${input.projectName}`,
    `Project Number: ${input.projectNumber}`,
    "",
    `Provide Feedback: ${input.feedbackUrl}`,
    "This link expires in 24 hours.",
  ].join("\n");

  await sendMail({
    to: input.to,
    subject,
    text,
    html,
  });
}

export interface PasswordSetupEmailInput {
  to: string;
  name?: string | null;
  setupUrl: string;
}

export interface PasswordResetEmailInput {
  to: string;
  name?: string | null;
  resetUrl: string;
}

export function buildPasswordSetupUrl(token: string): string {
  return `${getAppUrl()}/set-password?token=${encodeURIComponent(token)}`;
}

export function buildPasswordResetUrl(token: string): string {
  return `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

function greetingName(name?: string | null): string {
  const trimmed = name?.trim();
  return trimmed || "there";
}

function buildAuthEmailHtml(input: {
  eyebrow: string;
  heading: string;
  intro: string;
  buttonLabel: string;
  buttonUrl: string;
  expiryNote: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(input.heading)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f7f8fa;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f7f8fa;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
            <tr>
              <td style="background-color:#0f766e;padding:24px 32px;">
                <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.04em;">SOLiDPRO</p>
                <p style="margin:6px 0 0;color:#ccfbf1;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">${escapeHtml(input.eyebrow)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#18181b;">${escapeHtml(input.heading)}</p>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#52525b;">${escapeHtml(input.intro)}</p>
                <p style="margin:0 0 16px;text-align:center;">
                  <a href="${escapeHtml(input.buttonUrl)}" style="display:inline-block;background-color:#0f766e;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:8px;">
                    ${escapeHtml(input.buttonLabel)}
                  </a>
                </p>
                <p style="margin:0;font-size:12px;line-height:1.5;color:#71717a;text-align:center;">
                  ${escapeHtml(input.expiryNote)}<br /><br />
                  If the button does not work, copy and paste this link into your browser:<br />
                  <a href="${escapeHtml(input.buttonUrl)}" style="color:#0f766e;word-break:break-all;">${escapeHtml(input.buttonUrl)}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;border-top:1px solid #e4e4e7;background:#f7f8fa;">
                <p style="margin:0;font-size:11px;color:#a1a1aa;text-align:center;">© 2026 SOLiDPRO. This is an automated message.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
}

export async function sendPasswordSetupEmail(input: PasswordSetupEmailInput): Promise<void> {
  const name = greetingName(input.name);
  const subject = "Set up your SOLiDPRO CFR account";
  const intro = `Hi ${name}, an administrator created a Customer Feedback Report account for you. Use the button below to set your password. This link expires in 48 hours and can be used only once.`;
  const html = buildAuthEmailHtml({
    eyebrow: "Customer Feedback Report",
    heading: "Set your password",
    intro,
    buttonLabel: "Set Password",
    buttonUrl: input.setupUrl,
    expiryNote: "This link expires in 48 hours.",
  });
  const text = [
    `Hi ${name},`,
    "",
    "An administrator created a Customer Feedback Report account for you.",
    "Set your password using this link:",
    input.setupUrl,
    "",
    "This link expires in 48 hours and can be used only once.",
  ].join("\n");

  await sendMail({ to: input.to, subject, text, html });
}

export async function sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void> {
  const name = greetingName(input.name);
  const subject = "Reset your SOLiDPRO CFR password";
  const intro = `Hi ${name}, we received a request to reset your Customer Feedback Report password. Use the button below to choose a new password. This link expires in 1 hour and can be used only once. If you did not request this, you can ignore this email.`;
  const html = buildAuthEmailHtml({
    eyebrow: "Customer Feedback Report",
    heading: "Reset your password",
    intro,
    buttonLabel: "Reset Password",
    buttonUrl: input.resetUrl,
    expiryNote: "This link expires in 1 hour.",
  });
  const text = [
    `Hi ${name},`,
    "",
    "We received a request to reset your Customer Feedback Report password.",
    "Choose a new password using this link:",
    input.resetUrl,
    "",
    "This link expires in 1 hour and can be used only once.",
    "If you did not request this, you can ignore this email.",
  ].join("\n");

  await sendMail({ to: input.to, subject, text, html });
}

async function sendMail(input: { to: string; subject: string; text: string; html: string }): Promise<void> {
  const smtpUser = process.env.SMTP_USER || "Abirami.P@Solidpro-es.com";
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || "smtp.office365.com";
  const port = Number(process.env.SMTP_PORT || "587");

  if (!smtpPass) {
    throw new Error("SMTP_PASS is not set. Add the Outlook mailbox password in .env to send emails.");
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      minVersion: "TLSv1.2",
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || smtpUser,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
  } catch (error) {
    throw new Error(formatSmtpError(error));
  }
}

function formatSmtpError(error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";
  const response =
    error && typeof error === "object" && "response" in error
      ? String(error.response)
      : error instanceof Error
        ? error.message
        : "";

  if (code === "EAUTH" || response.includes("535") || response.includes("5.7.139")) {
    return "Outlook rejected the mailbox login (535). Use an app password in SMTP_PASS, and ask IT to enable Authenticated SMTP for this Microsoft 365 mailbox.";
  }

  if (error instanceof Error && error.message) {
    return `Failed to send email: ${error.message}`;
  }

  return "Failed to send the feedback email through Outlook SMTP.";
}
