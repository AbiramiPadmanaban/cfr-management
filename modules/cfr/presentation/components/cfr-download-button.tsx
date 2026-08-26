"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import type { CfrWithProject } from "../../domain/cfr.repository";
import { downloadCfrFeedbackPdf } from "../lib/cfr-feedback-pdf";
import { iconButtonClass } from "./cfr-ui";

export function CfrDownloadButton({ cfr }: { cfr: CfrWithProject }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const canDownload = cfr.status === "SUBMITTED";

  const handleDownload = async () => {
    if (!canDownload || isDownloading) {
      return;
    }
    setIsDownloading(true);
    try {
      await downloadCfrFeedbackPdf(cfr);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to download the report");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={!canDownload || isDownloading}
      className={iconButtonClass}
      title={
        canDownload
          ? "Download customer feedback report"
          : "Available after the client submits feedback"
      }
      aria-label={`Download report for ${cfr.project.projectName}`}
    >
      {isDownloading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-200 border-t-accent" />
      ) : (
        <Download className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
