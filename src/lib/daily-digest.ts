import { db } from "@/lib/db";
import {
  hasVercelCronPath,
  isDatabaseConfigured,
  isDigestEmailConfigured,
} from "@/lib/infrastructure";
import { getPersistedCandidateProfile, ensureCandidateProfileRecord } from "@/lib/profile-store";
import { fetchRadarJobs } from "@/lib/radar-store";
import type { TrackedJob } from "@/lib/radar-types";

const DIGEST_ROUTE = "/api/cron/daily-digest";
const DIGEST_TIMEZONE = "Europe/Berlin";

export type DailyDigestItem = {
  id: string;
  title: string;
  company: string;
  location: string;
  score: number;
  verdict: string;
  status: string;
  intakeMode: string;
  summary: string;
  sourceUrl?: string;
  reason: string;
};

export type DailyDigestPreview = {
  digestDate: string;
  subject: string;
  summary: string;
  intro: string;
  items: DailyDigestItem[];
  topPriorityCount: number;
  actionQueueCount: number;
  emailConfigured: boolean;
  cronConfigured: boolean;
  profileSource: "database" | "default";
  blockedReason?: string;
  html: string;
  text: string;
};

function getDigestDate(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function formatDigestDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeZone: DIGEST_TIMEZONE,
  }).format(now);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function pickReason(job: TrackedJob) {
  const highlights: string[] = [];

  if (job.skills.length > 0) {
    highlights.push(`stack ${job.skills.slice(0, 3).join(", ")}`);
  }

  if (job.score >= 78) {
    highlights.push("match forte");
  } else if (job.score >= 62) {
    highlights.push("boa aderencia");
  }

  if (job.location && !/not specified/i.test(job.location)) {
    highlights.push(job.location);
  }

  if (job.status !== "Nova") {
    highlights.push(`status ${job.status.toLowerCase()}`);
  }

  return highlights.slice(0, 3).join(" · ") || "vaga recente com potencial relevante";
}

function mapDigestItem(job: TrackedJob): DailyDigestItem {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    score: job.score,
    verdict: job.verdict,
    status: job.status,
    intakeMode: job.intakeMode,
    summary: job.summary,
    sourceUrl: job.sourceUrl,
    reason: pickReason(job),
  };
}

function buildTextDigest(preview: Omit<DailyDigestPreview, "html" | "text">) {
  const lines = [
    preview.subject,
    "",
    preview.intro,
    "",
    preview.summary,
    "",
    ...preview.items.map(
      (item, index) =>
        `${index + 1}. ${item.title} @ ${item.company} | ${item.score}% | ${item.location}\n   ${item.reason}${item.sourceUrl ? `\n   ${item.sourceUrl}` : ""}`,
    ),
  ];

  return lines.join("\n");
}

function buildHtmlDigest(preview: Omit<DailyDigestPreview, "html" | "text">) {
  const itemsHtml = preview.items
    .map(
      (item) => `
        <tr>
          <td style="padding:16px;border-top:1px solid #e2e8f0;">
            <div style="font:600 16px/1.5 system-ui,sans-serif;color:#0f172a;">${escapeHtml(item.title)}</div>
            <div style="font:500 13px/1.6 system-ui,sans-serif;color:#475569;">${escapeHtml(item.company)} · ${escapeHtml(item.location)}</div>
            <div style="margin-top:6px;font:500 12px/1.6 system-ui,sans-serif;color:#0f172a;">${escapeHtml(item.reason)}</div>
            ${
              item.sourceUrl
                ? `<div style="margin-top:8px;"><a href="${escapeHtml(item.sourceUrl)}" style="font:600 12px/1.6 system-ui,sans-serif;color:#0369a1;text-decoration:none;">Open job link</a></div>`
                : ""
            }
          </td>
          <td style="padding:16px;border-top:1px solid #e2e8f0;text-align:right;vertical-align:top;">
            <div style="display:inline-block;border-radius:999px;background:#e0f2fe;padding:6px 10px;font:700 12px/1 system-ui,sans-serif;color:#0f172a;">${item.score}%</div>
            <div style="margin-top:8px;font:600 12px/1.6 system-ui,sans-serif;color:#475569;">${escapeHtml(item.verdict)}</div>
            <div style="font:500 12px/1.6 system-ui,sans-serif;color:#64748b;">${escapeHtml(item.status)}</div>
          </td>
        </tr>`,
    )
    .join("");

  return `
    <div style="background:#f8fafc;padding:32px 20px;">
      <div style="max-width:720px;margin:0 auto;border-radius:28px;background:#ffffff;border:1px solid #e2e8f0;overflow:hidden;">
        <div style="padding:28px 28px 18px;background:linear-gradient(135deg,#082f49,#1d4ed8);color:#ffffff;">
          <div style="font:600 11px/1 system-ui,sans-serif;letter-spacing:0.24em;text-transform:uppercase;color:#bae6fd;">Argus daily digest</div>
          <h1 style="margin:14px 0 10px;font:700 28px/1.2 system-ui,sans-serif;">${escapeHtml(preview.subject)}</h1>
          <p style="margin:0;font:400 14px/1.8 system-ui,sans-serif;color:#dbeafe;">${escapeHtml(preview.intro)}</p>
        </div>
        <div style="padding:24px 28px 8px;">
          <p style="margin:0 0 18px;font:500 14px/1.8 system-ui,sans-serif;color:#334155;">${escapeHtml(preview.summary)}</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            ${itemsHtml || '<tr><td style="padding:16px;border-top:1px solid #e2e8f0;font:500 14px/1.8 system-ui,sans-serif;color:#64748b;">No prioritized jobs yet.</td></tr>'}
          </table>
        </div>
      </div>
    </div>
  `;
}

export async function buildDailyDigestPreview(
  now = new Date(),
): Promise<DailyDigestPreview> {
  const digestDate = getDigestDate(now);
  const { profile, source } = await getPersistedCandidateProfile();
  const emailConfigured = isDigestEmailConfigured();
  const cronConfigured = hasVercelCronPath(DIGEST_ROUTE);
  const jobsResult = await (async () => {
    try {
      return await fetchRadarJobs();
    } catch (error) {
      return {
        available: false,
        reason:
          error instanceof Error
            ? error.message
            : "Falha ao acessar o banco durante a montagem do digest",
        jobs: [] as TrackedJob[],
      };
    }
  })();

  if (!jobsResult.available) {
    const subject = `Argus morning radar · ${formatDigestDate(now)}`;
    const basePreview = {
      digestDate: digestDate.toISOString(),
      subject,
      summary: "O motor de digest ja existe, mas ainda precisa de banco conectado para gerar a lista diaria real.",
      intro: `Bom dia, ${profile.name}. Assim que o Postgres estiver conectado, o digest passa a sair com vagas priorizadas automaticamente.`,
      items: [] as DailyDigestItem[],
      topPriorityCount: 0,
      actionQueueCount: 0,
      emailConfigured,
      cronConfigured,
      profileSource: source,
      blockedReason: jobsResult.reason ?? "Banco ainda nao configurado",
    };

    return {
      ...basePreview,
      html: buildHtmlDigest(basePreview),
      text: buildTextDigest(basePreview),
    } satisfies DailyDigestPreview;
  }

  const rankedJobs = [...jobsResult.jobs].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return (
      new Date(right.updatedAt ?? right.createdAt ?? 0).getTime() -
      new Date(left.updatedAt ?? left.createdAt ?? 0).getTime()
    );
  });
  const prioritizedJobs = rankedJobs.filter((job) => job.status !== "Aplicada");
  const digestItems = prioritizedJobs.slice(0, 8).map(mapDigestItem);
  const topPriorityCount = prioritizedJobs.filter((job) => job.score >= 78).length;
  const actionQueueCount = prioritizedJobs.filter((job) =>
    ["Pronta para revisar", "Aplicar", "Entrevista"].includes(job.status),
  ).length;
  const subject = `Argus morning radar · ${formatDigestDate(now)} · ${digestItems.length} vagas em foco`;
  const intro = `Bom dia, ${profile.name}. O radar consolidou as vagas mais aderentes para voce abrir o dia com contexto e proxima acao clara.`;
  const summary = `${topPriorityCount} vaga(s) estao em alta prioridade, ${actionQueueCount} pedem acao rapida e o explorer foi reduzido para ${digestItems.length} itens realmente dignos de foco.`;
  const basePreview = {
    digestDate: digestDate.toISOString(),
    subject,
    summary,
    intro,
    items: digestItems,
    topPriorityCount,
    actionQueueCount,
    emailConfigured,
    cronConfigured,
    profileSource: source,
  };

  return {
    ...basePreview,
    html: buildHtmlDigest(basePreview),
    text: buildTextDigest(basePreview),
  } satisfies DailyDigestPreview;
}

export async function persistDailyDigest(preview: DailyDigestPreview) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const profile = await ensureCandidateProfileRecord();

  return db.dailyDigest.upsert({
    where: {
      candidateProfileId_digestDate: {
        candidateProfileId: profile.id,
        digestDate: new Date(preview.digestDate),
      },
    },
    update: {
      subject: preview.subject,
      summary: preview.summary,
      items: preview.items,
    },
    create: {
      candidateProfileId: profile.id,
      digestDate: new Date(preview.digestDate),
      subject: preview.subject,
      summary: preview.summary,
      items: preview.items,
    },
  });
}

export async function sendDailyDigestEmail(preview: DailyDigestPreview) {
  if (!isDigestEmailConfigured()) {
    throw new Error("Email digest ainda nao configurado");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.ARGUS_DIGEST_FROM_EMAIL,
      to: [process.env.ARGUS_DIGEST_TO_EMAIL],
      subject: preview.subject,
      html: preview.html,
      text: preview.text,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Falha ao enviar digest por email: ${errorBody}`);
  }

  const payload = (await response.json()) as {
    id?: string;
    data?: { id?: string };
  };

  if (isDatabaseConfigured()) {
    const profile = await ensureCandidateProfileRecord();

    await db.dailyDigest.updateMany({
      where: {
        candidateProfileId: profile.id,
        digestDate: new Date(preview.digestDate),
      },
      data: {
        sentAt: new Date(),
      },
    });
  }

  return payload.data?.id ?? payload.id ?? "sent";
}

export async function runDailyDigestCycle(options?: {
  persist?: boolean;
  sendEmail?: boolean;
}) {
  const preview = await buildDailyDigestPreview();

  if (options?.persist ?? true) {
    await persistDailyDigest(preview);
  }

  let emailId: string | null = null;

  if (options?.sendEmail ?? true) {
    emailId = await sendDailyDigestEmail(preview);
  }

  return {
    preview,
    emailId,
  };
}
