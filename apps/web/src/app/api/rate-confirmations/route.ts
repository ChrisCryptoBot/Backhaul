import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { computeContentHash, finalizeUpload } from "@/server/ingestion";
import { enqueueJob } from "@/server/queue";
import { getEnv } from "@/lib/env";
import { weekIsoFromPickup } from "@/lib/week";
import { requireRegionAccess } from "@/lib/access";
import { runInRegionScope } from "@/lib/db";
import { PolicyViolationError } from "@/lib/policy-error";
import { IdempotencyConflictError } from "@/lib/idempotency-error";

const uploadPayloadSchema = z.object({
  regionId: z.string().min(1),
  pickupDate: z.coerce.date(),
  sourceFileUrl: z.string().url(),
  fileContentBase64: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { S3_BUCKET_NAME, AWS_REGION } = getEnv();
    const payload = uploadPayloadSchema.parse(await request.json());
    const sourceUrl = new URL(payload.sourceFileUrl);
    const validHosts = new Set([
      `${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`,
      `${S3_BUCKET_NAME}.s3.amazonaws.com`
    ]);
    if (!validHosts.has(sourceUrl.hostname)) {
      return NextResponse.json({ error: "sourceFileUrl must point to configured S3 bucket host" }, { status: 400 });
    }

    await requireRegionAccess(userId, payload.regionId);

    const idempotencyKey = request.headers.get("Idempotency-Key") ?? undefined;
    const contentHash = computeContentHash(Buffer.from(payload.fileContentBase64, "base64"));
    const weekIso = weekIsoFromPickup(payload.pickupDate);

    const result = await runInRegionScope(payload.regionId, async (tx) =>
      finalizeUpload({
        regionId: payload.regionId,
        weekIso,
        sourceFileUrl: payload.sourceFileUrl,
        sourceFileHash: contentHash,
        idempotencyKey,
        db: tx,
        enqueueParseJob: false
      })
    );

    await enqueueJob(getEnv().SQS_PARSE_QUEUE_URL, {
      regionId: payload.regionId,
      weekIso,
      entityId: result.rateConfirmationId,
      eventType: "PARSE_RATE_CON"
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request payload", details: error.issues }, { status: 400 });
    }
    if (error instanceof PolicyViolationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof IdempotencyConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
