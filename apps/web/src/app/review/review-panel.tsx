"use client";

import React from "react";
import type { ReviewRateConfirmation } from "@/server/review";

interface ReviewPanelProps {
  initial: ReviewRateConfirmation;
}

interface ActionResponse {
  loadId?: string;
  alreadyExisted?: boolean;
  reviewDecision?: string;
  error?: string;
}

function toDisplayEntries(payload: Record<string, unknown> | null): Array<{ key: string; value: string }> {
  if (!payload) {
    return [];
  }
  return Object.entries(payload)
    .slice(0, 24)
    .map(([key, value]) => ({
      key,
      value: typeof value === "string" ? value : JSON.stringify(value)
    }));
}

export function ReviewPanel({ initial }: ReviewPanelProps) {
  const [review, setReview] = React.useState<ReviewRateConfirmation>(initial);
  const [reason, setReason] = React.useState("");
  const [exceptionMode, setExceptionMode] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const refreshReview = React.useCallback(async () => {
    const response = await fetch(`/api/review/${encodeURIComponent(review.id)}`, { cache: "no-store" });
    if (!response.ok) {
      return;
    }
    const payload = (await response.json().catch(() => null)) as ReviewRateConfirmation | null;
    if (payload) {
      setReview(payload);
    }
  }, [review.id]);

  const onApprove = React.useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/review/${encodeURIComponent(review.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" })
      });
      const payload = (await response.json().catch(() => null)) as ActionResponse | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to approve review.");
      }
      setMessage(
        payload?.alreadyExisted
          ? `Load already existed (${payload.loadId}).`
          : `Approved and created load ${payload?.loadId ?? "—"}.`
      );
      await refreshReview();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to approve review.");
    } finally {
      setBusy(false);
    }
  }, [refreshReview, review.id]);

  const onReject = React.useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/review/${encodeURIComponent(review.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: reason.trim() || undefined })
      });
      const payload = (await response.json().catch(() => null)) as ActionResponse | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to reject review.");
      }
      setMessage(`Rejected with decision ${payload?.reviewDecision ?? "REJECTED"}.`);
      await refreshReview();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to reject review.");
    } finally {
      setBusy(false);
    }
  }, [reason, refreshReview, review.id]);

  const displayEntries = React.useMemo(() => toDisplayEntries(review.extractedPayload), [review.extractedPayload]);

  return (
    <main style={{ padding: "24px", maxWidth: "1100px", margin: "0 auto" }}>
      <h1>Review Queue</h1>
      <p>
        <strong>Rate Confirmation:</strong> {review.id} · <strong>Parse State:</strong> {review.parseState} ·{" "}
        <strong>Decision:</strong> {review.reviewDecision}
      </p>
      <p>
        <a href={review.sourceFileUrl} target="_blank" rel="noreferrer">
          Open source file
        </a>
      </p>
      {review.loadId ? (
        <p>
          Already linked to load <strong>{review.loadId}</strong>.
        </p>
      ) : null}

      <section style={{ marginTop: "16px" }}>
        <h2>Extracted Payload</h2>
        {displayEntries.length === 0 ? (
          <p>No extracted payload available.</p>
        ) : (
          <table className="db-table compact">
            <thead>
              <tr>
                <th>Field</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {displayEntries.map((entry) => (
                <tr key={entry.key}>
                  <td className="mono">{entry.key}</td>
                  <td>{entry.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={{ marginTop: "20px", display: "grid", gap: "8px", maxWidth: "520px" }}>
        <label htmlFor="exception-mode" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            id="exception-mode"
            type="checkbox"
            checked={exceptionMode}
            onChange={(event) => setExceptionMode(event.target.checked)}
          />
          Enable exception workflow (correction/rejection)
        </label>
        <label htmlFor="reject-reason">Reject reason</label>
        <textarea
          id="reject-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          style={{ resize: "vertical" }}
        />
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="db-btn" disabled={busy || Boolean(review.loadId)} onClick={() => void onApprove()}>
            {busy ? "Working..." : "Approve"}
          </button>
          <button
            className="db-btn db-btn-ghost"
            disabled={busy || Boolean(review.loadId) || !exceptionMode || reason.trim().length === 0}
            onClick={() => void onReject()}
          >
            {busy ? "Working..." : "Reject"}
          </button>
        </div>
      </section>
      {message ? <p style={{ marginTop: "10px" }}>{message}</p> : null}
    </main>
  );
}
