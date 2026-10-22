"use client";

import { Analytics, type BeforeSend } from "@vercel/analytics/next";

// Set in DevTools to keep this browser's visits out of the dashboard:
// localStorage.setItem("va-disable", "1")
const OPT_OUT_KEY = "va-disable";

const dropOptedOutEvents: BeforeSend = (event) => {
  // localStorage access throws in some privacy modes / blocked-storage contexts.
  try {
    return localStorage.getItem(OPT_OUT_KEY) !== null ? null : event;
  } catch {
    return event;
  }
};

// Client wrapper: the root layout is a Server Component and cannot pass the
// beforeSend function across the server/client boundary.
export default function VercelAnalytics() {
  return <Analytics beforeSend={dropOptedOutEvents} />;
}
