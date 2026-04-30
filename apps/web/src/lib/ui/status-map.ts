export type UiStatusTone =
  | "booked"
  | "dispatched"
  | "picked-up"
  | "delivered"
  | "pod"
  | "completed"
  | "canceled"
  | "failed"
  | "unknown";

export interface StatusPresentation {
  label: string;
  tone: UiStatusTone;
}

const STATUS_MAP: Record<string, StatusPresentation> = {
  BOOKED: { label: "BOOKED", tone: "booked" },
  DISPATCHED: { label: "DISPATCHED", tone: "dispatched" },
  PICKED_UP: { label: "PICKED UP", tone: "picked-up" },
  DELIVERED: { label: "DELIVERED", tone: "delivered" },
  POD_RECEIVED: { label: "POD RECEIVED", tone: "pod" },
  COMPLETED: { label: "COMPLETED", tone: "completed" },
  CANCELED: { label: "CANCELED", tone: "canceled" },
  FAILED: { label: "FAILED", tone: "failed" },
  TONU: { label: "TONU", tone: "canceled" }
};

export function mapStatusPresentation(status: string | null | undefined): StatusPresentation {
  if (!status) {
    return { label: "UNKNOWN", tone: "unknown" };
  }
  return STATUS_MAP[status] ?? { label: status.replaceAll("_", " "), tone: "unknown" };
}
