import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireRegionAccess } from "@/lib/access";
import { resolvePhase1RegionId } from "@/lib/scope";
import { isAuthBypassed } from "@/lib/auth-mode";
import { POLICY_FORBIDDEN_MESSAGE, PolicyViolationError } from "@/lib/policy-error";
import { ReviewConflictError, ReviewNotFoundError, ReviewValidationError } from "@/lib/review-errors";
import {
  approveRateConfirmationReview,
  getRateConfirmationForReview,
  rejectRateConfirmationReview
} from "@/server/review";

interface Params {
  params: { rateConfirmationId: string };
}

const actionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().optional()
});

async function resolveRegionAndActor() {
  const { userId } = await auth();
  const bypassAuth = isAuthBypassed();
  if (!bypassAuth && !userId) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const actorUserId = userId ?? "dev-bypass-user";
  let regionId = "dev-region";
  try {
    regionId = await resolvePhase1RegionId();
    if (!bypassAuth) {
      await requireRegionAccess(actorUserId, regionId);
    }
  } catch (error) {
    if (!bypassAuth) {
      throw error;
    }
  }
  return { actorUserId, regionId };
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const context = await resolveRegionAndActor();
    if ("error" in context) {
      return context.error;
    }
    const payload = await getRateConfirmationForReview({
      regionId: context.regionId,
      rateConfirmationId: params.rateConfirmationId
    });
    if (!payload) {
      return NextResponse.json({ error: "Rate confirmation not found" }, { status: 404 });
    }
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    if (error instanceof PolicyViolationError) {
      return NextResponse.json({ error: POLICY_FORBIDDEN_MESSAGE }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const context = await resolveRegionAndActor();
    if ("error" in context) {
      return context.error;
    }
    const body = actionSchema.parse(await request.json());
    if (body.action === "approve") {
      const payload = await approveRateConfirmationReview({
        actorId: context.actorUserId,
        regionId: context.regionId,
        rateConfirmationId: params.rateConfirmationId
      });
      return NextResponse.json(payload, { status: payload.alreadyExisted ? 200 : 201 });
    }
    const payload = await rejectRateConfirmationReview({
      actorId: context.actorUserId,
      regionId: context.regionId,
      rateConfirmationId: params.rateConfirmationId,
      reason: body.reason
    });
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request payload", details: error.issues }, { status: 400 });
    }
    if (error instanceof ReviewValidationError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    if (error instanceof ReviewNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ReviewConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof PolicyViolationError) {
      return NextResponse.json({ error: POLICY_FORBIDDEN_MESSAGE }, { status: 403 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Review approval conflict. Try refreshing and retrying." }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
