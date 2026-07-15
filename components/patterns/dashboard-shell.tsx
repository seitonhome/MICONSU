"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Users,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: BarChart3, show: () => true },
  { href: "/dashboard/agenda", label: "Agenda", icon: CalendarDays, show: () => true },
  { href: "/dashboard/pacientes", label: "Pacientes", icon: Users, show: () => true },
  {
    href: "/dashboard/lista-espera",
    label: "Lista de espera",
    icon: ListTree,
    show: (r, e) => STAFF_OPERATIVE_ROLES.includes(r) && e.profesionalPlan,
  },
  { href: "/dashboard/servicios", label: "Servicios", icon: Stethoscope, show: (r) => r === "clinic_owner" },
  {
    href: "/dashboard/pagos",
    label: "Pagos",
    icon: CreditCard,
    show: (r) => roleHasPermission(r, "payments:manage") || roleHasPermission(r, "payments:view_reports"),
  },
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
  { href: "/dashboard/consentimientos", label: "Consentimientos", icon: ShieldCheck, show: (r) => r === "clinic_owner" },
  { href: "/dashboard/soporte", label: "Soporte", icon: LifeBuoy, show: () => true },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings, show: (r) => r === "clinic_owner" },
];

const STAFF_OPERATIVE_ROLES: AppRole[] = ["clinic_owner", "assistant", "receptionist", "professional"];

export function DashboardShell({
  children,
  clinicName,
  role,
  fullName,
  entitlements,
}: {
  children: React.ReactNode;
  clinicName: string;
  role: AppRole;
  fullName: string;
  entitlements: NavEntitlements;
}) {
  const pathname = usePathname();
  const initials = fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-64 shrink-0 border-r bg-background md:flex md:flex-col">
        <div className="px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mi Consultorio Pro</p>
          <p className="mt-1 truncate text-lg font-semibold">{clinicName}</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.filter((item) => item.show(role, entitlements)).map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
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
        </nav>
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
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
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
