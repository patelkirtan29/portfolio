import { NextResponse } from "next/server";
import { sendNotificationEmail } from "@/lib/email";

// POST /api/contact
//
// Email-notification-only endpoint for the site's contact form (see
// src/app/contact/ContactForm.tsx for the current field set: name, email,
// message). Modeled on the reference project's consultations route
// (src/app/api/consultations/route.ts, lines 65-117) for the overall
// validation / referenceId / response-shape pattern, but deliberately does
// NOT port that reference's Supabase persistence layer — this route only
// sends an owner-notification email via the shared helper in
// src/lib/email.ts. A persistence layer (e.g. Supabase, another DB) can be
// layered in later without changing this response shape.
interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

export async function POST(request: Request) {
  let body: Partial<ContactPayload>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { name, email, message } = body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const referenceId = crypto.randomUUID();

  // An email failure should never fail the request — the sender still gets
  // their reference ID back even if notifications are misconfigured or the
  // Resend call errors out. sendNotificationEmail itself also no-ops (with
  // a console.warn) when RESEND_API_KEY / NOTIFICATION_EMAIL aren't set.
  try {
    await sendNotificationEmail({ name, email, message }, referenceId);
  } catch (err) {
    console.error("Contact notification email error:", err);
  }

  return NextResponse.json({ referenceId }, { status: 200 });
}
