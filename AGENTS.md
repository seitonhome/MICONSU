# Mi Consultorio Pro — orientación rápida para Claude

Lee esto primero, siempre. Es el punto de entrada; los `.md` de la raíz y `docs/` tienen el detalle por tema — este archivo te dice qué es cierto hoy y a cuál documento ir para cada cosa, para no tener que redescubrirlo cada sesión ni asumir mal y romper algo en producción.

## Qué es este producto

SaaS multi-tenant para consultorios de salud/bienestar (agenda, pacientes, pagos, consentimientos, módulo clínico) — Next.js 15 App Router + Supabase (Postgres/Auth/Storage), desplegado en Vercel. Se vende como **un solo plan anual de $39 USD, todo incluido** (sin niveles que el cliente elija) vía Hotmart, con activación **self_register**: el comprador recibe un correo con link a `/register`, crea su cuenta y `create_clinic_and_assign_owner()` le otorga automáticamente licencia + todos los módulos + soporte por 1 año. No hay códigos de activación.

**Dos repos separados, sin base de datos ni stack en común:**
- **Este repo** (`C:\Users\cesar\miconsu`) — la aplicación real (Supabase).
- **`C:\Users\cesar\seiton`** — landing comercial (`/mi-consultorio-pro`), catálogo de apps, webhook de Hotmart y panel `/admin/apps` (Next.js + Prisma/Postgres, stack completamente distinto). Un cambio en uno no se refleja en el otro — revisa ambos si trabajas en el flujo de compra/landing.

## Regla más importante de esta sesión: nada sirve si no llega a producción

El 2026-08-04 se descubrió que **meses de funcionalidad ya construida y "verificada" nunca habían sido subidos a git** — portal del paciente, pasarelas de pago, modelo de plan anual, paneles de superadmin, todo vivía solo en el disco local mientras producción corría una versión de semanas atrás. Verificar contra el código local o incluso contra `npm run dev` **no prueba que algo esté en producción**.

Por eso:
- **Corre `npm run build` antes de cualquier commit no trivial**, y **haz `git add`/`commit`/`push` en cuanto termines un cambio** — no lo dejes "para después". Si el usuario no pidió explícitamente el push, pregúntale, pero no asumas que "ya quedó guardado" solo porque el archivo está editado en disco.
- Antes de decir "esto ya funciona en producción", corre `git status` y compara con el último commit — si hay cambios sin commitear relacionados, adviértelo.
- Los despliegues son automáticos vía Vercel al hacer push a `master` — puedes verificar el estado de un deploy con las herramientas de Vercel (`list_deployments`/`get_deployment`) usando el projectId de `miconsu` (`prj_8TqtoLCIJ0cA5v45IPvDK73zdE3e`, team `team_5lbhXERhypmjhNX0HUxRcZUA`).

## Base de datos: Supabase, y el CLI no funciona en esta máquina

- Proyecto Supabase activo: **`hmmnmkuubysplmnlckaf`** (migrado el 2026-08-03 desde un proyecto anterior por tema de costos — el viejo ya no existe).
- **El CLI de Supabase (`supabase db push`, `gen types`) no puede conectar desde esta red — bloqueo IPv6 confirmado, no hipotético.** No pierdas tiempo reintentando `supabase link`/`db push`; ve directo al **workaround**: concatenar `supabase/migrations/*.sql` (en orden por timestamp) + `supabase/seed/*.sql` y pegarlos en el **SQL Editor** del dashboard de Supabase. Así se aplicó el esquema completo y así se aplican los cambios nuevos.
- `lib/supabase/types.ts` es **escrito a mano**, no generado por el CLI, por la misma razón — mantenlo sincronizado manualmente si cambias el esquema.
- No hay forma de saber desde el código solo si una migración ya está aplicada en la base de datos real — **pregunta al usuario o pide que confirme en el SQL Editor** antes de asumirlo, en vez de adivinar.
- Un trigger de seguridad (`prevent_self_privilege_escalation`) bloqueó el registro de consultorios nuevos hasta el fix del 2026-08-04 (migración `20260804120000`) — si algo similar vuelve a fallar con el mensaje "No puedes modificar tu propio rol o consultorio", ya se corrigió una vez; revisa esa migración antes de reintroducir el bug.

## Estructura real (no la del plan original)

`docs/00-ARQUITECTURA-Y-PLAN.md` es el documento **previo a escribir código** — describe una estructura con carpetas `services/`/`repositories/` y grupos de rutas `(public-booking)`/`(portal)`/`(demo)` que **no existen así en el código real**. Trátalo como intención histórica, no como mapa de archivos. La estructura real:

- `app/(app)/dashboard/...` — panel autenticado del consultorio (nav agrupado en `components/patterns/dashboard-shell.tsx`: General / Servicios y pagos / Crecimiento / Cuenta).
- `app/(superadmin)/admin/...` — panel del equipo del producto.
- `app/c/[slug]`, `app/p/[slug]`, `app/reserva/[token]` — páginas públicas y flujo de reserva.
- `app/portal/...` — portal del paciente (magic link, sin contraseña).
- `app/demo/[vertical]` — modo demo comercial.
- `app/login`, `app/register`, `app/onboarding/[step]` — acceso y alta de consultorio.
- `lib/payments/providers/` — Wompi, Mercado Pago, ePayco y link externo **ya implementados**; PayU/Bold/PlaceToPay son stubs no funcionales (ver `PAYMENT_PROVIDERS.md`, corregido 2026-08-05 — antes decía que solo Wompi estaba implementado).
- `lib/domain/sla.ts` — targets de SLA de soporte; si tocas los tiempos, actualiza también la tabla en `SUPPORT.md` y en `docs/guia-usuario/*.html` (son **horas corridas**, no hábiles — ya hubo una vez texto que decía "horas hábiles" y no coincidía con el código).
- `docs/guia-usuario/` — guía de usuario ES/EN (HTML fuente + PDF generado), visible también **dentro de la app** en `/dashboard/ayuda` junto con una sección de tips (`lib/content/tips.ts`).

## Gotchas de UI ya resueltos (no los reintroduzcas)

- **`app/globals.css`**: `--font-sans` estuvo definida como `var(--font-sans)` (circular) en vez de `var(--font-geist-sans)` — toda la app caía al serif por defecto del navegador. Si tocas variables de fuente/tema, verifica que no vuelvan a autorreferenciarse.
- El sidebar del dashboard estuvo **oculto por completo en móvil** (`hidden md:flex`, sin alternativa) hasta el 2026-08-05 — ahora hay header + `Sheet` mobile en `dashboard-shell.tsx`. Si rediseñas la navegación, no quites la rama móvil.
- No había `loading.tsx`/`error.tsx`/`not-found.tsx` en ninguna ruta — ahora existen a nivel raíz, `(app)` y `(superadmin)`. Mantenlos si reestructuras esos segmentos.
- `/register` no verifica compra alguna (cualquiera que llegue ahí obtiene un consultorio con licencia completa) — por diseño, solo se llega vía el correo de Hotmart. **No vuelvas a exponer un link público hacia `/register`** desde `/login`, la demo, u otra página pública sin verificación.

## Dónde está cada cosa (el resto de los docs ya son confiables)

| Pregunta | Documento |
|---|---|
| ¿Cómo desplegar, qué variables de entorno, qué migraciones aplicar? | `DEPLOYMENT.md` |
| ¿Qué pasarelas de pago existen y cómo agregar una nueva? | `PAYMENT_PROVIDERS.md` |
| ¿Cómo funciona RLS, roles, cifrado, rate limiting? | `SECURITY.md` |
| ¿Qué normativa colombiana aplica y qué documentos de consentimiento existen? | `PRIVACY.md`, `LEGAL_CHECKLIST_COLOMBIA.md` |
| ¿Cómo opera el panel de superadmin? | `ADMIN_MANUAL.md` |
| ¿Qué ve un cliente final del producto? | `USER_MANUAL.md` (espejo de `docs/guia-usuario/`) |
| ¿SLA y qué pasa si vence el plan? | `SUPPORT.md` |
| ¿Cómo funciona la demo comercial? | `SALES_DEMO.md` |
| ¿Temas visuales, componentes, tipografía? | `DESIGN_SYSTEM.md` |
| ¿Política de backups? | `BACKUP_POLICY.md` (honesto: la política de 30 días es roadmap, no una garantía activa hoy) |
| ¿Integración con Hotmart/landing/afiliados? | ver `seiton/` — repo aparte, no está documentado en este repo |

`README.md` es el boilerplate de `create-next-app`, sin actualizar — ignóralo como fuente de verdad del producto.
