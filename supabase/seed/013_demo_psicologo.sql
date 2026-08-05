-- ============================================================================
-- Seed: Demo comercial — Psicología
-- "Mente Clara" — usado por /demo/psicologo.
-- ============================================================================

insert into public.clinics (
  id, slug, commercial_name, legal_name, description, contact_email, contact_phone,
  whatsapp_number, primary_practitioner_type, label_overrides, legal_disclaimer,
  is_demo, is_published
) values (
  '44444444-4444-4444-4444-444444444401',
  'mente-clara-demo',
  'Mente Clara',
  'Mente Clara SAS',
  'Consulta psicológica individual y de pareja, presencial y virtual.',
  'contacto@menteclara-demo.co',
  '+57 300 555 0401',
  '+57 300 555 0401',
  'psicologo',
  '{"patient":"paciente","appointment":"sesión","clinical_note":"evolución"}'::jsonb,
  'Este servicio es un acompañamiento psicológico y no reemplaza una valoración psiquiátrica cuando esta sea necesaria.',
  true,
  true
)
on conflict (id) do nothing;

insert into public.clinic_branding (clinic_id, primary_color, secondary_color, visual_theme, font_style) values
  ('44444444-4444-4444-4444-444444444401', '#6B5B95', '#F2EEE7', 'terapeutico_emocional', 'default')
on conflict (clinic_id) do nothing;

insert into public.clinic_locations (id, clinic_id, name, address, city, country, is_virtual, is_active) values
  ('44444444-4444-4444-4444-444444444410', '44444444-4444-4444-4444-444444444401', 'Sesiones en línea', null, 'Virtual', 'CO', true, true),
  ('44444444-4444-4444-4444-444444444411', '44444444-4444-4444-4444-444444444401', 'Mente Clara', 'Calle 70 # 9-30, Consultorio 204', 'Bogotá', 'CO', false, true)
on conflict (id) do nothing;

insert into public.professionals (
  id, clinic_id, profile_id, slug, practitioner_type, full_name, specialty_label, bio,
  accepts_virtual, accepts_in_person, is_active
) values (
  '44444444-4444-4444-4444-444444444420', '44444444-4444-4444-4444-444444444401', null,
  'natalia-perez', 'psicologo', 'Natalia Pérez', 'Psicología clínica',
  'Psicóloga clínica especializada en ansiedad, duelo y terapia de pareja.',
  true, true, true
)
on conflict (id) do nothing;

insert into public.service_categories (id, clinic_id, name, sort_order) values
  ('44444444-4444-4444-4444-444444444430', '44444444-4444-4444-4444-444444444401', 'Sesiones individuales', 1),
  ('44444444-4444-4444-4444-444444444431', '44444444-4444-4444-4444-444444444401', 'Terapia de pareja', 2)
on conflict (id) do nothing;

insert into public.services (
  id, clinic_id, category_id, name, description, classification, duration_minutes, price,
  price_visible, requires_payment, payment_type, deposit_amount, modality, default_location_id,
  color_hex, requires_additional_consent, min_advance_hours, max_cancel_hours, is_active,
  pre_instructions, post_message, disclaimer, max_group_capacity, allows_package
) values
  (
    '44444444-4444-4444-4444-444444444440', '44444444-4444-4444-4444-444444444401', '44444444-4444-4444-4444-444444444430',
    'Primera sesión', 'Sesión inicial para conocer tu proceso y definir objetivos.',
    'servicio_salud_habilitado', 50, 130000, true, true, 'deposit', 40000,
    'both', '44444444-4444-4444-4444-444444444410', '#6B5B95', true, 12, 24, true,
    'Busca un espacio privado y tranquilo para tu sesión.', 'Gracias por tu apertura en esta primera sesión.', null, null, true
  ),
  (
    '44444444-4444-4444-4444-444444444441', '44444444-4444-4444-4444-444444444401', '44444444-4444-4444-4444-444444444430',
    'Sesión individual', 'Sesión de seguimiento del proceso terapéutico.',
    'servicio_salud_habilitado', 50, 120000, true, true, 'deposit', 40000,
    'both', '44444444-4444-4444-4444-444444444410', '#6B5B95', false, 12, 24, true,
    null, 'Recuerda registrar tus reflexiones antes de tu próxima sesión.', null, null, true
  ),
  (
    '44444444-4444-4444-4444-444444444442', '44444444-4444-4444-4444-444444444401', '44444444-4444-4444-4444-444444444431',
    'Terapia de pareja', 'Sesión conjunta enfocada en comunicación y vínculo.',
    'servicio_salud_habilitado', 60, 170000, true, true, 'deposit', 50000,
    'both', '44444444-4444-4444-4444-444444444411', '#9C89B8', true, 24, 24, true,
    null, 'Gracias por su compromiso con el proceso.', null, null, false
  )
on conflict (id) do nothing;

insert into public.professional_services (clinic_id, professional_id, service_id)
select '44444444-4444-4444-4444-444444444401', '44444444-4444-4444-4444-444444444420', s.id
from public.services s where s.clinic_id = '44444444-4444-4444-4444-444444444401'
on conflict do nothing;

insert into public.availability_rules (clinic_id, professional_id, location_id, day_of_week, start_time, end_time, buffer_minutes)
select '44444444-4444-4444-4444-444444444401', '44444444-4444-4444-4444-444444444420', '44444444-4444-4444-4444-444444444410',
  d, t.start_time, t.end_time, 10
from generate_series(1, 5) as d
cross join (values ('08:00'::time, '12:00'::time), ('13:00'::time, '18:00'::time)) as t(start_time, end_time);

insert into public.patients (id, clinic_id, full_name, document_type, document_number, email, phone, city, status) values
  ('44444444-4444-4444-4444-444444444440', '44444444-4444-4444-4444-444444444401', 'Daniela Vargas Soto', 'CC', '1110202020', 'daniela.vargas.demo@example.com', '+57 320 555 0410', 'Bogotá', 'active'),
  ('44444444-4444-4444-4444-444444444441', '44444444-4444-4444-4444-444444444401', 'Santiago Beltrán Ríos', 'CC', '1120303030', 'santiago.beltran.demo@example.com', '+57 321 555 0411', 'Bogotá', 'active'),
  ('44444444-4444-4444-4444-444444444442', '44444444-4444-4444-4444-444444444401', 'Paula Andrea Molina', 'CC', '1130404040', 'paula.molina.demo@example.com', '+57 322 555 0412', 'Bogotá', 'active')
on conflict (id) do nothing;

insert into public.consent_documents (id, clinic_id, document_type, title, body, version, is_active) values
  ('44444444-4444-4444-4444-444444444470', '44444444-4444-4444-4444-444444444401', 'privacy_policy', 'Política de tratamiento de datos personales', 'Mente Clara trata tus datos personales conforme a la Ley 1581 de 2012 y sus decretos reglamentarios.', 1, true),
  ('44444444-4444-4444-4444-444444444471', '44444444-4444-4444-4444-444444444401', 'informed_consent_general', 'Consentimiento informado para acompañamiento psicológico', 'Acepto el proceso de acompañamiento psicológico descrito y comprendo su alcance y confidencialidad.', 1, true),
  ('44444444-4444-4444-4444-444444444472', '44444444-4444-4444-4444-444444444401', 'teleconsultation_consent', 'Consentimiento para sesión virtual', 'Acepto realizar mi sesión de forma virtual, entendiendo sus alcances y limitaciones.', 1, true)
on conflict (id) do nothing;

insert into public.appointments (
  id, clinic_id, patient_id, professional_id, service_id, location_id, starts_at, ends_at,
  modality, status, price, deposit_required
) values
  ('44444444-4444-4444-4444-444444444450', '44444444-4444-4444-4444-444444444401', '44444444-4444-4444-4444-444444444440', '44444444-4444-4444-4444-444444444420', '44444444-4444-4444-4444-444444444441', '44444444-4444-4444-4444-444444444410', (current_date + time '09:00')::timestamptz, (current_date + time '09:50')::timestamptz, 'virtual', 'confirmed', 120000, 40000),
  ('44444444-4444-4444-4444-444444444451', '44444444-4444-4444-4444-444444444401', '44444444-4444-4444-4444-444444444441', '44444444-4444-4444-4444-444444444420', '44444444-4444-4444-4444-444444444440', '44444444-4444-4444-4444-444444444411', (current_date + time '14:00')::timestamptz, (current_date + time '14:50')::timestamptz, 'in_person', 'pending_payment', 130000, 40000),
  ('44444444-4444-4444-4444-444444444452', '44444444-4444-4444-4444-444444444401', '44444444-4444-4444-4444-444444444442', '44444444-4444-4444-4444-444444444420', '44444444-4444-4444-4444-444444444442', '44444444-4444-4444-4444-444444444411', (current_date + 3 + time '17:00')::timestamptz, (current_date + 3 + time '18:00')::timestamptz, 'in_person', 'confirmed', 170000, 50000),
  ('44444444-4444-4444-4444-444444444453', '44444444-4444-4444-4444-444444444401', '44444444-4444-4444-4444-444444444440', '44444444-4444-4444-4444-444444444420', '44444444-4444-4444-4444-444444444441', '44444444-4444-4444-4444-444444444410', (current_date - 7 + time '09:00')::timestamptz, (current_date - 7 + time '09:50')::timestamptz, 'virtual', 'completed', 120000, 40000)
on conflict (id) do nothing;

insert into public.consent_records (clinic_id, patient_id, document_id, document_version, appointment_id, acceptance_method) values
  ('44444444-4444-4444-4444-444444444401', '44444444-4444-4444-4444-444444444440', '44444444-4444-4444-4444-444444444470', 1, '44444444-4444-4444-4444-444444444450', 'web_form'),
  ('44444444-4444-4444-4444-444444444401', '44444444-4444-4444-4444-444444444440', '44444444-4444-4444-4444-444444444471', 1, '44444444-4444-4444-4444-444444444450', 'web_form'),
  ('44444444-4444-4444-4444-444444444401', '44444444-4444-4444-4444-444444444440', '44444444-4444-4444-4444-444444444472', 1, '44444444-4444-4444-4444-444444444450', 'web_form');

insert into public.payment_providers (id, clinic_id, provider_key, display_name, is_active, is_sandbox) values
  ('44444444-4444-4444-4444-444444444460', '44444444-4444-4444-4444-444444444401', 'manual_transfer', 'Transferencia bancaria', true, false),
  ('44444444-4444-4444-4444-444444444461', '44444444-4444-4444-4444-444444444401', 'wompi', 'Wompi (tarjeta/PSE)', true, true)
on conflict (id) do nothing;

insert into public.payment_methods (clinic_id, payment_provider_id, label, instructions, sort_order) values
  ('44444444-4444-4444-4444-444444444401', '44444444-4444-4444-4444-444444444460', 'Transferencia bancaria', 'Transfiere a la cuenta indicada y adjunta tu comprobante.', 1),
  ('44444444-4444-4444-4444-444444444401', '44444444-4444-4444-4444-444444444461', 'Tarjeta o PSE (Wompi)', 'Pago automático e inmediato con confirmación instantánea.', 2);

insert into public.payment_intents (id, clinic_id, appointment_id, patient_id, service_id, payment_provider_id, kind, amount, status) values
  ('44444444-4444-4444-4444-444444444462', '44444444-4444-4444-4444-444444444401', '44444444-4444-4444-4444-444444444450', '44444444-4444-4444-4444-444444444440', '44444444-4444-4444-4444-444444444441', '44444444-4444-4444-4444-444444444461', 'deposit', 40000, 'approved')
on conflict (id) do nothing;

insert into public.payments (clinic_id, payment_intent_id, amount, method, status, paid_at) values
  ('44444444-4444-4444-4444-444444444401', '44444444-4444-4444-4444-444444444462', 40000, 'wompi', 'approved', now() - interval '1 day');

insert into public.licenses (clinic_id, license_type, professionals_allowed, locations_allowed, status, purchased_at) values
  ('44444444-4444-4444-4444-444444444401', 'profesional', 3, 1, 'active', now() - interval '25 days')
on conflict (clinic_id) do nothing;

insert into public.support_subscriptions (clinic_id, support_plan_id, status, started_at, ends_at)
select '44444444-4444-4444-4444-444444444401', sp.id, 'active', current_date - 25, current_date + 340
from public.support_plans sp where sp.plan_key = 'profesional'
on conflict (clinic_id) do nothing;

insert into public.demo_data_profiles (vertical_key, clinic_id, display_name, description, is_active) values
  ('psicologo', '44444444-4444-4444-4444-444444444401', 'Psicología · Mente Clara', 'Demo de Mente Clara: agenda, sesiones virtuales y presenciales, pagos y página pública para psicología.', true)
on conflict (vertical_key) do nothing;
