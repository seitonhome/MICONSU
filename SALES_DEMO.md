# Demo comercial — Mi Consultorio Pro

El sistema incluye un modo demo real (no capturas de pantalla ni un video): `/demo/[vertical]` redirige a la página pública de un consultorio sintético (`clinics.is_demo = true`) con datos de ejemplo ya cargados, funcionando con el mismo código que un consultorio real.

## 1. Cómo funciona técnicamente

`app/demo/[vertical]/page.tsx`:

1. Recibe un `vertical` en la URL (`medico`, `odontologo`, `psicologo`, `alternativa`, `bienestar`).
2. Busca en `demo_data_profiles` el consultorio demo activo (`is_active = true`) para ese vertical.
3. Si existe, registra la visita en `sales_demo_sessions` (guardando el `referrer` — de dónde vino el clic) y redirige a `/c/[clinicSlug]`, la página pública real de ese consultorio demo.
4. Si el vertical todavía no tiene demo activa, muestra una pantalla que ofrece la demo de medicina alternativa como alternativa y un botón para crear el propio consultorio (`/register`).

**Estado real hoy:** según la Fase 1 completada, la demo con datos cargados es la de **medicina alternativa** (vertical elegido por ser el más diferenciador frente a otros sistemas de agenda genéricos). Las demás verticales (médico, odontólogo, psicólogo, bienestar) están en el modelo de datos y en la ruta, pero su activación depende de que exista una fila `is_active = true` en `demo_data_profiles` para cada una — verifica en `/admin` (o directamente en la tabla) cuáles están cargadas antes de prometerlas en una llamada de ventas.

## 2. Los 5 verticales

| Vertical (`vertical_key`) | Público objetivo |
|---|---|
| `medico` | Médicos generales y especialistas |
| `odontologo` | Odontólogos y ortodoncistas |
| `psicologo` | Psicólogos y psiquiatras |
| `alternativa` | Medicina alternativa/integrativa (homeopatía, acupuntura, terapia neural, biomagnetismo, reiki, biosanación, etc. — ver `PRACTITIONER_TYPES` en `lib/auth/roles.ts`) |
| `bienestar` | Wellness, coaching, terapias corporales |

## 3. Cómo mostrar el flujo completo en una demo comercial

Como la demo corre sobre el mismo código y la misma base de datos que un consultorio real (solo marcada `is_demo = true`), se puede mostrar el recorrido completo sin necesidad de un ambiente aparte:

1. **Entrada** — comparte `tudominio.com/demo/alternativa` (o el vertical relevante para el prospecto). Esto simula cómo un paciente llega a la página pública del consultorio del prospecto.
2. **Página pública** (`/c/[clinicSlug]`) — muestra branding con el tema visual correspondiente (ver `DESIGN_SYSTEM.md`), servicios, profesionales y credenciales verificadas.
3. **Flujo de reserva** — elige servicio → profesional/sede → fecha/hora con slots reales calculados desde `availability_rules`. Es el mismo motor de disponibilidad que usará el consultorio del prospecto.
4. **Consentimientos** — muestra cómo se presenta el consentimiento informado o el disclaimer de medicina alternativa/no-clínico durante la reserva, relevante para verticales con más sensibilidad regulatoria.
5. **Pago** — muestra las opciones configuradas (transferencia manual, pago presencial, o Wompi en sandbox) sin necesidad de cobrar de verdad.
6. **Panel del consultorio** — si el prospecto quiere ver "el otro lado", inicia sesión con credenciales demo (si el proveedor las tiene preparadas) para mostrar `/dashboard`: agenda del día, pagos pendientes, panel de oportunidad comercial, reportes.

## 4. Qué mirar en el panel superadmin para gestionar demos

Desde `/admin`, el `super_admin` puede identificar los consultorios demo en `/admin/consultorios` (aparecen marcados con la etiqueta "Demo" junto a su slug y estado de publicación). `sales_demo_sessions` queda como registro de qué verticales generan más tráfico de demo y desde qué `referrer` — útil como métrica de qué canal de marketing convierte mejor a demo.

## 5. Recomendaciones para la llamada de ventas

- Usa siempre el vertical más cercano al tipo de práctica del prospecto — el sistema adapta lenguaje (paciente/consultante/cliente, cita/sesión/tratamiento) según `practitioner_type`, y eso es justamente lo que hace que la demo se sienta "hecha para él" y no una plantilla genérica.
- Si el prospecto es de un vertical sin demo activa todavía, muestra la demo de medicina alternativa explicando que el motor es el mismo (agenda, pagos, consentimientos, temas visuales) y que solo cambian los textos y el tema.
- No prometas funcionalidad de Fase 2/3 (WhatsApp, teleconsulta avanzada, portal de paciente, paquetes de sesiones, etc.) como si estuviera activa en la demo — revisa el plan de fases en `docs/00-ARQUITECTURA-Y-PLAN.md` §9 antes de una demo con un prospecto exigente.
