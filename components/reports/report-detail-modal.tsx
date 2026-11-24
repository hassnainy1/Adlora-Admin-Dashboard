"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ApiError } from "@/lib/api";
import { reportsApi, type AdminReport, type ReportStatus } from "@/lib/reports";
import { usersApi, type AdminUser } from "@/lib/users";
import { tattoosApi, type AdminTattooDetail } from "@/lib/tattoos";
import { reviewsApi, type AdminReview } from "@/lib/reviews";
import { statusTone, typeTone, STATUS_LABELS, STATUS_OPTIONS, TYPE_LABELS } from "@/components/reports/report-status";
import { ReporterCell, TargetCell } from "@/components/reports/report-shared";

export function ReportDetailModal({
  report,
  onClose,
  onUpdated,
  notify,
}: {
  report: AdminReport | null;
  onClose: () => void;
  onUpdated: (updated: AdminReport) => void;
  notify: (message: string, tone?: "success" | "danger") => void;
}) {
  const [status, setStatus] = useState<ReportStatus>("PENDING");
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [targetUser, setTargetUser] = useState<AdminUser | null>(null);
  const [targetTattoo, setTargetTattoo] = useState<AdminTattooDetail | null>(null);
  const [targetReview, setTargetReview] = useState<AdminReview | null>(null);
  const [targetLoading, setTargetLoading] = useState(false);

  useEffect(() => {
    if (!report) return;
    // Resets the form to the opened report's current values — no render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus(report.status);
    setAdminNote(report.adminNote ?? "");
    setTargetUser(null);
    setTargetTattoo(null);
    setTargetReview(null);

    setTargetLoading(true);
    const lookup =
      report.reportableType === "USER"
        ? usersApi.get(report.reportableId).then((u) => {
            setTargetUser(u);
          })
        : report.reportableType === "TATTOO"
          ? tattoosApi.get(report.reportableId).then((t) => {
              setTargetTattoo(t);
            })
          : reviewsApi.get(report.reportableId).then((r) => {
              setTargetReview(r);
            });

    lookup.catch(() => {}).finally(() => setTargetLoading(false));
  }, [report]);

  if (!report) return null;

  async function save() {
    if (!report) return;
    setSaving(true);
    try {
      const updated = await reportsApi.updateStatus(report.id, {
        status,
        adminNote: adminNote.trim() || null,
      });
      onUpdated(updated);
      notify("Report updated.", "success");
      onClose();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to update report.", "danger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={report !== null} onClose={onClose} title="Report details" size="lg">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-wide text-(--text-muted) uppercase">Reporter</p>
          <Badge tone={statusTone[report.status]}>{STATUS_LABELS[report.status]}</Badge>
        </div>
        <ReporterCell report={report} size="lg" />

        <div className="border-t border-(--border-subtle) pt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wide text-(--text-muted) uppercase">Target</p>
            <Badge tone={typeTone[report.reportableType]}>{TYPE_LABELS[report.reportableType]}</Badge>
          </div>
          <TargetCell
            report={report}
            targetUser={targetUser}
            targetTattoo={targetTattoo}
            targetReview={targetReview}
            loading={targetLoading}
          />
        </div>

        <div className="border-t border-(--border-subtle) pt-4">
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-(--text-muted) uppercase">Reason</p>
          <p className="text-sm text-(--text-secondary) whitespace-pre-wrap">{report.reason}</p>
        </div>

        {report.description && (
          <div className="border-t border-(--border-subtle) pt-4">
            <p className="mb-1.5 text-xs font-semibold tracking-wide text-(--text-muted) uppercase">Description</p>
            <p className="text-sm text-(--text-secondary) whitespace-pre-wrap">{report.description}</p>
          </div>
        )}

        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 border-t border-(--border-subtle) pt-4 text-sm sm:grid-cols-2">
          <Detail label="Report ID" value={`#${report.id}`} />
          <Detail label="Created" value={new Date(report.createdAt).toLocaleString()} />
          <Detail label="Updated" value={new Date(report.updatedAt).toLocaleString()} />
        </dl>

        <div className="space-y-3 border-t border-(--border-subtle) pt-4">
          <label className="flex flex-col gap-1 text-xs font-medium text-(--text-muted)">
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ReportStatus)}
              className="h-9 w-full rounded-md border border-(--border) bg-(--surface) px-2 text-sm text-(--text) outline-none transition-colors focus:border-(--accent)"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-(--text-muted)">
            Admin note
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={3}
              placeholder="Optional note explaining the decision"
              className="w-full resize-none rounded-md border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--text) placeholder:text-(--text-subtle) outline-none transition-colors focus:border-(--accent)"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-(--border-subtle) pt-4">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-(--border-subtle) py-1.5">
      <dt className="text-(--text-muted)">{label}</dt>
      <dd className="truncate text-right font-medium text-(--text)">{value}</dd>
    </div>
  );
}
