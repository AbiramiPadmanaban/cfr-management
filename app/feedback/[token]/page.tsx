import {
  getPublicFeedbackAction,
} from "@/modules/cfr/presentation/server-actions/cfr-actions";
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
  const feedback = await getPublicFeedbackAction(token);

  if (!feedback) {
    return <CfrInvalidFeedbackView />;
  }

  if (feedback.expired) {
    return <CfrExpiredFeedbackView />;
  }

  return <CfrPublicFeedbackView token={token} feedback={feedback} />;
}
