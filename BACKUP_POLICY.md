# Política de respaldo (backups) — Mi Consultorio Pro

## 1. Política objetivo

El objetivo de continuidad del producto, comunicado como parte del Plan Continuidad Clínica, es:

- **Backup diario** de la base de datos.
- **Retención de 30 días** de backups.
- **Backup externo semanal** (copia fuera del proveedor de base de datos primario).
- **Prueba de restauración trimestral**, documentada.
- **RPO (Recovery Point Objective) de 24 horas** — en el peor caso, no se pierde más de un día de datos.
- **RTO (Recovery Time Objective) de 24 horas** — en el peor caso, el sistema puede quedar restaurado en un día.

## 2. Estado real hoy (honesto, no aspiracional)

Es importante distinguir la política objetivo de lo que existe operando hoy:

- **Lo que existe realmente**: la base de datos corre sobre Supabase, cuyo backup automático gestionado (frecuencia y retención según el plan contratado del proyecto — Free/Pro/Team/Enterprise) es, hoy, el único mecanismo de respaldo en producción. Algunos planes de Supabase incluyen **Point-in-Time Recovery (PITR)**, que permite restaurar a un momento específico dentro de una ventana determinada por el plan.
- **Lo que existe en el esquema pero no está automatizado todavía**: la tabla `backup_logs` (`supabase/migrations/20260704160400_licensing_support.sql`) ya está creada para registrar backups (`backup_type`: `daily`, `weekly_external`, `manual_export`, `restore_test`; `status`: `success`, `failed`, `in_progress`; tamaño, duración, notas). `clinic_id = null` representa un backup de plataforma que cubre a todos los consultorios, y se muestra en el dashboard de cualquier `clinic_owner` como información de tranquilidad operativa. **Pero no hay hoy un job propio corriendo que genere backups adicionales y escriba en esta tabla automáticamente** — la tabla existe, lista para usarse, pero está vacía o depende de que alguien la alimente manualmente.

En otras palabras: la política de 30 días de retención, el backup externo semanal y la prueba de restauración trimestral son **roadmap**, no una garantía operativa activa hoy. Lo único que protege los datos en este momento son los backups gestionados de Supabase según el plan contratado.

## 3. Qué falta para cerrar la brecha entre política y realidad

Para que este documento describa una operación real en vez de un objetivo, hace falta:

1. Confirmar el plan de Supabase contratado y si incluye PITR, y con qué ventana de retención.
2. Configurar un job (Edge Function, cron externo, o script programado) que:
   - Genere una exportación adicional (ej. `pg_dump` o export gestionado) al menos semanalmente.
   - La almacene en un destino externo a Supabase (otro proveedor de almacenamiento, para no depender de un solo proveedor).
   - Registre el resultado (éxito/fallo, tamaño, duración) en `backup_logs`.
3. Programar y documentar una prueba de restauración real cada trimestre, registrada también en `backup_logs` con `backup_type = 'restore_test'`.
4. Definir y probar el procedimiento de restauración (RTO de 24h) — hoy no está documentado ni ensayado.

## 4. Qué puede ver un consultorio hoy

Desde el dashboard de soporte (`/dashboard/soporte`), la sección de continuidad muestra el estado de licencia y suscripción de soporte del consultorio. Los registros de `backup_logs` con `clinic_id = null` (backups de plataforma) son visibles para cualquier `clinic_owner` vía RLS (política `backup_logs_select`), pensados como evidencia comercial de "tu información está respaldada" — pero, de nuevo, esa tabla depende de que exista un proceso que la llene; hoy debe tratarse como el registro futuro de un proceso, no como prueba actual de que el backup semanal externo ya está corriendo.

## 5. Recomendación mientras se cierra la brecha

Hasta que el job de backup propio esté implementado, cualquier consultorio con datos críticos (especialmente notas clínicas o historial de pagos) debería considerar exportar manualmente sus datos con cierta periodicidad (`/dashboard/reportes` permite exportar a CSV) como capa adicional de seguridad, sin depender únicamente del backup gestionado del proveedor de base de datos.
