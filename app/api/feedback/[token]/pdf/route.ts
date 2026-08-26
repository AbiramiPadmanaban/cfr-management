import { NextResponse } from "next/server";
import { downloadPublicFeedbackPdfHandler } from "@/modules/cfr/presentation/api";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;
    const result = await downloadPublicFeedbackPdfHandler(token);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return new NextResponse(Buffer.from(result.bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to download public feedback PDF:", error);
    return NextResponse.json({ error: "Failed to download the report" }, { status: 500 });
  }
}
