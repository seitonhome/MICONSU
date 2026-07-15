# Sistema de diseño — Mi Consultorio Pro

## 1. Principios de diseño

El brief del producto pide un sistema **premium, cálido y mobile-first** — no una plantilla administrativa genérica. En la práctica esto se traduce en decisiones concretas ya presentes en el código:

- **Premium sin ser frío**: paletas basadas en `oklch()` (percepción de color más uniforme que HSL/RGB), con tonos tierra/verdes/lavandas cálidos en vez de azules corporativos genéricos, según el tema visual elegido.
- **Cálido**: colores de acento suaves, tipografía legible, mucho espacio en blanco, tarjetas redondeadas (`rounded-xl`/`rounded-2xl`) en vez de bordes cuadrados agresivos.
- **Mobile-first**: los layouts usan utilidades responsive de Tailwind (`sm:`, `md:`, `lg:`) partiendo del layout de una sola columna; por ejemplo, el stepper de onboarding y las listas de tickets/consultorios colapsan a una sola columna en pantallas pequeñas y se expanden en desktop.
- **Adaptable por tipo de práctica**: el mismo componente cambia de vocabulario según `practitioner_type` (por ejemplo "sesión" en vez de "cita" para un psicólogo, "consultante" en vez de "paciente" en biosanación/coaching — ver `DEFAULT_LABELS_BY_PRACTITIONER_TYPE` en `lib/auth/roles.ts`), sin cambiar de componente ni de layout.

## 2. Los 5 temas visuales

`components/themes/theme-provider.tsx` define el enum `VISUAL_THEMES`, que coincide con el enum `visual_theme` de la base de datos (`clinic_branding.visual_theme`). Cada consultorio elige uno al configurar su marca (paso 2 del onboarding); el componente `<ThemeProvider theme={...}>` coloca un atributo `data-theme` en un contenedor, que activa el bloque de variables CSS correspondiente en `app/globals.css`.

| Tema | Uso previsto | Color primario (oklch) | Acento |
|---|---|---|---|
| **Clínico Moderno** (`clinico_moderno`) | Consultorios médicos generales/especialistas | Azul-verdoso profundo `oklch(0.4 0.06 220)` | Verde `oklch(0.78 0.1 155)` |
| **Bienestar Premium** (`bienestar_premium`) | Wellness, spas terapéuticos, nutrición | Verde salvia `oklch(0.62 0.07 135)` | Dorado suave `oklch(0.79 0.1 85)` |
| **Integrativo** (`integrativo`) | Medicina funcional/integrativa | Verde esmeralda `oklch(0.55 0.11 162)` | Azul profundo `oklch(0.42 0.09 250)` |
| **Terapéutico Emocional** (`terapeutico_emocional`) | Psicología, psiquiatría, coaching emocional | Púrpura/lavanda `oklch(0.48 0.13 275)` | Lila claro `oklch(0.72 0.08 300)` |
| **Odontológico Premium** (`odontologico_premium`) | Odontología, ortodoncia | Azul clínico claro `oklch(0.62 0.09 225)` | Menta `oklch(0.83 0.08 165)` |
| **Personalizado** (`personalizado`) | Cualquier consultorio que quiera su propia marca | Toma `primary_color`/`secondary_color` de `clinic_branding` directamente, sin bloque fijo en CSS | — |

Cada tema define, además del color primario/secundario, `--accent`, `--ring` y 5 variables `--chart-1` a `--chart-5` para gráficos de reportes consistentes con la identidad visual del consultorio.

Para el tema **Personalizado**, `ThemeProvider` calcula el color de texto de contraste (`contrastTextColor()`, en `lib/utils/contrast-color.ts`) para que el texto sobre el color elegido por el cliente siga siendo legible, sin que el consultorio tenga que elegirlo manualmente.

## 3. Componentes UI (shadcn/ui)

El proyecto usa [shadcn/ui](https://ui.shadcn.com) sobre Tailwind CSS 4. Componentes presentes hoy en `components/ui/`:

`accordion`, `alert`, `avatar`, `badge`, `button`, `calendar`, `card`, `checkbox`, `dialog`, `dropdown-menu`, `input`, `label`, `popover`, `progress`, `select`, `separator`, `sheet`, `skeleton`, `sonner` (notificaciones toast), `switch`, `table`, `tabs`, `textarea`, `tooltip`.

Sobre esta base, el proyecto construye patrones propios en `components/patterns/` (empty states, wizards, tarjetas de oportunidad comercial) y las variantes de tema en `components/themes/`. El formulario usa `react-hook-form` + `@hookform/resolvers` + `zod` para validación consistente en cliente, espejada por validación Zod en el borde de las Server Actions.

## 4. Tipografía y layout

Fuente base: **Geist** (vía `next/font`, estándar de Vercel/Next.js). `clinic_branding.font_style` permite en el modelo de datos variar el estilo tipográfico por consultorio (columna presente en el esquema; el catálogo de estilos disponibles se gestiona en la capa de branding).

Los layouts autenticados (`/dashboard`, `/admin`) siguen el patrón: header con contexto + navegación lateral colapsable en mobile + contenido principal en tarjetas (`Card`) con `rounded-2xl`, sombra suave (`shadow-sm`) y bordes discretos — visible por ejemplo en `app/onboarding/layout.tsx` y en las páginas de `/admin`.

## 5. Accesibilidad y contraste

Cada bloque de tema define explícitamente `-foreground` para primario, secundario y acento (`--primary-foreground`, `--secondary-foreground`, `--accent-foreground`), evitando que un color de marca oscuro o claro rompa la legibilidad del texto. El tema "Personalizado" calcula el contraste dinámicamente en vez de asumir un valor fijo, precisamente porque el color lo elige el cliente y no se puede garantizar de antemano.
