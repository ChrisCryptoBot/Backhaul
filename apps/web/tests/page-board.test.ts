import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const auth = vi.fn();
const requireRegionAccess = vi.fn();
const resolvePhase1RegionId = vi.fn();
const getBoardResponse = vi.fn();
const redirect = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth
}));

vi.mock("@/lib/access", () => ({
  requireRegionAccess
}));

vi.mock("@/lib/scope", () => ({
  resolvePhase1RegionId
}));

vi.mock("@/server/board", () => ({
  getBoardResponse
}));

vi.mock("next/navigation", () => ({
  redirect
}));

describe("board page shell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ userId: "user-1" });
    resolvePhase1RegionId.mockResolvedValue("region-1");
    requireRegionAccess.mockResolvedValue({ userId: "user-1", regionId: "region-1", role: "COORDINATOR" });
  });

  test("renders sections in expected order", async () => {
    getBoardResponse.mockResolvedValue({
      regionId: "region-1",
      date: "2026-04-29",
      dayTotals: {
        loadCount: 1,
        lineHaulTotal: "1000",
        loadedMilesTotal: "200",
        emptyMilePct: "0.1",
        negFloorRpm: "4"
      },
      sections: [
        {
          type: "drop_lot",
          title: "LOT A",
          filledCount: 1,
          dropLot: null,
          loads: [
            {
              id: "load-1",
              threePlRefNumber: "REF-1",
              status: "BOOKED",
              routeId: null,
              loadNumber: null,
              pickupNumber: null,
              shipperName: null,
              pickupCityState: null,
              pickupWindow: null,
              receiverName: null,
              deliveryCityState: null,
              deliveryWindow: null,
              lineHaulRate: "1000",
              loadedMiles: "200",
              puDeadheadMiles: "10",
              delDeadheadMiles: "20",
              totalTripMiles: "230",
              negotiableMiles: "210",
              loadedRpm: "5",
              negotiationFloorRpm: "4.76",
              dropLotName: "LOT A"
            }
          ]
        },
        { type: "adhoc", title: "Ad-hoc lanes", filledCount: 0, dropLot: null, loads: [] },
        { type: "canceled", title: "CANCELED / TONU", filledCount: 0, dropLot: null, loads: [] }
      ]
    });

    const HomePage = (await import("@/app/page")).default;
    const markup = renderToStaticMarkup(await HomePage({ searchParams: { date: "2026-04-29" } }));
    expect(markup.indexOf("LOT A")).toBeLessThan(markup.indexOf("Ad-hoc lanes"));
    expect(markup.indexOf("Ad-hoc lanes")).toBeLessThan(markup.indexOf("CANCELED / TONU"));
  });

  test("renders MVP column order list", async () => {
    getBoardResponse.mockResolvedValue({
      regionId: "region-1",
      date: "2026-04-29",
      dayTotals: {
        loadCount: 0,
        lineHaulTotal: "0",
        loadedMilesTotal: "0",
        emptyMilePct: null,
        negFloorRpm: null
      },
      sections: []
    });

    const HomePage = (await import("@/app/page")).default;
    const markup = renderToStaticMarkup(await HomePage({ searchParams: { date: "2026-04-29" } }));
    expect(markup.indexOf("DROP LOTS")).toBeLessThan(markup.indexOf("(3PL) REF #"));
  });

  test("renders empty state when no section has loads", async () => {
    getBoardResponse.mockResolvedValue({
      regionId: "region-1",
      date: "2026-04-29",
      dayTotals: {
        loadCount: 0,
        lineHaulTotal: "0",
        loadedMilesTotal: "0",
        emptyMilePct: null,
        negFloorRpm: null
      },
      sections: [
        { type: "adhoc", title: "Ad-hoc lanes", filledCount: 0, dropLot: null, loads: [] },
        { type: "canceled", title: "CANCELED / TONU", filledCount: 0, dropLot: null, loads: [] }
      ]
    });

    const HomePage = (await import("@/app/page")).default;
    const markup = renderToStaticMarkup(await HomePage({ searchParams: { date: "2026-04-29" } }));
    expect(markup).toContain("No loads booked for this date.");
  });

  test("renders error state when board load fails", async () => {
    getBoardResponse.mockRejectedValue(new Error("db unavailable"));
    const HomePage = (await import("@/app/page")).default;
    const markup = renderToStaticMarkup(await HomePage({ searchParams: { date: "2026-04-29" } }));
    expect(markup).toContain("Unable to load board data right now.");
  });
});
