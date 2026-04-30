import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRegionAccess } from "@/lib/access";
import { resolvePhase1RegionId } from "@/lib/scope";
import { POLICY_FORBIDDEN_MESSAGE, PolicyViolationError } from "@/lib/policy-error";
import { getBoardResponse } from "@/server/board";
import { isAuthBypassed } from "@/lib/auth-mode";
import { buildFallbackBoard } from "@/lib/board-fallback";
import { isIsoDay, todayIsoInTimeZone } from "@/lib/board-date";

const boardQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    const bypassAuth = isAuthBypassed();
    if (!bypassAuth && !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const actorUserId = userId ?? "dev-bypass-user";

    const { searchParams } = new URL(request.url);
    const requestedDate = searchParams.get("date");
    const date = bypassAuth
      ? (isIsoDay(requestedDate) ? requestedDate : todayIsoInTimeZone())
      : boardQuerySchema.parse({ date: requestedDate }).date;

    let phase1RegionId = "dev-region";
    try {
      phase1RegionId = await resolvePhase1RegionId();
      if (!bypassAuth) {
        await requireRegionAccess(actorUserId, phase1RegionId);
      }
    } catch (error) {
      if (!bypassAuth) {
        throw error;
      }
    }

    let board;
    try {
      board = await getBoardResponse({
        regionId: phase1RegionId,
        date
      });
    } catch (error) {
      if (!bypassAuth) {
        throw error;
      }
      board = buildFallbackBoard({ regionId: phase1RegionId, date });
    }

    return NextResponse.json(board, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid query params", details: error.issues }, { status: 400 });
    }
    if (error instanceof PolicyViolationError) {
      return NextResponse.json({ error: POLICY_FORBIDDEN_MESSAGE }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
