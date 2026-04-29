import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRegionAccess } from "@/lib/access";
import { resolvePhase1RegionId } from "@/lib/scope";
import { PolicyViolationError } from "@/lib/policy-error";
import { getBoardResponse } from "@/server/board";

const boardQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = boardQuerySchema.parse({
      date: searchParams.get("date")
    });

    const phase1RegionId = await resolvePhase1RegionId();
    await requireRegionAccess(userId, phase1RegionId);

    const board = await getBoardResponse({
      regionId: phase1RegionId,
      date: query.date
    });

    return NextResponse.json(board, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid query params", details: error.issues }, { status: 400 });
    }
    if (error instanceof PolicyViolationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
