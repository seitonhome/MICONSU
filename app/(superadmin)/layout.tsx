import { requireRole } from "@/lib/auth/session";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["super_admin"]);

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background px-6 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Mi Consultorio Pro
        </p>
        <p className="text-lg font-semibold">Panel Superadmin</p>
      </header>
      <main className="p-4 md:p-8">{children}</main>
    </div>
  );
}
