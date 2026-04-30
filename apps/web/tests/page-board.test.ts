import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PolicyViolationError } from "@/lib/policy-error";

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

  test("renders board shell with board data", async () => {
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
          dropLot: {
            id: "lot-a",
            name: "LOT A",
            city: "Warrendale",
            state: "PA",
            sortOrder: 1,
            dailyCapacity: 5,
            slipSeat: true,
            dropHookRequired: true
          },
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
    expect(markup).toContain("DROP BUCKET");
    expect(markup).toContain("Daily Board");
    expect(markup).toContain("LOT A");
    expect(markup).toContain("REF-1");
  });

  test("renders fallback section labels", async () => {
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
    expect(markup).toContain("Ad-hoc lanes");
    expect(markup).toContain("CANCELED / TONU");
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
    expect(markup).toContain("No loads in this section.");
    expect(markup).toContain("Ad-hoc lanes");
    expect(markup).toContain("CANCELED / TONU");
  });

  test("renders error state when board load fails", async () => {
    getBoardResponse.mockRejectedValue(new Error("db unavailable"));
    const HomePage = (await import("@/app/page")).default;
    const markup = renderToStaticMarkup(await HomePage({ searchParams: { date: "2026-04-29" } }));
    expect(markup).toContain("Unable to load board data right now.");
  });

  test("uses ET calendar day when date query is invalid", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-29T02:00:00.000Z"));
    getBoardResponse.mockResolvedValue({
      regionId: "region-1",
      date: "2026-04-28",
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
    await HomePage({ searchParams: { date: "invalid" } });
    expect(getBoardResponse).toHaveBeenCalledWith({
      regionId: "region-1",
      date: "2026-04-28"
    });
    vi.useRealTimers();
  });

  test("supports promise-shaped searchParams", async () => {
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
    await HomePage({ searchParams: Promise.resolve({ date: "2026-04-29" }) });
    expect(getBoardResponse).toHaveBeenCalledWith({
      regionId: "region-1",
      date: "2026-04-29"
    });
  });

  test("renders forbidden state for region policy denials", async () => {
    requireRegionAccess.mockRejectedValue(new PolicyViolationError("Forbidden for region"));
    const HomePage = (await import("@/app/page")).default;
    const markup = renderToStaticMarkup(await HomePage({ searchParams: { date: "2026-04-29" } }));
    expect(markup).toContain("Forbidden");
  });
});
