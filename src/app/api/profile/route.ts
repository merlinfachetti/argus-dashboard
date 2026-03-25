import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/infrastructure";
import { getPersistedCandidateProfile, updateCandidateDocuments, updateCandidateProfile } from "@/lib/profile-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const profileState = await getPersistedCandidateProfile();

    return NextResponse.json({
      available: isDatabaseConfigured(),
      source: profileState.source,
      profile: profileState.profile,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao carregar perfil persistido",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        {
          error: "Banco ainda nao configurado para salvar CV e cover letter no servidor",
        },
        { status: 503 },
      );
    }

    const payload = (await request.json()) as {
      cvText?: unknown;
      coverLetterText?: unknown;
      name?: unknown;
      headline?: unknown;
      location?: unknown;
      availability?: unknown;
      summary?: unknown;
      languages?: unknown;
      coreStack?: unknown;
      targetRoles?: unknown;
    };
    // Se vêm campos de identidade → update completo do perfil
    const hasFullFields = payload.name !== undefined || payload.coreStack !== undefined || payload.targetRoles !== undefined;
    if (hasFullFields) {
      const updated = await updateCandidateProfile({
        ...(typeof payload.name === "string" && { name: payload.name }),
        ...(typeof payload.headline === "string" && { headline: payload.headline }),
        ...(typeof payload.location === "string" && { location: payload.location }),
        ...(typeof payload.availability === "string" && { availability: payload.availability }),
        ...(typeof payload.summary === "string" && { summary: payload.summary }),
        ...(Array.isArray(payload.languages) && { languages: payload.languages as string[] }),
        ...(Array.isArray(payload.coreStack) && { coreStack: payload.coreStack as string[] }),
        ...(Array.isArray(payload.targetRoles) && { targetRoles: payload.targetRoles as string[] }),
        ...(typeof payload.cvText === "string" && { cvText: payload.cvText }),
        ...(typeof payload.coverLetterText === "string" && { coverLetterText: payload.coverLetterText }),
      });
      return NextResponse.json({ profile: updated });
    }

    const cvText = typeof payload.cvText === "string" ? payload.cvText.trim() : "";
    const coverLetterText =
      typeof payload.coverLetterText === "string"
        ? payload.coverLetterText.trim()
        : "";

    if (!cvText || !coverLetterText) {
      return NextResponse.json(
        {
          error: "CV e cover letter precisam estar preenchidos para sync server-side",
        },
        { status: 400 },
      );
    }

    const profile = await updateCandidateDocuments({
      cvText,
      coverLetterText,
    });

    return NextResponse.json({
      available: true,
      source: "database",
      profile,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao salvar perfil no banco",
      },
      { status: 500 },
    );
  }
}
