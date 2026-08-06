-- Vincula cada ticket local con el ticket creado en el PQR central de
-- Seiton (lib/integrations/seiton-pqr.ts), para poder sincronizar su
-- estado cuando el equipo lo gestiona desde seitonhome.com/admin/pqr en
-- vez de (o además de) /admin/soporte de esta app.

alter table public.support_tickets
  add column seiton_ticket_id text;
