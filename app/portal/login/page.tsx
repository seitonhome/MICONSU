import type { Metadata } from "next";
import { ThemeProvider } from "@/components/themes/theme-provider";
import { PatientLoginForm } from "./patient-login-form";

export const metadata: Metadata = {
  title: "Acceso al portal — Mi Consultorio Pro",
};

export default function PatientLoginPage() {
  return (
    <ThemeProvider
      theme="clinico_moderno"
      className="flex min-h-screen items-center justify-center px-4"
    >
      <div className="w-full max-w-sm rounded-2xl border bg-background/95 p-8 shadow-lg backdrop-blur-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">Tu portal</h1>
          <p className="text-sm text-muted-foreground">
            Ingresa con el correo que usaste al reservar para ver tus citas, pagos y documentos.
          </p>
        </div>
        <PatientLoginForm />
      </div>
    </ThemeProvider>
  );
}
