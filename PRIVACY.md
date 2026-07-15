# Política de Privacidad y Tratamiento de Datos — Mi Consultorio Pro

**Aviso importante:** este documento describe cómo está construido el sistema y qué mecanismos ofrece para el tratamiento de datos personales. **No es asesoría jurídica.** Cada consultorio o profesional que usa Mi Consultorio Pro es responsable de validar sus propias obligaciones legales, sanitarias, tributarias, profesionales y de protección de datos ante las autoridades y normas aplicables en Colombia, y de adaptar sus propios avisos de privacidad, autorizaciones y políticas al contenido real de su práctica. Ver también `LEGAL_CHECKLIST_COLOMBIA.md`.

## 1. Qué datos personales recoge el sistema

Según el modelo de datos implementado (`supabase/migrations/`), el sistema puede recoger, para cada consultorio (`clinic_id`):

**Datos del paciente/consultante (`patients`):**
nombre completo, tipo y número de documento, correo electrónico, teléfono, fecha de nacimiento, ciudad, contacto de emergencia (nombre y teléfono).

**Datos del profesional (`professionals`, `professional_credentials`):**
nombre, tipo de práctica, biografía, foto, número de licencia/tarjeta profesional, credenciales y certificaciones (con soporte documental).

**Datos de la cita (`appointments` y relacionadas):**
servicio solicitado, profesional, sede o modalidad, fecha/hora, estado, historial de cambios de estado.

**Datos de pago (`payment_intents`, `payments`, `manual_payment_proofs`):**
monto, moneda, método, estado, comprobantes de transferencia subidos por el paciente, respuesta cruda de la pasarela de pago (`raw_provider_response`). **Las credenciales de la pasarela de pago del consultorio se cifran** (ver `SECURITY.md`); los datos de tarjeta del paciente, cuando aplica pasarela automática, no pasan por los servidores del sistema — se gestionan en el checkout externo de la pasarela.

**Documentos y notas (`patient_documents`, notas de paciente):**
archivos administrativos o clínicos asociados al paciente, marcados explícitamente como `is_clinical` para aplicar un nivel de protección más estricto.

**Evidencia de consentimiento (`consent_records`):**
documento aceptado, versión, fecha/hora, dirección IP, user-agent del navegador, método de aceptación (formulario web, portal del paciente, o registrado por el staff).

**Metadatos técnicos:**
dirección IP y user-agent en registros de auditoría (`audit_logs`, `consent_records`) y en webhooks de pago.

El sistema **no** tiene, en su Fase 1/2 actual, un módulo de historia clínica electrónica interoperable. Las notas clínicas que existen son un registro interno del profesional, no un expediente médico oficial en el sentido normativo (Resolución 1995 de 1999 y Resolución 866 de 2021).

## 2. Datos sensibles

Bajo la Ley 1581 de 2012 y el Decreto 1377 de 2013, los datos de salud, y en general cualquier información asociada a la atención en un consultorio médico, odontológico, psicológico/psiquiátrico o de terapias, se consideran **datos sensibles**. Esto incluye, como mínimo: el hecho de que una persona es paciente de un consultorio determinado, el tipo de servicio que recibe, y cualquier nota clínica asociada.

Por esa razón, el sistema aplica diseño defensivo en notificaciones: los recordatorios de citas usan copys neutrales ("tienes una cita programada") que **no mencionan la especialidad, el motivo de consulta ni el nombre del profesional cuando esto pudiera revelar información sensible** a un tercero que vea el celular o correo del paciente — mitigación explícita documentada en `docs/00-ARQUITECTURA-Y-PLAN.md` (riesgo #9).

## 3. Base legal y marco normativo colombiano

El tratamiento de datos personales en Mi Consultorio Pro debe enmarcarse, según corresponda a cada consultorio, en:

- **Ley 1581 de 2012** — Régimen general de protección de datos personales.
- **Decreto 1377 de 2013** — Reglamentario parcial de la Ley 1581 de 2012.
- **Decreto 1074 de 2015** — Decreto Único Reglamentario del Sector Comercio, Industria y Turismo (incorpora las normas de protección de datos).
- **Decreto 886 de 2014** — Reglamenta el Registro Nacional de Bases de Datos (RNBD).
- **Resolución 1995 de 1999** — Normas para el manejo de la historia clínica.
- **Resolución 839 de 2017** — (según corresponda al tipo de servicio prestado).
- **Ley 2015 de 2020** — Historia clínica electrónica interoperable.
- **Resolución 866 de 2021** — Reglamenta la Historia Clínica Electrónica Interoperable.
- **Resolución 1888 de 2025** — (normativa vigente aplicable al sector salud).
- **Resolución 2654 de 2019** — Telesalud y teleorientación.
- **Resolución 2927 de 1998** — Práctica de terapias alternativas/complementarias.
- **Resolución 3100 de 2019** — Habilitación de servicios de salud.

Cada consultorio decide, según su tipo de práctica y servicios, cuáles de estas normas le aplican y cómo cumplirlas — el sistema **provee las herramientas técnicas** (consentimientos versionados, evidencia de aceptación, disclaimers configurables) pero no determina por sí solo el cumplimiento legal de cada profesional.

## 4. Cómo se solicitan y registran los consentimientos

El sistema modela el consentimiento como dos tablas relacionadas:

- **`consent_documents`** — el texto vigente de cada tipo de documento (`document_type`: política de privacidad, autorización de datos, autorización de datos sensibles, consentimiento informado general, consentimiento de teleconsulta, consentimiento específico de servicio, política de cancelación, política de reembolso, términos y condiciones, disclaimer de medicina alternativa, disclaimer de bienestar, disclaimer no-clínico), versionado con un entero `version` que se incrementa cada vez que el consultorio edita el texto.
- **`consent_records`** — la aceptación concreta de un paciente: qué documento, qué versión exacta aceptó, cuándo, con qué IP y user-agent, y por qué método (`web_form` durante la reserva pública, `portal` desde el portal del paciente, o `staff_recorded` cuando el consultorio lo registra manualmente, por ejemplo para un paciente presencial sin acceso digital).

Esto permite, ante una auditoría o reclamo, demostrar exactamente qué texto aceptó el paciente y cuándo — no solo que "aceptó algo".

## 5. Derechos del titular de los datos

Conforme a la Ley 1581 de 2012, todo titular de datos personales (paciente/consultante) tiene derecho a:

- Conocer, actualizar y rectificar sus datos personales.
- Solicitar prueba de la autorización otorgada.
- Ser informado sobre el uso dado a sus datos.
- Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la ley.
- Revocar la autorización y/o solicitar la supresión del dato, salvo que exista un deber legal o contractual que impida su eliminación (por ejemplo, la conservación de historias clínicas conforme a la Resolución 1995 de 1999).
- Acceder gratuitamente a sus datos.

Cada consultorio, como responsable del tratamiento de los datos de sus pacientes, debe habilitar un canal para atender estas solicitudes. El sistema no automatiza hoy un flujo self-service de "descargar mis datos" o "eliminar mi cuenta" para el paciente — estas solicitudes, en el estado actual del producto, se gestionan manualmente por el consultorio con apoyo de su administrador de datos.

## 6. Responsabilidad del consultorio (aviso explícito)

Mi Consultorio Pro es una herramienta de software. **Cada consultorio o profesional que usa el sistema es responsable de validar sus propias obligaciones legales, sanitarias, tributarias, profesionales y de protección de datos** frente a sus pacientes, sus colegios/consejos profesionales y las autoridades colombianas competentes. Esto incluye, entre otros: registrar sus bases de datos ante el RNBD cuando corresponda, designar un oficial de protección de datos si aplica, contar con las autorizaciones sanitarias/habilitaciones necesarias para el tipo de servicio que ofrece, y redactar los textos de consentimiento con contenido jurídicamente correcto para su caso específico (el sistema permite editar los textos, pero no los redacta ni los valida legalmente).

**Este documento no constituye asesoría jurídica.** Para validar el cumplimiento normativo específico de un consultorio, se recomienda consultar con un abogado o asesor especializado en protección de datos y derecho de la salud en Colombia.
