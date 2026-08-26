import { UsersAdminView } from "@/modules/auth/presentation";
import { listUsersAction } from "@/modules/auth/presentation/server-actions/auth-actions";

export const dynamic = "force-dynamic";

export default async function CfrUsersPage() {
  const users = await listUsersAction();
  return <UsersAdminView users={users} />;
}
