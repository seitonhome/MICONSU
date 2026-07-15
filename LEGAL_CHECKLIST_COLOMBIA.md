# Checklist legal Colombia — Mi Consultorio Pro

**Este documento no sustituye asesoría jurídica, sanitaria, contable ni regulatoria real.** Es un checklist editable pensado para que cada consultorio identifique qué normas colombianas podrían aplicarle según su tipo de práctica, y lo marque a medida que valida su propio cumplimiento con un asesor competente. Mi Consultorio Pro provee herramientas técnicas (consentimientos versionados, evidencia de aceptación, disclaimers configurables, cifrado de credenciales) pero **cada consultorio o profesional es responsable de validar sus propias obligaciones legales, sanitarias, tributarias, profesionales y de protección de datos**.

## Disclaimer base para medicina alternativa e integrativa

Todo consultorio de medicina alternativa, integrativa o de terapias complementarias configurado en el sistema debe tener visible el siguiente disclaimer (o uno equivalente ajustado a su servicio, revisado por su propio asesor):

> "Este servicio puede ser complementario y no reemplaza una valoración médica, odontológica, psicológica o psiquiátrica cuando esta sea necesaria. Cada profesional es responsable del alcance, formación, habilitación y cumplimiento normativo de los servicios que ofrece."

Este texto corresponde al tipo de documento `alternative_medicine_disclaimer` en `consent_documents` y debe presentarse y aceptarse (quedando registrado en `consent_records`) antes o durante la reserva de un servicio de ese tipo.

## Checklist por norma

- [ ] **Ley 1581 de 2012** — Régimen general de protección de datos personales. *Implica*: tener un aviso de privacidad y autorización de tratamiento de datos, informar la finalidad del tratamiento, y habilitar los derechos del titular (conocer, actualizar, rectificar, revocar). Ver `PRIVACY.md`.

- [ ] **Decreto 1377 de 2013** — Reglamentario de la Ley 1581 de 2012. *Implica*: que las autorizaciones de tratamiento de datos cumplan los requisitos formales (previa, expresa e informada), y que exista un procedimiento para atender consultas y reclamos del titular.

- [ ] **Decreto 1074 de 2015** — Decreto Único Reglamentario del Sector Comercio, Industria y Turismo. *Implica*: cumplir las disposiciones de protección de datos incorporadas en este decreto único, que consolida la normativa aplicable.

- [ ] **Decreto 886 de 2014** — Reglamenta el Registro Nacional de Bases de Datos (RNBD). *Implica*: evaluar si el consultorio debe inscribir sus bases de datos de pacientes ante la Superintendencia de Industria y Comercio.

- [ ] **Resolución 1995 de 1999** — Normas para el manejo de la historia clínica. *Implica*: conservación, custodia, confidencialidad y tiempos mínimos de retención de la historia clínica. Recordatorio: el módulo clínico de este sistema **no es una historia clínica oficial interoperable** en su estado actual — es un registro interno del profesional.

- [ ] **Resolución 839 de 2017** — *Implica*: validar si esta resolución aplica al tipo específico de servicio o trámite administrativo/sanitario del consultorio.

- [ ] **Ley 2015 de 2020** — Historia clínica electrónica interoperable. *Implica*: entender que la ley exige avanzar hacia interoperabilidad de historias clínicas a nivel nacional; este sistema no cumple ese estándar de interoperabilidad hoy.

- [ ] **Resolución 866 de 2021** — Reglamenta la Historia Clínica Electrónica Interoperable. *Implica*: mismo punto anterior — validar si el consultorio, por su naturaleza (IPS, profesional independiente, etc.), tiene obligación de reportar/integrar con el sistema nacional.

- [ ] **Resolución 1888 de 2025** — *Implica*: validar con el asesor normativo del consultorio los requisitos vigentes que introduce esta resolución para el tipo de servicio ofrecido.

- [ ] **Resolución 2654 de 2019** — Telesalud y teleorientación. *Implica*: si el consultorio ofrece teleconsulta, cumplir los requisitos técnicos, de consentimiento informado específico y de habilitación para prestar servicios de salud a distancia.

- [ ] **Resolución 2927 de 1998** — Práctica de terapias alternativas/complementarias. *Implica*: para consultorios de medicina alternativa (homeopatía, acupuntura/MTC, ayurveda, naturopatía, terapia neural, quiropraxia, osteopatía, biomagnetismo, bioenergética, reiki, biosanación/biodescodificación, etc.), validar habilitación y alcance permitido de la práctica.

- [ ] **Resolución 3100 de 2019** — Habilitación de servicios de salud. *Implica*: si el consultorio presta servicios de salud formalmente habilitables, confirmar que cuenta con la habilitación correspondiente ante la autoridad sanitaria territorial — el sistema no valida ni verifica esta habilitación por sí mismo.

## Cómo usar este checklist en la práctica

1. Cada consultorio revisa, con su propio asesor, cuáles de las normas anteriores le aplican según su tipo de práctica (`practitioner_type`) y los servicios que efectivamente presta.
2. Los textos de `consent_documents` (política de privacidad, autorización de datos, autorización de datos sensibles, consentimiento informado, consentimiento de teleconsulta, disclaimers) se editan desde `/dashboard/consentimientos` para reflejar el resultado de esa revisión — el sistema no genera el contenido legal por sí mismo, solo lo versiona, lo presenta y guarda evidencia de aceptación.
3. Este checklist se puede volver a marcar cada vez que cambie la normativa vigente o el alcance de servicios del consultorio.

**Recordatorio final:** ni este checklist, ni `PRIVACY.md`, ni ningún otro documento de este repositorio constituyen asesoría jurídica, sanitaria, contable o regulatoria. Son una guía de referencia basada en la lista normativa entregada por el dueño del producto, no una validación legal.
