import { getCreateCfrPageDataHandler } from "@/modules/cfr/presentation/api";
import { CfrCreateView } from "@/modules/cfr/presentation";

export const dynamic = "force-dynamic";

export default async function CfrCreatePage() {
  const { departments } = await getCreateCfrPageDataHandler();
  return <CfrCreateView departments={departments} />;
}
