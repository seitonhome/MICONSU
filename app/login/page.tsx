import type { Metadata } from "next";
import Image from "next/image";
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
      className="flex min-h-screen items-center justify-center bg-gradient-to-b from-secondary/70 to-background px-4"
    >
      <div className="w-full max-w-[380px] rounded-[20px] border border-black/[0.07] bg-card/95 p-9 shadow-[0_20px_60px_-24px_rgba(20,40,60,0.25)] backdrop-blur-md">
        <div className="mb-6 flex flex-col items-center gap-2.5 text-center">
          <Image src="/logo.png" alt="Mi Consultorio Pro" width={52} height={52} className="rounded-[14px] object-cover" />
          <h1 className="text-lg font-bold text-foreground">Mi Consultorio Pro</h1>
          <p className="text-[13px] text-muted-foreground">Ingresa a tu panel de consultorio.</p>
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
