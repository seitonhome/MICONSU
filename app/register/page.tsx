import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Crea tu consultorio — Mi Consultorio Pro",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border bg-background p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">Configura tu consultorio en pocos pasos</h1>
          <p className="text-sm text-muted-foreground">
            Agenda, pagos, pacientes y página pública en un solo sistema.
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
