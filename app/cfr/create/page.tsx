import { getDepartmentsAction } from "@/modules/cfr/presentation/server-actions/cfr-actions";
import { CfrCreateView } from "@/modules/cfr/presentation";

export const dynamic = "force-dynamic";

export default async function CfrCreatePage() {
  const departments = await getDepartmentsAction();
  
  return (
    <CfrCreateView
      departments={departments}
    />
  );
}
