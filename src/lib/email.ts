import { Resend } from "resend";

// Generic, reusable server-side notification helper. Modeled on
// `sendOwnerNotification` in the reference project's
// src/app/api/consultations/route.ts (lines 27-63), but kept intentionally
// generic: no hardcoded field names (e.g. name/email/message) and no
// hardcoded branding, so any future route on this site can pass whatever
// payload shape it has and get a readable notification email out of it.
//
// Import-safe by design: if RESEND_API_KEY or NOTIFICATION_EMAIL aren't
// configured, this no-ops with a console.warn instead of throwing, so
// routes can call it unconditionally without needing their own env checks.

/**
 * Sends a notification email summarizing an arbitrary payload object.
 *
 * @param payload - Arbitrary key/value data to render into the email body
 *   (e.g. a parsed and validated form submission). Keys are used as-is for
 *   the row labels, so callers should pass already-human-friendly keys.
 * @param referenceId - An identifier for this submission/event, included in
 *   the subject line and as the first row of the summary table.
 */
export async function sendNotificationEmail(
  payload: Record<string, unknown>,
  referenceId: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFICATION_EMAIL;
  if (!apiKey || !notifyEmail) {
    console.warn("Resend not configured — skipping notification email.");
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: "Portfolio Website <notifications@resend.dev>",
    to: notifyEmail,
    subject: `New Website Submission (${referenceId})`,
    html: `
      <h2>New Website Submission</h2>
      <p>Someone submitted a form on the portfolio website.</p>
      <table cellpadding="6" cellspacing="0" border="0">
        <tr><td><strong>Reference ID</strong></td><td>${escapeHtml(referenceId)}</td></tr>
        ${renderPayloadRows(payload)}
      </table>
    `,
  });

  if (error) {
    console.error("Resend send failed:", error.message);
  }
}

// Builds one <tr> per payload entry, so any caller's field set (contact
// form today, something else tomorrow) renders without this module needing
// to know the field names ahead of time.
function renderPayloadRows(payload: Record<string, unknown>): string {
  return Object.entries(payload)
    .map(([key, value]) => {
      const label = escapeHtml(humanizeKey(key));
      const rendered = escapeHtml(formatValue(value));
      return `<tr><td valign="top"><strong>${label}</strong></td><td>${rendered}</td></tr>`;
    })
    .join("\n        ");
}

function humanizeKey(key: string): string {
  // "solutionId" -> "Solution Id", "message" -> "Message"
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
  return spaced.replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "(none provided)";
  if (typeof value === "string") return value.trim() || "(none provided)";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
