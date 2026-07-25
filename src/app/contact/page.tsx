import type { Metadata } from "next";
import ContactForm from "./ContactForm";

// A server component wrapper so Contact can export real App Router
// metadata — the interactive logic (copy-to-clipboard state, the mailto
// submit handler) lives in the client child component below, since the
// metadata API can't be exported from a "use client" file.
export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return <ContactForm />;
}
