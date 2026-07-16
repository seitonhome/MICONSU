import { redirect } from "next/navigation";

// La landing comercial de Mi Consultorio Pro vive en
// https://www.seitonhome.com/mi-consultorio-pro (Seiton Apps). Este dominio
// (mcpro.seitonhome.com) es la aplicación en sí — su raíz va directo al
// login, no a una landing propia, para no duplicar la página de ventas.
export default function RootPage() {
  redirect("/login");
}
