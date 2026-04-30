"use client";

import React from "react";
import { CloseIcon } from "@/components/icons";
import type { ViewLoadDetail } from "@/lib/ui/drawer-mappers";
import { mapLoadDetailToView } from "@/lib/ui/drawer-mappers";
import { money, miles, pct, rpm } from "@/lib/ui/formatters";
import { StatusPill } from "./status-pill";

interface LoadDetailDrawerProps {
  loadId: string | null;
  onClose: () => void;
}

interface ApiErrorPayload {
  error?: string;
}

function Timeline({ timeline }: Pick<ViewLoadDetail, "timeline">) {
  return (
    <div className="db-timeline">
      {timeline.map((step) => (
        <div key={step.key} className={`db-tl-step db-tl-${step.state}`}>
          <div className="db-tl-dot" />
          <div className="db-tl-label">{step.key.replaceAll("_", " ")}</div>
        </div>
      ))}
    </div>
  );
}

export function LoadDetailDrawer({ loadId, onClose }: LoadDetailDrawerProps) {
  const [detail, setDetail] = React.useState<ViewLoadDetail | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const drawerRef = React.useRef<HTMLElement | null>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const restoreFocusRef = React.useRef<HTMLElement | null>(null);
  const previousLoadIdRef = React.useRef<string | null>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    if (!loadId) {
      setDetail(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/board/load/${loadId}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
          throw new Error(payload?.error ?? "Unable to load details.");
        }
        return response.json();
      })
      .then((payload) => {
        if (cancelled) {
          return;
        }
        setDetail(mapLoadDetailToView(payload));
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        setError(err instanceof Error ? err.message : "Unable to load details.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loadId]);

  React.useEffect(() => {
    const wasOpen = previousLoadIdRef.current !== null;
    const isOpen = loadId !== null;

    if (isOpen && !wasOpen) {
      restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const focusFrame = window.requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
      previousLoadIdRef.current = loadId;
      return () => {
        window.cancelAnimationFrame(focusFrame);
      };
    }

    if (!isOpen && wasOpen) {
      const target = restoreFocusRef.current;
      restoreFocusRef.current = null;
      const restoreFrame = window.requestAnimationFrame(() => {
        target?.focus();
      });
      previousLoadIdRef.current = null;
      return () => {
        window.cancelAnimationFrame(restoreFrame);
      };
    }

    previousLoadIdRef.current = loadId;
  }, [loadId]);

  const handleDialogKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const drawer = drawerRef.current;
      if (!drawer) {
        return;
      }

      const focusableElements = Array.from(
        drawer.querySelectorAll<HTMLElement>(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
        )
      ).filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

      if (event.shiftKey) {
        if (!activeElement || activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
        return;
      }

      if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    },
    [onClose]
  );

  if (!loadId) {
    return null;
  }

  return (
    <>
      <button className="db-drawer-backdrop" aria-label="Close drawer backdrop" onClick={onClose} />
      <aside
        ref={drawerRef}
        className="db-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
      >
        <header className="db-drawer-head">
          <div>
            <div className="db-drawer-eyebrow">Load Detail</div>
            <h2 id={titleId} className="db-drawer-title">
              {detail?.ref ?? "Loading..."}
            </h2>
          </div>
          <button ref={closeButtonRef} className="db-btn db-btn-ghost" onClick={onClose} aria-label="Close load details">
            <CloseIcon size={14} />
          </button>
        </header>
        {detail ? (
          <div className="db-drawer-meta">
            <StatusPill status={detail.status} />
            <span className="db-drawer-meta-sep" />
            <span className="mono">Route {detail.ids.routeId}</span>
          </div>
        ) : null}
        {loading ? <p className="db-drawer-block">Loading details...</p> : null}
        {error ? <p className="db-drawer-block">{error}</p> : null}
        {!loading && !error && detail ? (
          <div className="db-drawer-body">
            <section className="db-drawer-block">
              <h3>Timeline</h3>
              <Timeline timeline={detail.timeline} />
            </section>
            <section className="db-drawer-block">
              <h3>Identifiers</h3>
              <p>Load #: {detail.ids.loadNumber}</p>
              <p>Pickup #: {detail.ids.pickupNumber}</p>
            </section>
            <section className="db-drawer-block">
              <h3>Geography</h3>
              <p>{detail.geography.shipper}</p>
              <p>
                {detail.geography.pickupCityState} ({detail.geography.pickupWindow})
              </p>
              <p>{detail.geography.receiver}</p>
              <p>
                {detail.geography.deliveryCityState} ({detail.geography.deliveryWindow})
              </p>
            </section>
            <section className="db-drawer-block">
              <h3>Financials</h3>
              <p>Line Haul: {money(detail.financials.lineHaul)}</p>
              <p>Loaded Mi: {miles(detail.financials.loadedMi)}</p>
              <p>PU DH: {miles(detail.financials.puDh)}</p>
              <p>DEL DH: {miles(detail.financials.delDh)}</p>
              <p>Total Mi: {miles(detail.financials.totalMi)}</p>
              <p>Neg Mi: {miles(detail.financials.negMi)}</p>
              <p>Loaded RPM: {rpm(detail.financials.loadedRpm)}</p>
              <p>Floor RPM: {rpm(detail.financials.floorRpm)}</p>
              <p>Empty %: {pct(detail.financials.emptyPct, { fromRatio: true })}</p>
            </section>
            <section className="db-drawer-block">
              <h3>Operations</h3>
              <p>Broker: {detail.operations.brokerName}</p>
              <p>Driver: {detail.operations.pickupDriverAssigned}</p>
              <p>Equipment: {detail.operations.equipmentNeeds}</p>
              <p>Tractor/Trailer: {detail.operations.tractorTrailer}</p>
              <p>MG: {detail.operations.mgStatus}</p>
              <p>TMW: {detail.operations.tmwStatus}</p>
            </section>
          </div>
        ) : null}
      </aside>
    </>
  );
}
