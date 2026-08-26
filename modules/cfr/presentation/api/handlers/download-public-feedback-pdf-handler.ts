import { PrismaCfrRepository } from "../../../infrastructure/cfr.prisma-repo";
import { buildCfrFeedbackPdf } from "../../lib/cfr-feedback-pdf";

function createCfrRepo() {
  return new PrismaCfrRepository();
}

export type DownloadPublicFeedbackPdfResult =
  | {
      ok: true;
      fileName: string;
      bytes: Uint8Array;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

export async function downloadPublicFeedbackPdfHandler(
  token: string
): Promise<DownloadPublicFeedbackPdfResult> {
  if (!token || token.length < 16) {
    return { ok: false, status: 400, error: "Invalid feedback link" };
  }

  const cfr = await createCfrRepo().getCfrByFeedbackToken(token);
  if (!cfr || cfr.status !== "SUBMITTED") {
    return {
      ok: false,
      status: 404,
      error: "The report is available after feedback is submitted",
    };
  }

  const bytes = await buildCfrFeedbackPdf(cfr);
  const fileName = `Customer-Feedback-Report_${(cfr.projectNumber || `CFR-${cfr.id}`).replace(/[^\w.-]+/g, "_")}.pdf`;

  return {
    ok: true,
    fileName,
    bytes,
  };
}
