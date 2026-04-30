import React from "react";
import { beforeEach, afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BoardShell } from "@/components/board/board-shell";
import type { ViewBoardResponse } from "@/lib/ui/board-mappers";

const boardFixture: ViewBoardResponse = {
  regionId: "region-1",
  date: "2026-04-29",
  totals: {
    loads: 1,
    lineHaul: 1000,
    loadedMiles: 200,
    emptyPctRatio: 0.1,
    floorRpm: 4.7
  },
  sections: [
    {
      id: "lot-a",
      type: "drop_lot",
      title: "LOT A",
      filledCount: 1,
      capacity: 5,
      city: "Warrendale",
      state: "PA",
      slipSeat: false,
      dropHookRequired: false,
      loads: [
        {
          id: "load-1",
          ref: "REF-1",
          status: "BOOKED",
          shipper: "Shipper",
          receiver: "Receiver",
          lineHaul: 1000,
          loadedMi: 200,
          puDh: 10,
          delDh: 20,
          totalMi: 230,
          negMi: 210,
          loadedRpm: 5,
          floorRpm: 4.7,
          routeId: "route-1",
          loadNumber: "L1",
          pickupNumber: "P1",
          pickupCityState: "A, PA",
          pickupWindow: "AM",
          deliveryCityState: "B, PA",
          deliveryWindow: "PM",
          dropLotName: "LOT A"
        }
      ]
    }
  ]
};

const detailPayload = {
  id: "load-1",
  status: "BOOKED",
  sectionCode: "LOT-A",
  threePlRefNumber: "REF-1",
  routeId: "route-1",
  loadNumber: "L1",
  pickupNumber: "P1",
  shipperName: "Shipper",
  pickupCityState: "A, PA",
  pickupWindow: "AM",
  receiverName: "Receiver",
  deliveryCityState: "B, PA",
  deliveryWindow: "PM",
  lineHaulRate: "1000",
  loadedMiles: "200",
  puDeadheadMiles: "10",
  delDeadheadMiles: "20",
  totalTripMiles: "230",
  negotiableMiles: "210",
  loadedRpm: "5",
  negotiationFloorRpm: "4.7",
  emptyMilePct: "0.1",
  brokerName: "Broker",
  pickupDriverAssigned: "Driver",
  tractorTrailer1: "TT1",
  tractorTrailer2: "TT2",
  commodity: "General",
  equipmentNeeds: "Van",
  mgStatus: "OK",
  tmwStatus: "OK",
  podStatus: "Pending",
  rateConfirmation: null,
  createdAt: "2026-04-29T00:00:00.000Z",
  updatedAt: "2026-04-29T00:00:00.000Z"
};

describe("board shell keyboard accessibility", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/rate-confirmations/activity")) {
          return new Response(JSON.stringify({ pending: [], ready: [], recent: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        }
        if (url.includes("/api/board/load/")) {
          return new Response(JSON.stringify(detailPayload), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        }
        return new Response("Not found", { status: 404 });
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  test("opens and closes drawer via keyboard from board row", async () => {
    const user = userEvent.setup();
    render(<BoardShell board={boardFixture} />);

    const rowButton = screen.getByRole("button", { name: "Open details for REF-1" });
    rowButton.focus();
    expect(rowButton).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    const dialog = await screen.findByRole("dialog");
    const closeButton = within(dialog).getByRole("button", { name: "Close load details" });
    await waitFor(() => {
      expect(closeButton).toHaveFocus();
    });

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(rowButton).toHaveFocus();
    });
  });
});
