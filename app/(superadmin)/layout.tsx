import Link from "next/link";
import { requireRole } from "@/lib/auth/session";

const NAV_ITEMS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/consultorios", label: "Consultorios" },
  { href: "/admin/soporte", label: "Soporte" },
];

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["super_admin"]);

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background px-6 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Mi Consultorio Pro
        </p>
        <p className="text-lg font-semibold">Panel Superadmin</p>
        <nav className="mt-3 flex gap-4">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-muted-foreground hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="p-4 md:p-8">{children}</main>
    </div>
  );
}
