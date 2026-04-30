/**
 * Daily board response contract for the MVP read-only load board.
 * Unsupported columns remain deferred until their source data is modeled.
 */
export interface BoardResponse {
  regionId: string;
  date: string;
  sections: BoardSection[];
  dayTotals: BoardDayTotals;
}

export interface BoardDayTotals {
  loadCount: number;
  lineHaulTotal: string;
  loadedMilesTotal: string;
  emptyMilePct: string | null;
  negFloorRpm: string | null;
}

export interface BoardSection {
  type: "drop_lot" | "adhoc" | "canceled";
  title: string;
  filledCount: number;
  dropLot: BoardDropLotMeta | null;
  loads: BoardLoadRow[];
}

export interface BoardDropLotMeta {
  id: string;
  name: string;
  city: string;
  state: string;
  sortOrder: number;
  dailyCapacity: number | null;
  slipSeat: boolean;
  dropHookRequired: boolean;
}

/**
 * MVP row subset in blueprint order. Derived fields not yet modeled are deferred.
 */
export interface BoardLoadRow {
  id: string;
  threePlRefNumber: string | null;
  status: string;
  routeId: string | null;
  loadNumber: string | null;
  pickupNumber: string | null;
  shipperName: string | null;
  pickupCityState: string | null;
  pickupWindow: string | null;
  receiverName: string | null;
  deliveryCityState: string | null;
  deliveryWindow: string | null;
  lineHaulRate: string;
  loadedMiles: string;
  puDeadheadMiles: string;
  delDeadheadMiles: string;
  totalTripMiles: string | null;
  negotiableMiles: string | null;
  loadedRpm: string | null;
  negotiationFloorRpm: string | null;
  dropLotName: string | null;
}
