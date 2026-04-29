"use client";

import React from "react";
import type { ViewKpiDashboard } from "@/lib/ui/kpi-mappers";
import { mapKpiDashboardToView } from "@/lib/ui/kpi-mappers";
import { int, money, rpm } from "@/lib/ui/formatters";

type TabId = "Lanes" | "Trend" | "Management Report" | "Reference Rules";

interface KpiDashboardProps {
  initialData: unknown;
}

function toDashboard(data: unknown): ViewKpiDashboard {
  return mapKpiDashboardToView(data as Parameters<typeof mapKpiDashboardToView>[0]);
}

function laneStatusPresentation(status: string): { label: string; cls: string } {
  if (status === "ON_TARGET") {
    return { label: "ON TARGET", cls: "ok" };
  }
  if (status === "BELOW_NEAR") {
    return { label: "BELOW (<$100)", cls: "near" };
  }
  if (status === "BELOW") {
    return { label: "BELOW", cls: "below" };
  }
  return { label: "NO LOADS", cls: "none" };
}

export function KpiDashboard({ initialData }: KpiDashboardProps) {
  const [tab, setTab] = React.useState<TabId>("Lanes");
  const data = toDashboard(initialData);
  const chartWidth = 920;
  const chartHeight = 280;
  const chartPadding = 40;
  const safeTrend = data.trend.length > 0 ? data.trend : [{ week: "—", loads: 0, rev: 0, empty: 0 }];
  const xFor = (index: number) =>
    chartPadding + (index * (chartWidth - chartPadding * 2)) / Math.max(safeTrend.length - 1, 1);
  const maxLoads = Math.max(...safeTrend.map((point) => point.loads), 1);
  const maxRev = Math.max(...safeTrend.map((point) => point.rev ?? 0), 1);
  const maxEmpty = Math.max(...safeTrend.map((point) => point.empty ?? 0), 1);
  const yFor = (value: number, max: number) =>
    chartHeight - chartPadding - (value / max) * (chartHeight - chartPadding * 2);
  const linePath = (values: number[], max: number) =>
    values
      .map((value, index) => `${index === 0 ? "M" : "L"} ${xFor(index)} ${yFor(value, max)}`)
      .join(" ");

  return (
    <div className="db-root db-dash">
      <header className="db-topbar">
        <div className="db-brand">DROP BUCKET</div>
        <nav className="db-topnav">
          <a href="/" className="db-topnav-item">
            Daily Board
          </a>
          <a className="db-topnav-item active">KPI Dashboard</a>
          <span className="db-topnav-item disabled">Lanes</span>
          <span className="db-topnav-item disabled">Brokers</span>
          <span className="db-topnav-item disabled">Audit</span>
        </nav>
      </header>

      <main className="db-dash-main">
        <div className="db-dash-head">
          <div>
            <div className="db-dash-eyebrow mono">WEEKLY KPI</div>
            <h1 className="db-dash-h">Week {data.weekIso}</h1>
          </div>
          <div className="db-dash-meta">
            <span className="dim">Compared to</span>
            <span className="mono">{data.comparisonWeekIso ?? "N/A"}</span>
            <span className="db-dash-meta-pill mono">LIVE</span>
          </div>
        </div>

        <div className="db-kpi-grid">
          {data.cards.map((card) => (
            <div key={card.key} className="db-kpi-card">
              <div className="db-kpi-label">{card.label}</div>
              <div className="db-kpi-value mono">
                {typeof card.value === "string" ? card.value : int(card.value)}
              </div>
              <div className="db-kpi-delta mono">
                {card.delta === null ? card.deltaLabel : `${card.delta > 0 ? "+" : ""}${card.delta.toFixed(2)}`}
              </div>
            </div>
          ))}
        </div>

        <div className="db-tabs">
          <div className="db-tabs-bar">
            {(["Lanes", "Trend", "Management Report", "Reference Rules"] as TabId[]).map((id) => (
              <button key={id} className={`db-tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
                {id}
              </button>
            ))}
          </div>
          <div className="db-tabs-body">
            {tab === "Lanes" ? (
              <table className="db-table compact lanes">
                <thead>
                  <tr>
                    <th>Lane</th>
                    <th className="right">Target</th>
                    <th className="right">Loads</th>
                    <th className="right">Revenue</th>
                    <th className="right">Floor RPM</th>
                    <th className="right">vs Target</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lanes.map((lane) => {
                    const statusPresentation = laneStatusPresentation(lane.status);
                    return (
                      <tr key={lane.lane}>
                        <td className="strong">{lane.lane}</td>
                        <td className="right mono num">{money(lane.target, { decimals: 0 })}</td>
                        <td className="right mono num">{lane.loads}</td>
                        <td className="right mono num">{money(lane.revenue, { decimals: 0 })}</td>
                        <td className="right mono num">{rpm(lane.floorRpm)}</td>
                        <td className="right mono num">{money(lane.vsTarget, { decimals: 0 })}</td>
                        <td>
                          <span className={`db-lane-status ${statusPresentation.cls} mono`}>{statusPresentation.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : null}

            {tab === "Trend" ? (
              <div className="db-trend">
                <div className="db-trend-head">
                  <h3 className="db-tab-h">Week-over-week trend</h3>
                  <div className="db-legend">
                    <span className="db-legend-item">
                      <span className="db-legend-sw load" />
                      Loads
                    </span>
                    <span className="db-legend-item">
                      <span className="db-legend-sw rev" />
                      Revenue
                    </span>
                    <span className="db-legend-item">
                      <span className="db-legend-sw empty" />
                      Empty %
                    </span>
                  </div>
                </div>
                <svg viewBox={`${0} ${0} ${chartWidth} ${chartHeight}`} className="db-trend-svg" preserveAspectRatio="none">
                  <path
                    d={linePath(
                      safeTrend.map((point) => point.loads),
                      maxLoads
                    )}
                    stroke="#6ee7a8"
                    strokeWidth="1.6"
                    fill="none"
                  />
                  <path
                    d={linePath(
                      safeTrend.map((point) => point.rev ?? 0),
                      maxRev
                    )}
                    stroke="#4d8bf5"
                    strokeWidth="1.6"
                    fill="none"
                  />
                  <path
                    d={linePath(
                      safeTrend.map((point) => point.empty ?? 0),
                      maxEmpty
                    )}
                    stroke="#f5b964"
                    strokeWidth="1.6"
                    fill="none"
                    strokeDasharray="3 3"
                  />
                </svg>
                <table className="db-table compact">
                  <thead>
                    <tr>
                      <th>Week</th>
                      <th className="right">Loads</th>
                      <th className="right">Revenue</th>
                      <th className="right">Empty %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.trend.map((point) => (
                      <tr key={point.week}>
                        <td className="mono">{point.week}</td>
                        <td className="right mono num">{point.loads}</td>
                        <td className="right mono num">{money(point.rev, { decimals: 0 })}</td>
                        <td className="right mono num">{point.empty?.toFixed(1) ?? "0.0"}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {tab === "Management Report" ? (
              <div className="db-mgmt-notes">
                {data.managementNotes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
            ) : null}

            {tab === "Reference Rules" ? (
              <div className="db-rules-list">
                {data.rules.map((rule) => (
                  <div key={rule.code} className="db-rule">
                    <div className="db-rule-l">
                      <span className={`db-rule-sev ${rule.severity.toLowerCase()}`}>{rule.severity}</span>
                      <span className="db-rule-code mono">{rule.code}</span>
                    </div>
                    <div className="db-rule-m">
                      <div className="db-rule-title">{rule.title}</div>
                      <div className="db-rule-body dim">{rule.statement}</div>
                    </div>
                    <div className="db-rule-r">
                      <div className="db-rule-lots-l">Applies to</div>
                      <div className="db-rule-lots mono">{rule.appliesTo}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
