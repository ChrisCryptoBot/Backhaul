import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAuthBypassed } from "@/lib/auth-mode";
import { requireRegionAccess } from "@/lib/access";
import { resolvePhase1RegionId } from "@/lib/scope";
import { PolicyViolationError } from "@/lib/policy-error";
import { getRateConfirmationForReview } from "@/server/review";
import { ReviewPanel } from "./review-panel";

interface ReviewPageProps {
  searchParams?: {
    rateConfirmationId?: string;
  };
}

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const bypassAuth = isAuthBypassed();
  const { userId } = await auth();
  if (!bypassAuth && !userId) {
    redirect("/sign-in");
  }
  const actorUserId = userId ?? "dev-bypass-user";

  let regionId = "dev-region";
  try {
    regionId = await resolvePhase1RegionId();
    if (!bypassAuth) {
      await requireRegionAccess(actorUserId, regionId);
    }
  } catch (error) {
    if (!bypassAuth && error instanceof PolicyViolationError) {
      return (
        <main style={{ padding: "24px" }}>
          <h1>Review Queue</h1>
          <p>Forbidden</p>
        </main>
      );
    }
  }

  const rateConfirmationId = searchParams?.rateConfirmationId ?? null;
  if (!rateConfirmationId) {
    return (
      <main style={{ padding: "24px" }}>
        <h1>Review Queue</h1>
        <p>Select a ready item from the board footer to begin review.</p>
      </main>
    );
  }

  const payload = await getRateConfirmationForReview({
    regionId,
    rateConfirmationId
  });
  if (!payload) {
    return (
      <main style={{ padding: "24px" }}>
        <h1>Review Queue</h1>
        <p>Rate confirmation not found.</p>
      </main>
    );
  }

  return <ReviewPanel initial={payload} />;
}
