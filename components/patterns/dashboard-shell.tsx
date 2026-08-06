"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Users,
  UserRound,
  Stethoscope,
  CreditCard,
  BarChart3,
  LineChart,
  Lightbulb,
  ShieldCheck,
  LifeBuoy,
  Settings,
  PackageOpen,
  Sparkles,
  CalendarRange,
  Library,
  Heart,
  Star,
  ListTree,
  BookOpenCheck,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { signOut } from "@/app/(app)/actions";
import type { AppRole } from "@/lib/auth/roles";
import { roleHasPermission } from "@/lib/auth/roles";

type NavEntitlements = {
  profesionalPlan: boolean;
  packages: boolean;
  workshops: boolean;
  resources: boolean;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  show: (role: AppRole, entitlements: NavEntitlements) => boolean;
};

const STAFF_OPERATIVE_ROLES: AppRole[] = ["clinic_owner", "assistant", "receptionist", "professional"];

type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "General",
    items: [
      { href: "/dashboard", label: "Inicio", icon: BarChart3, show: () => true },
      { href: "/dashboard/agenda", label: "Agenda", icon: CalendarDays, show: () => true },
      { href: "/dashboard/pacientes", label: "Pacientes", icon: Users, show: () => true },
      {
        href: "/dashboard/profesionales",
        label: "Profesionales",
        icon: UserRound,
        show: (r) => r === "clinic_owner",
      },
      {
        href: "/dashboard/lista-espera",
        label: "Lista de espera",
        icon: ListTree,
        show: (r, e) => STAFF_OPERATIVE_ROLES.includes(r) && e.profesionalPlan,
      },
    ],
  },
  {
    label: "Servicios y pagos",
    items: [
      { href: "/dashboard/servicios", label: "Servicios", icon: Stethoscope, show: (r) => r === "clinic_owner" },
      {
        href: "/dashboard/pagos",
        label: "Pagos",
        icon: CreditCard,
        show: (r) => roleHasPermission(r, "payments:manage") || roleHasPermission(r, "payments:view_reports"),
      },
    ],
  },
  {
    label: "Crecimiento",
    items: [
      {
        href: "/dashboard/paquetes",
        label: "Paquetes",
        icon: PackageOpen,
        show: (r, e) => STAFF_OPERATIVE_ROLES.includes(r) && e.profesionalPlan && e.packages,
      },
      {
        href: "/dashboard/procesos",
        label: "Procesos",
        icon: Sparkles,
        show: (r, e) => (r === "clinic_owner" || r === "professional") && e.profesionalPlan,
      },
      {
        href: "/dashboard/grupales",
        label: "Grupales",
        icon: CalendarRange,
        show: (r, e) => STAFF_OPERATIVE_ROLES.includes(r) && e.profesionalPlan && e.workshops,
      },
      {
        href: "/dashboard/recursos",
        label: "Recursos",
        icon: Library,
        show: (r, e) => (r === "clinic_owner" || r === "assistant" || r === "professional") && e.profesionalPlan && e.resources,
      },
      {
        href: "/dashboard/seguimientos",
        label: "Seguimientos",
        icon: Heart,
        show: (r, e) => STAFF_OPERATIVE_ROLES.includes(r) && e.profesionalPlan,
      },
      {
        href: "/dashboard/resenas",
        label: "Reseñas",
        icon: Star,
        show: (r, e) => (r === "clinic_owner" || r === "assistant" || r === "receptionist") && e.profesionalPlan,
      },
      { href: "/dashboard/oportunidades", label: "Oportunidades", icon: Lightbulb, show: (r) => r === "clinic_owner" },
      {
        href: "/dashboard/reportes",
        label: "Reportes",
        icon: LineChart,
        show: (r) => r === "clinic_owner" || r === "finance_user",
      },
    ],
  },
  {
    label: "Cuenta",
    items: [
      { href: "/dashboard/consentimientos", label: "Consentimientos", icon: ShieldCheck, show: (r) => r === "clinic_owner" },
      { href: "/dashboard/ayuda", label: "Ayuda", icon: BookOpenCheck, show: () => true },
      { href: "/dashboard/soporte", label: "Soporte", icon: LifeBuoy, show: () => true },
      { href: "/dashboard/configuracion", label: "Configuración", icon: Settings, show: (r) => r === "clinic_owner" },
    ],
  },
];

function NavLinks({
  role,
  entitlements,
  pathname,
  onNavigate,
}: {
  role: AppRole;
  entitlements: NavEntitlements;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-4 px-3">
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((item) => item.show(role, entitlements));
        if (items.length === 0) return null;
        return (
          <div key={group.label}>
            <p className="px-3 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground/70 uppercase">
              {group.label}
            </p>
            <div className="space-y-1">
              {items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function AccountFooter({ fullName, role, initials }: { fullName: string; role: AppRole; initials: string }) {
  return (
    <div className="border-t p-4">
      <div className="flex items-center gap-3">
        <Avatar className="size-9">
          <AvatarFallback>{initials || "?"}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{fullName}</p>
          <p className="truncate text-xs text-muted-foreground">{ROLE_LABELS[role]}</p>
        </div>
      </div>
      <form action={signOut} className="mt-3">
        <Button type="submit" variant="outline" size="sm" className="w-full">
          Cerrar sesión
        </Button>
      </form>
    </div>
  );
}

export function DashboardShell({
  children,
  clinicName,
  logoUrl,
  role,
  fullName,
  entitlements,
}: {
  children: React.ReactNode;
  clinicName: string;
  logoUrl: string | null;
  role: AppRole;
  fullName: string;
  entitlements: NavEntitlements;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const initials = fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r bg-background md:flex">
        <div className="flex items-center gap-3 px-6 py-5">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={clinicName} className="size-9 shrink-0 rounded-lg object-cover" />
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mi Consultorio Pro</p>
            <p className="mt-1 truncate text-lg font-semibold">{clinicName}</p>
          </div>
        </div>
        <NavLinks role={role} entitlements={entitlements} pathname={pathname} />
        <AccountFooter fullName={fullName} role={role} initials={initials} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-background px-4 py-3 md:hidden">
          <div className="flex min-w-0 items-center gap-2">
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={clinicName} className="size-8 shrink-0 rounded-lg object-cover" />
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Mi Consultorio Pro</p>
              <p className="truncate text-base font-semibold">{clinicName}</p>
            </div>
          </div>
          <Button variant="outline" size="icon" aria-label="Abrir menú" onClick={() => setMobileOpen(true)}>
            <Menu className="size-4" />
          </Button>
        </header>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b">
              <SheetTitle>{clinicName}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-1 flex-col overflow-y-auto py-3">
              <NavLinks role={role} entitlements={entitlements} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </div>
            <AccountFooter fullName={fullName} role={role} initials={initials} />
          </SheetContent>
        </Sheet>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super administrador",
  clinic_owner: "Dueño del consultorio",
  professional: "Profesional",
  assistant: "Asistente",
  receptionist: "Recepción",
  finance_user: "Finanzas",
  support_agent: "Soporte",
  patient: "Paciente",
};
