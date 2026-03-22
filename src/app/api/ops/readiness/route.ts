import { NextResponse } from "next/server";
import { getOperationalReadiness } from "@/lib/ops-readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const readiness = await getOperationalReadiness();
    return NextResponse.json(readiness);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao montar readiness operacional",
      },
      { status: 500 },
    );
  }
}
