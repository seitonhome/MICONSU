# Handoff: Mi Consultorio Pro — Rediseño visual

## Overview
Rediseño puramente visual del panel de Mi Consultorio Pro (repo `seitonhome/MICONSU`, Next.js + Tailwind CSS 4 + shadcn/ui). No cambia flujos, datos ni lógica — solo estilo: layout, jerarquía visual, color, tipografía y densidad. El objetivo es que el panel se vea "PRO": más jerarquía visual (bento en vez de grids uniformes), tarjetas con más aire y profundidad sutil, y consistencia total entre pantallas.

## About the design files
Los archivos `.dc.html` en esta carpeta son **referencias de diseño en HTML**, hechas para mostrar look & behavior — no son código para copiar tal cual. La tarea es **recrear este diseño dentro del código Next.js/Tailwind/shadcn ya existente** en el repo, reutilizando los componentes reales de `components/ui/*` (Card, Button, Badge, Table, Dialog, Select, etc.) y las server actions / data fetching que ya existen en cada `page.tsx`. No se debe reescribir la lógica de datos: solo el markup/clases Tailwind que producen el layout y el estilo.

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografía, espaciado y layout son intencionales y deben recrearse con precisión usando Tailwind + las variables CSS ya definidas en `app/globals.css` (tema `clinico_moderno`).

## Design tokens

Todos los colores son `oklch()`, tomados del tema `clinico_moderno` ya existente en `app/globals.css` — este rediseño NO introduce un tema nuevo, solo lo aplica con más disciplina:

- `--background` / `--card`: `oklch(0.99 0.004 90)` (blanco cálido). En el rediseño, las tarjetas usan blanco puro `oklch(1 0 0)` para ganar contraste sutil contra el fondo — único ajuste de token propuesto.
- `--primary`: `oklch(0.4 0.06 220)` (azul-verdoso profundo) — texto/fondo de estados activos, botones primarios, iconos clave.
- `--primary-foreground`: `oklch(0.98 0 0)`
- `--secondary` (chip de icono): `oklch(0.94 0.02 200)`
- `--accent` (verde): `oklch(0.78 0.1 155)` — usado en badges de éxito/activo y chips secundarios, con fondo `oklch(0.78 0.1 155 / 0.22-0.28)` y texto `oklch(0.2 0.04 155)`.
- Texto muted: `oklch(0.45 0 0)` (cuerpo) y `oklch(0.556 0 0)` (labels pequeños/uppercase).
- Bordes: `oklch(0 0 0 / 6-8%)` — nunca gris sólido.
- Destructivo (cancelado/no-show): fondo `oklch(0.577 0.245 27.325 / 0.12)`, texto `oklch(0.5 0.2 27)`.
- Chart bars: `--chart-1..4` del tema (`oklch(0.4 0.06 220)`, `oklch(0.78 0.1 155)`, `oklch(0.6 0.05 220)`, `oklch(0.85 0.03 90)`).

**Tipografía**: Inter (o Geist ya usado en el repo vía `next/font`) — pesos 400/500/600/700/800. Tamaños: H1 24-28px/800, título de card 14-14.5px/600-700, cuerpo 13-13.5px/400-500, labels/meta 12-12.5px/500-600, uppercase labels 10.5-11px/700 con letter-spacing .05-.07em.

**Radios**: 16px (tarjetas de lista/fila), 20px (tarjetas destacadas del dashboard), 10px (botones/inputs), 99px (badges/toggles/pills).

**Sombras**: solo en tarjetas destacadas del Inicio — `0 1px 2px rgba(20,40,60,.04), 0 10px 28px -16px rgba(20,40,60,.16)`. El resto usa borde de 1px en vez de sombra.

**Espaciado**: contenedor principal `padding: 40px 44px`; gap entre tarjetas 16-20px; gap interno de tarjeta 10-18px.

## Screens

Cada pantalla comparte el mismo shell: sidebar fija de 264px (logo + nombre de clínica, navegación agrupada en 4 secciones — General / Servicios y pagos / Crecimiento / Cuenta — igual a `NAV_GROUPS` en `dashboard-shell.tsx`, footer con avatar + rol + botón "Cerrar sesión") y área principal con `padding: 40px 44px`.

1. **Inicio** (`app/(app)/dashboard/page.tsx`) — Layout bento en vez de grid de 8 tarjetas idénticas: fila 1 con 3 columnas de ancho variable (Agenda de hoy 5/12 con mini-lista de próximas citas; Ingresos del mes 4/12 con mini gráfico de barras y badge "+12%"; Pacientes nuevos 3/12); fila 2 con una franja de 5 tarjetas compactas (lista de espera, canceladas, inasistencias, tickets, backup).
2. **Agenda** — header + filtros (profesional, estado, navegación de fecha) + lista de citas (hora, paciente, badge de estado con color por estado, servicio·profesional·modalidad). Modal "Nueva cita".
3. **Pacientes** — buscador + lista con avatar de iniciales, documento, contacto, badge activo/inactivo. Modal "Nuevo paciente".
4. **Profesionales** — lista simple con tipo de práctica/especialidad y badge activo/inactivo. Modal "Nuevo profesional".
5. **Servicios** — chips de categoría + grupos de servicios con toggle activo, badge de clasificación. Modal "Nuevo servicio".
6. **Pagos** — tarjetas apiladas por proveedor (Transferencia, Presencial, Wompi, Mercado Pago, ePayco, Link externo, próximamente) con badge de estado (Activo/Configurado/Sin configurar/Próximamente, este último con opacidad reducida).
7. **Lista de espera** — caja punteada "Cupos recién liberados" + lista de entradas con badge Esperando/Notificado. Modal "Agregar a lista de espera".
8. **Paquetes** — lista con barra de progreso de sesiones usadas/total y badge de estado. Modal "Nuevo paquete".
9. **Procesos** — lista de procesos terapéuticos con badge de estado y objetivo/próxima sesión. Modal "Nuevo proceso".
10. **Grupales** — lista de talleres con badge de estado, fecha, profesional, cupo. Modal "Nuevo taller".
11. **Recursos** — lista de material educativo con badge de tipo (PDF/Video/Guía). Modal "Subir recurso".
12. **Seguimientos** — lista de seguimientos postconsulta con badge de estado. Modal "Nuevo seguimiento".
13. **Reseñas** — lista con estrellas, comentario y badge Privada/Aprobada/Destacada. Modal "Nueva reseña".
14. **Oportunidades** — grid 2 columnas de tarjetas de insight (pacientes sin próxima cita, cupos cancelados recuperables, pagos pendientes, horas libres, servicios top, pacientes frecuentes/inactivos). Sin modal (solo lectura).
15. **Reportes** — grid 2x2: citas por mes y ingresos por mes (barras con valor sobre cada barra), pacientes nuevos por mes, tabla de servicios más reservados.
16. **Consentimientos** — lista de documentos legales con badge de versión y toggle activo. Modal "Nuevo documento".
17. **Ayuda** — tabs Tips / Guía de usuario; Tips como acordeón agrupado por categoría + card de contacto a Soporte.
18. **Soporte** — 2 tarjetas resumen (Licencia, Plan Continuidad Clínica) + lista de tickets con badge de estado. Modal "Nuevo ticket".
19. **Configuración** — grid de tarjetas-enlace (Horarios, Marca y tema visual, Servicios, Pagos, Consentimientos y legal).
20. **Login** — tarjeta centrada de 380px sobre fondo degradado sutil (secondary → background), logo, inputs, botón primario, link a portal de pacientes.
21. **Portal del paciente** — header simple (logo + nombre de clínica + Salir), hero de próxima cita en fondo `--primary` sólido, historial de citas en lista.

## Interactions & behavior
- Toda la navegación entre pantallas es client-side (cambio de vista, sin reload).
- Los botones "+ Nuevo/a ..." abren un modal centrado (overlay `oklch(0 0 0 / 0.28)`, tarjeta blanca 440px, radio 16px) con 2-4 campos representativos, botón Cancelar (outline) y botón primario de submit — deben mapearse a los diálogos reales ya existentes (`appointment-dialog.tsx`, `patient-dialog.tsx`, `service-dialog.tsx`, etc.), que ya tienen toda la lógica de formulario; el mockup solo referencia qué campos priorizar visualmente.
- Toggles (servicio activo, documento activo) son el mismo patrón: pill 32x18px, fondo `--primary` cuando ON, `oklch(0 0 0/14%)` cuando OFF, knob blanco de 14px.
- Badges de estado usan color semántico consistente: primary = confirmado/en curso/configurado, accent (verde) = activo/completado/aprobado, outline = pendiente/inactivo/sin configurar, destructivo (rojo) = cancelado/no-show.

## Assets
- Logo: `public/logo.png` (ya existente en el repo, sin cambios).
- Iconografía: set de iconos lineales simples (stroke 1.6, 17-19px) dibujados a mano en SVG inline como referencia de estilo — en producción deben reemplazarse por los iconos de `lucide-react` ya usados en el repo (mismo nombre semántico: `CalendarDays`, `Users`, `Wallet`, `ShieldCheck`, etc., ya importados en cada `page.tsx` original).

## Files
- `Dashboard Inicio - Rediseño.dc.html` — primera iteración, solo pantalla de Inicio.
- `Mi Consultorio Pro - Rediseño.dc.html` — versión completa con las 21 pantallas navegables (usar esta como referencia principal).
- `screenshots/` — capturas de referencia: 01-inicio, 02-agenda, 03-pacientes, 04-pagos, 05-reportes, 06-oportunidades, 07-modal (ejemplo de modal "Nueva cita").

Ambos son componentes autocontenidos: ábrelos en cualquier navegador para inspeccionar el HTML/CSS inline directamente (clic derecho → inspeccionar) y confirmar valores exactos de color, tipografía y espaciado.
