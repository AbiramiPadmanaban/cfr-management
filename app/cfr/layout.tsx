import { requireAuth } from "@/server/auth/require-auth";
import { CfrAppShell } from "@/modules/cfr/presentation/components/cfr-app-shell";

export default async function CfrLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();

  return (
    <CfrAppShell
      currentUser={{
        email: user.email,
        name: user.name,
        role: user.role,
      }}
    >
      {children}
    </CfrAppShell>
  );
}
