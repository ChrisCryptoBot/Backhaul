import { toNumber } from "@/lib/ui/parse";

export interface KpiCardDto {
  key: string;
  label: string;
  value: string | number;
  delta: string | number | null;
  deltaLabel: string;
  inverted?: boolean;
  noPrior?: boolean;
}

export interface KpiLaneRowDto {
  lane: string;
  target: string | number | null;
  loads: number;
  revenue: string | number | null;
  floorRpm: string | number | null;
  vsTarget: string | number | null;
  emptyPct: string | number | null;
  fsc: string | number | null;
  revLoad: string | number | null;
  status: "ON_TARGET" | "BELOW_NEAR" | "BELOW" | "NO_LOADS";
}

export interface KpiTrendPointDto {
  week: string;
  loads: number;
  rev: string | number;
  empty: string | number;
}

export interface KpiDashboardResponse {
  weekIso: string;
  comparisonWeekIso: string | null;
  cards: KpiCardDto[];
  lanes: KpiLaneRowDto[];
  trend: KpiTrendPointDto[];
  managementNotes: string[];
  rules: Array<{
    code: string;
    title: string;
    severity: "INFO" | "WARN" | "BLOCK";
    statement: string;
    appliesTo: string;
  }>;
}

export interface ViewKpiDashboard {
  weekIso: string;
  comparisonWeekIso: string | null;
  cards: Array<{
    key: string;
    label: string;
    value: string | number;
    delta: number | null;
    deltaLabel: string;
    inverted: boolean;
    noPrior: boolean;
  }>;
  lanes: Array<{
    lane: string;
    target: number | null;
    loads: number;
    revenue: number | null;
    floorRpm: number | null;
    vsTarget: number | null;
    emptyPct: number | null;
    fsc: number | null;
    revLoad: number | null;
    status: "ON_TARGET" | "BELOW_NEAR" | "BELOW" | "NO_LOADS";
  }>;
  trend: Array<{
    week: string;
    loads: number;
    rev: number | null;
    empty: number | null;
  }>;
  managementNotes: string[];
  rules: KpiDashboardResponse["rules"];
}

export function mapKpiDashboardToView(input: KpiDashboardResponse): ViewKpiDashboard {
  return {
    weekIso: input.weekIso,
    comparisonWeekIso: input.comparisonWeekIso,
    cards: input.cards.map((card) => ({
      key: card.key,
      label: card.label,
      value: card.value,
      delta: toNumber(card.delta),
      deltaLabel: card.deltaLabel,
      inverted: Boolean(card.inverted),
      noPrior: Boolean(card.noPrior)
    })),
    lanes: input.lanes.map((lane) => ({
      lane: lane.lane,
      target: toNumber(lane.target),
      loads: lane.loads,
      revenue: toNumber(lane.revenue),
      floorRpm: toNumber(lane.floorRpm),
      vsTarget: toNumber(lane.vsTarget),
      emptyPct: toNumber(lane.emptyPct),
      fsc: toNumber(lane.fsc),
      revLoad: toNumber(lane.revLoad),
      status: lane.status
    })),
    trend: input.trend.map((point) => ({
      week: point.week,
      loads: point.loads,
      rev: toNumber(point.rev),
      empty: toNumber(point.empty)
    })),
    managementNotes: input.managementNotes,
    rules: input.rules
  };
}
