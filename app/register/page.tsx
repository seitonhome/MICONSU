import type { Metadata } from "next";
import { ThemeProvider } from "@/components/themes/theme-provider";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Crea tu consultorio — Mi Consultorio Pro",
};

export default function RegisterPage() {
  return (
    <ThemeProvider
      theme="clinico_moderno"
      className="relative flex min-h-screen items-center justify-center px-4 py-10"
    >
      <div className="absolute inset-0 bg-[url('/mcprobg.png')] bg-cover bg-center opacity-80" />
      <div className="relative w-full max-w-sm rounded-2xl border bg-background/95 p-8 shadow-lg backdrop-blur-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">Configura tu consultorio en pocos pasos</h1>
          <p className="text-sm text-muted-foreground">
            Agenda, pagos, pacientes y página pública en un solo sistema.
          </p>
        </div>
        <RegisterForm />
      </div>
    </ThemeProvider>
  );
}
