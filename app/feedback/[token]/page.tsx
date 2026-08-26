import { getPublicFeedbackPageDataHandler } from "@/modules/cfr/presentation/api";
import {
  CfrExpiredFeedbackView,
  CfrInvalidFeedbackView,
  CfrPublicFeedbackView,
} from "@/modules/cfr/presentation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicFeedbackPage({ params }: PageProps) {
  const { token } = await params;
  const data = await getPublicFeedbackPageDataHandler(token);

  if (data.kind === "invalid") {
    return <CfrInvalidFeedbackView />;
  }

  if (data.kind === "expired") {
    return <CfrExpiredFeedbackView />;
  }

  return <CfrPublicFeedbackView token={data.token} feedback={data.feedback} />;
}
