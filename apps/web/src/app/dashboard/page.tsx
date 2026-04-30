import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAuthBypassed } from "@/lib/auth-mode";
import { requireRegionAccess } from "@/lib/access";
import { resolvePhase1RegionId } from "@/lib/scope";
import { PolicyViolationError } from "@/lib/policy-error";
import { getKpiDashboard } from "@/server/kpi-dashboard";
import { weekIsoFromPickup } from "@/lib/week";
import { KpiDashboard } from "@/components/kpi/kpi-dashboard";

function currentWeekIso(): string {
  return weekIsoFromPickup(new Date());
}

interface DashboardPageProps {
  searchParams?: { weekIso?: string | string[] };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
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
        <main>
          <h1>KPI Dashboard</h1>
          <p>Forbidden</p>
        </main>
      );
    }
  }

  const weekIsoParam = searchParams?.weekIso;
  const weekIso = typeof weekIsoParam === "string" ? weekIsoParam : currentWeekIso();
  let data;
  try {
    data = await getKpiDashboard({ regionId, weekIso });
  } catch {
    return (
      <main>
        <h1>KPI Dashboard</h1>
        <p>Unable to load dashboard data right now.</p>
      </main>
    );
  }
  return <KpiDashboard initialData={data} />;
}
