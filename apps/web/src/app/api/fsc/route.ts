import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { upsertFscIndex } from "@/server/fsc";
import { mapWireToDbFscSource, parseWireFscSource } from "@/lib/fsc-source";
import { requireRegionAccess } from "@/lib/access";
import { runInRegionScope } from "@/lib/db";
import { PolicyViolationError } from "@/lib/policy-error";
const fscPayloadSchema = z.object({
  regionId: z.string().min(1),
  weekIso: z.string().regex(/^\d{4}-W\d{2}$/),
  value: z
    .string()
    .regex(/^\d+(\.\d{1,4})?$/)
    .refine((raw) => {
      const numeric = Number(raw);
      return Number.isFinite(numeric) && numeric > 0 && numeric <= 5;
    }, "FSC value must be > 0 and <= 5.0000"),
  reason: z.string().min(10),
  source: z.unknown()
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = fscPayloadSchema.parse(await request.json());
    const wireSource = parseWireFscSource(payload.source);
    const source = mapWireToDbFscSource(wireSource);

    const access = await requireRegionAccess(userId, payload.regionId);

    await runInRegionScope(payload.regionId, async (tx) =>
      upsertFscIndex({
        ctx: access,
        regionId: payload.regionId,
        weekIso: payload.weekIso,
        value: new Prisma.Decimal(payload.value),
        reason: payload.reason,
        source,
        db: tx
      })
    );

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request payload", details: error.issues }, { status: 400 });
    }
    if (error instanceof PolicyViolationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
