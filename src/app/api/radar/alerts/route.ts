import { NextResponse } from "next/server";
import { isDatabaseConfigured, isDigestEmailConfigured } from "@/lib/infrastructure";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALERT_THRESHOLD = 80;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      jobs?: Array<{ id: string; title: string; company: string; score: number; sourceUrl?: string }>;
    };

    const highPriority = (body.jobs ?? []).filter((j) => j.score >= ALERT_THRESHOLD);

    if (highPriority.length === 0) {
      return NextResponse.json({ sent: false, reason: "No high-priority jobs" });
    }

    if (!isDigestEmailConfigured()) {
      return NextResponse.json({ sent: false, reason: "Email not configured" });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ sent: false, reason: "DB not configured" });
    }

    const jobList = highPriority
      .map((j) =>
        `\u2022 ${j.score}% \u2014 ${j.title} @ ${j.company}${j.sourceUrl ? `\n  ${j.sourceUrl}` : ""}`,
      )
      .join("\n\n");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.ARGUS_DIGEST_FROM_EMAIL ?? "argus@resend.dev",
        to: [process.env.ARGUS_DIGEST_TO_EMAIL ?? ""],
        subject: `\uD83C\uDFAF Argus \u2014 ${highPriority.length} high-priority job${highPriority.length > 1 ? "s" : ""} found`,
        text: `Argus found ${highPriority.length} job${highPriority.length > 1 ? "s" : ""} with score \u2265 ${ALERT_THRESHOLD}%:\n\n${jobList}\n\nOpen Argus: https://argus.aldenmerlin.com/control-center`,
      }),
    });

    if (!res.ok) {
      throw new Error(`Resend error: ${res.status}`);
    }

    return NextResponse.json({ sent: true, count: highPriority.length });
  } catch (error) {
    return NextResponse.json(
      { sent: false, error: error instanceof Error ? error.message : "Alert failed" },
      { status: 500 },
    );
  }
}
