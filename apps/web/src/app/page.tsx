import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { requireRegionAccess } from "@/lib/access";
import { resolvePhase1RegionId } from "@/lib/scope";
import { PolicyViolationError } from "@/lib/policy-error";
import { getBoardResponse } from "@/server/board";
import { isAuthBypassed } from "@/lib/auth-mode";
import { isIsoDay, todayIsoInTimeZone } from "@/lib/board-date";
import { buildFallbackBoard } from "@/lib/board-fallback";
import { mapBoardResponseToView } from "@/lib/ui/board-mappers";
import { BoardShell } from "@/components/board/board-shell";

interface HomePageProps {
  // Next.js 14 passes an object; newer versions may pass a Promise.
  searchParams?:
    | { [key: string]: string | string[] | undefined }
    | Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? process.env.CLERK_PUBLISHABLE_KEY;
  const bypassAuth = isAuthBypassed();
  const allowMissingClerk = bypassAuth || process.env.NODE_ENV === "test";
  if (!publishableKey && !allowMissingClerk) {
    return (
      <main>
        <h1>Daily Load Board</h1>
        <p>Authentication is not configured in this environment.</p>
        <p>Set Clerk publishable key env vars to enable sign-in and board access.</p>
      </main>
    );
  }

  const { userId } = await auth();
  if (!bypassAuth && !userId) {
    redirect("/sign-in");
  }
  const actorUserId = userId ?? "dev-bypass-user";

  let regionId = "";
  try {
    regionId = await resolvePhase1RegionId();
    if (!bypassAuth) {
      await requireRegionAccess(actorUserId, regionId);
    }
  } catch (error) {
    if (bypassAuth) {
      regionId = "dev-region";
    } else if (error instanceof PolicyViolationError) {
      return (
        <main>
          <h1>Daily Load Board</h1>
          <p>Forbidden</p>
        </main>
      );
    } else {
      return (
        <main>
          <h1>Daily Load Board</h1>
          <p>Unable to load board data right now.</p>
        </main>
      );
    }
  }
  const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : searchParams;
  const queryDate = resolvedSearchParams?.date;
  const dateCandidate = Array.isArray(queryDate) ? queryDate[0] : queryDate;
  const date = isIsoDay(dateCandidate) ? dateCandidate : todayIsoInTimeZone();

  let boardResponse;
  let boardError: string | null = null;
  try {
    boardResponse = await getBoardResponse({ regionId, date });
  } catch {
    if (bypassAuth) {
      boardResponse = buildFallbackBoard({ regionId, date });
      boardError = "Development mode: board data source unavailable, showing fallback UI.";
    } else {
      boardResponse = null;
      boardError = "Unable to load board data right now.";
    }
  }

  if (!boardResponse) {
    return (
      <main>
        <h1>Daily Load Board</h1>
        <p>{boardError}</p>
      </main>
    );
  }

  const board = mapBoardResponseToView(boardResponse);
  return <BoardShell board={board} boardError={boardError} />;
}
