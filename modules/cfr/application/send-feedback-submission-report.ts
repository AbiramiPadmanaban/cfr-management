import {
  buildCfrSubmissionReportFileName,
  sendFeedbackSubmittedReportEmail,
} from "@/lib/email";
import type { CfrRepository, CfrWithProject } from "@/modules/cfr/domain/cfr.repository";

export type GenerateCfrPdf = (cfr: CfrWithProject) => Promise<Uint8Array>;

/**
 * Sends the CFR PDF report email after a successful client submission.
 * Uses an atomic claim on submissionEmailSentAt so the email is sent at most once.
 * If sending fails, the claim is released so a later retry can succeed without duplicates.
 */
export async function sendFeedbackSubmissionReportEmail(
  cfrRepo: CfrRepository,
  cfr: CfrWithProject,
  generatePdf: GenerateCfrPdf
): Promise<{ sent: boolean; skipped: boolean; error?: string }> {
  if (cfr.status !== "SUBMITTED") {
    return { sent: false, skipped: true };
  }

  if (!cfr.clientEmail?.trim()) {
    console.error(
      `[CFR #${cfr.id}] Cannot send submission report email: clientEmail is missing.`
    );
    return { sent: false, skipped: true, error: "Missing client email" };
  }

  const claimed = await cfrRepo.claimSubmissionEmailSend(cfr.id);
  if (!claimed) {
    return { sent: false, skipped: true };
  }

  try {
    const pdfBytes = await generatePdf(cfr);
    const pdfFileName = buildCfrSubmissionReportFileName(
      cfr.projectNumber,
      cfr.reviewPeriod
    );

    await sendFeedbackSubmittedReportEmail({
      to: cfr.clientEmail.trim(),
      cc: cfr.sentByEmail,
      clientName: cfr.client,
      projectName: cfr.project.projectName,
      projectNumber: cfr.projectNumber,
      reviewPeriod: cfr.reviewPeriod,
      pdfFileName,
      pdfBytes,
    });

    return { sent: true, skipped: false };
  } catch (error) {
    await cfrRepo.releaseSubmissionEmailSend(cfr.id);
    const message =
      error instanceof Error ? error.message : "Unknown error sending submission report email";
    console.error(`[CFR #${cfr.id}] Submission report email failed:`, message, error);
    return { sent: false, skipped: false, error: message };
  }
}
