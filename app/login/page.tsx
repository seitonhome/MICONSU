import type { Metadata } from "next";
import { ThemeProvider } from "@/components/themes/theme-provider";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Ingresar — Mi Consultorio Pro",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ checkEmail?: string }>;
}) {
  const { checkEmail } = await searchParams;

  return (
    <ThemeProvider
      theme="clinico_moderno"
      className="relative flex min-h-screen items-center justify-center px-4"
    >
      <div className="absolute inset-0 bg-[url('/mcprobg.png')] bg-cover bg-center opacity-80" />
      <div className="relative w-full max-w-sm rounded-2xl border bg-background/95 p-8 shadow-lg backdrop-blur-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">Mi Consultorio Pro</h1>
          <p className="text-sm text-muted-foreground">Ingresa a tu panel de consultorio.</p>
        </div>
        {checkEmail && (
          <p className="mb-4 rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground">
            Revisa tu correo para confirmar tu cuenta antes de ingresar.
          </p>
        )}
        <LoginForm />
      </div>
    </ThemeProvider>
  );
}
