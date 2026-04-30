import type { BoardLoadRow, BoardResponse, BoardSection } from "@/lib/board-types";
import { toNumber } from "@/lib/ui/parse";

export interface ViewBoardLoadRow {
  id: string;
  ref: string;
  status: string;
  shipper: string;
  receiver: string;
  lineHaul: number | null;
  loadedMi: number | null;
  puDh: number | null;
  delDh: number | null;
  totalMi: number | null;
  negMi: number | null;
  loadedRpm: number | null;
  floorRpm: number | null;
  routeId: string | null;
  loadNumber: string | null;
  pickupNumber: string | null;
  pickupCityState: string | null;
  pickupWindow: string | null;
  deliveryCityState: string | null;
  deliveryWindow: string | null;
  dropLotName: string | null;
}

export interface ViewBoardSection {
  id: string;
  type: BoardSection["type"];
  title: string;
  filledCount: number;
  capacity: number | null;
  city: string | null;
  state: string | null;
  slipSeat: boolean;
  dropHookRequired: boolean;
  loads: ViewBoardLoadRow[];
}

export interface ViewBoardResponse {
  regionId: string;
  date: string;
  sections: ViewBoardSection[];
  totals: {
    loads: number;
    lineHaul: number | null;
    loadedMiles: number | null;
    emptyPctRatio: number | null;
    floorRpm: number | null;
  };
}

export function mapBoardRowToView(row: BoardLoadRow): ViewBoardLoadRow {
  return {
    id: row.id,
    ref: row.threePlRefNumber ?? "—",
    status: row.status,
    shipper: row.shipperName ?? "—",
    receiver: row.receiverName ?? "—",
    lineHaul: toNumber(row.lineHaulRate),
    loadedMi: toNumber(row.loadedMiles),
    puDh: toNumber(row.puDeadheadMiles),
    delDh: toNumber(row.delDeadheadMiles),
    totalMi: toNumber(row.totalTripMiles),
    negMi: toNumber(row.negotiableMiles),
    loadedRpm: toNumber(row.loadedRpm),
    floorRpm: toNumber(row.negotiationFloorRpm),
    routeId: row.routeId,
    loadNumber: row.loadNumber,
    pickupNumber: row.pickupNumber,
    pickupCityState: row.pickupCityState,
    pickupWindow: row.pickupWindow,
    deliveryCityState: row.deliveryCityState,
    deliveryWindow: row.deliveryWindow,
    dropLotName: row.dropLotName
  };
}

function sectionIdFrom(section: BoardSection, index: number): string {
  if (section.dropLot?.id) {
    return section.dropLot.id;
  }
  return `${section.type}-${index}`;
}

export function mapBoardResponseToView(response: BoardResponse): ViewBoardResponse {
  return {
    regionId: response.regionId,
    date: response.date,
    sections: response.sections.map((section, index) => ({
      id: sectionIdFrom(section, index),
      type: section.type,
      title: section.title,
      filledCount: section.filledCount,
      capacity: section.dropLot?.dailyCapacity ?? null,
      city: section.dropLot?.city ?? null,
      state: section.dropLot?.state ?? null,
      slipSeat: section.dropLot?.slipSeat ?? false,
      dropHookRequired: section.dropLot?.dropHookRequired ?? false,
      loads: section.loads.map(mapBoardRowToView)
    })),
    totals: {
      loads: response.dayTotals.loadCount,
      lineHaul: toNumber(response.dayTotals.lineHaulTotal),
      loadedMiles: toNumber(response.dayTotals.loadedMilesTotal),
      emptyPctRatio: toNumber(response.dayTotals.emptyMilePct),
      floorRpm: toNumber(response.dayTotals.negFloorRpm)
    }
  };
}
