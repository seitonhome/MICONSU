-- ============================================================================
-- Seed: Demo comercial — Odontología
-- "Sonrisa Studio" — usado por /demo/odontologo.
-- ============================================================================

insert into public.clinics (
  id, slug, commercial_name, legal_name, description, contact_email, contact_phone,
  whatsapp_number, primary_practitioner_type, label_overrides, legal_disclaimer,
  is_demo, is_published
) values (
  '33333333-3333-3333-3333-333333333301',
  'sonrisa-studio-demo',
  'Sonrisa Studio',
  'Sonrisa Studio SAS',
  'Clínica odontológica con enfoque estético: ortodoncia, blanqueamiento y diseño de sonrisa.',
  'contacto@sonrisastudio-demo.co',
  '+57 300 555 0301',
  '+57 300 555 0301',
  'odontologo',
  '{"patient":"paciente","appointment":"tratamiento","clinical_note":"plan odontológico"}'::jsonb,
  'Cada tratamiento odontológico requiere una valoración previa. Los resultados pueden variar según cada caso.',
  true,
  true
)
on conflict (id) do nothing;

insert into public.clinic_branding (clinic_id, primary_color, secondary_color, visual_theme, font_style) values
  ('33333333-3333-3333-3333-333333333301', '#2E6E7E', '#EAF6F2', 'odontologico_premium', 'default')
on conflict (clinic_id) do nothing;

insert into public.clinic_locations (id, clinic_id, name, address, city, country, is_virtual, is_active) values
  ('33333333-3333-3333-3333-333333333310', '33333333-3333-3333-3333-333333333301', 'Sonrisa Studio', 'Calle 100 # 19-45, Consultorio 501', 'Bogotá', 'CO', false, true)
on conflict (id) do nothing;

insert into public.professionals (
  id, clinic_id, profile_id, slug, practitioner_type, full_name, specialty_label, bio,
  accepts_virtual, accepts_in_person, is_active
) values (
  '33333333-3333-3333-3333-333333333320', '33333333-3333-3333-3333-333333333301', null,
  'valeria-nino', 'ortodoncista', 'Dra. Valeria Niño', 'Odontología estética y ortodoncia',
  'Odontóloga especialista en ortodoncia y diseño de sonrisa, con más de 10 años de experiencia.',
  false, true, true
)
on conflict (id) do nothing;

insert into public.service_categories (id, clinic_id, name, sort_order) values
  ('33333333-3333-3333-3333-333333333330', '33333333-3333-3333-3333-333333333301', 'Valoración y limpieza', 1),
  ('33333333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333301', 'Estética y ortodoncia', 2)
on conflict (id) do nothing;

insert into public.services (
  id, clinic_id, category_id, name, description, classification, duration_minutes, price,
  price_visible, requires_payment, payment_type, deposit_amount, modality, default_location_id,
  color_hex, requires_additional_consent, min_advance_hours, max_cancel_hours, is_active,
  pre_instructions, post_message, disclaimer, max_group_capacity, allows_package
) values
  (
    '33333333-3333-3333-3333-333333333340', '33333333-3333-3333-3333-333333333301', '33333333-3333-3333-3333-333333333330',
    'Valoración odontológica', 'Primera cita de valoración general y diagnóstico.',
    'servicio_salud_habilitado', 30, 60000, true, true, 'deposit', 20000,
    'in_person', '33333333-3333-3333-3333-333333333310', '#2E6E7E', false, 6, 24, true,
    null, 'Con tu valoración lista, te compartiremos el plan de tratamiento recomendado.', null, null, false
  ),
  (
    '33333333-3333-3333-3333-333333333341', '33333333-3333-3333-3333-333333333301', '33333333-3333-3333-3333-333333333330',
    'Limpieza dental', 'Profilaxis y limpieza dental profesional.',
    'servicio_salud_habilitado', 45, 90000, true, true, 'deposit', 30000,
    'in_person', '33333333-3333-3333-3333-333333333310', '#2E6E7E', false, 12, 24, true,
    null, 'Evita alimentos muy fríos o calientes las próximas horas.', null, null, false
  ),
  (
    '33333333-3333-3333-3333-333333333342', '33333333-3333-3333-3333-333333333301', '33333333-3333-3333-3333-333333333331',
    'Control de ortodoncia', 'Cita de control y ajuste de brackets o alineadores.',
    'servicio_salud_habilitado', 30, 100000, true, true, 'deposit', 30000,
    'in_person', '33333333-3333-3333-3333-333333333310', '#4FA3A3', false, 12, 24, true,
    null, 'Tu próximo control queda sugerido automáticamente.', null, null, true
  ),
  (
    '33333333-3333-3333-3333-333333333343', '33333333-3333-3333-3333-333333333301', '33333333-3333-3333-3333-333333333331',
    'Diseño de sonrisa', 'Valoración y plan personalizado de diseño de sonrisa.',
    'servicio_salud_habilitado', 60, 250000, true, true, 'deposit', 80000,
    'in_person', '33333333-3333-3333-3333-333333333310', '#C9A227', true, 24, 48, true,
    'Trae fotos de referencia si las tienes.', 'En unos días te compartiremos tu simulación de sonrisa.', null, null, false
  )
on conflict (id) do nothing;

insert into public.professional_services (clinic_id, professional_id, service_id)
select '33333333-3333-3333-3333-333333333301', '33333333-3333-3333-3333-333333333320', s.id
from public.services s where s.clinic_id = '33333333-3333-3333-3333-333333333301'
on conflict do nothing;

insert into public.availability_rules (clinic_id, professional_id, location_id, day_of_week, start_time, end_time, buffer_minutes)
select '33333333-3333-3333-3333-333333333301', '33333333-3333-3333-3333-333333333320', '33333333-3333-3333-3333-333333333310',
  d, t.start_time, t.end_time, 10
from generate_series(1, 5) as d
cross join (values ('09:00'::time, '13:00'::time), ('14:00'::time, '19:00'::time)) as t(start_time, end_time);

insert into public.patients (id, clinic_id, full_name, document_type, document_number, email, phone, city, status) values
  ('33333333-3333-3333-3333-333333333340', '33333333-3333-3333-3333-333333333301', 'Mariana Salazar Peña', 'CC', '1080808080', 'mariana.salazar.demo@example.com', '+57 317 555 0310', 'Bogotá', 'active'),
  ('33333333-3333-3333-3333-333333333341', '33333333-3333-3333-3333-333333333301', 'Juan Pablo Herrera', 'CC', '1090909090', 'juanpablo.herrera.demo@example.com', '+57 318 555 0311', 'Bogotá', 'active'),
  ('33333333-3333-3333-3333-333333333342', '33333333-3333-3333-3333-333333333301', 'Isabella Cárdenas Ruiz', 'CC', '1100101010', 'isabella.cardenas.demo@example.com', '+57 319 555 0312', 'Bogotá', 'active')
on conflict (id) do nothing;

insert into public.consent_documents (id, clinic_id, document_type, title, body, version, is_active) values
  ('33333333-3333-3333-3333-333333333370', '33333333-3333-3333-3333-333333333301', 'privacy_policy', 'Política de tratamiento de datos personales', 'Sonrisa Studio trata tus datos personales conforme a la Ley 1581 de 2012 y sus decretos reglamentarios.', 1, true),
  ('33333333-3333-3333-3333-333333333371', '33333333-3333-3333-3333-333333333301', 'informed_consent_general', 'Consentimiento informado para tratamiento odontológico', 'Acepto el procedimiento odontológico descrito, sus alcances, riesgos y cuidados posteriores.', 1, true)
on conflict (id) do nothing;

insert into public.appointments (
  id, clinic_id, patient_id, professional_id, service_id, location_id, starts_at, ends_at,
  modality, status, price, deposit_required
) values
  ('33333333-3333-3333-3333-333333333350', '33333333-3333-3333-3333-333333333301', '33333333-3333-3333-3333-333333333340', '33333333-3333-3333-3333-333333333320', '33333333-3333-3333-3333-333333333341', '33333333-3333-3333-3333-333333333310', (current_date + time '10:00')::timestamptz, (current_date + time '10:45')::timestamptz, 'in_person', 'confirmed', 90000, 30000),
  ('33333333-3333-3333-3333-333333333351', '33333333-3333-3333-3333-333333333301', '33333333-3333-3333-3333-333333333341', '33333333-3333-3333-3333-333333333320', '33333333-3333-3333-3333-333333333343', '33333333-3333-3333-3333-333333333310', (current_date + time '16:00')::timestamptz, (current_date + time '17:00')::timestamptz, 'in_person', 'pending_payment', 250000, 80000),
  ('33333333-3333-3333-3333-333333333352', '33333333-3333-3333-3333-333333333301', '33333333-3333-3333-3333-333333333342', '33333333-3333-3333-3333-333333333320', '33333333-3333-3333-3333-333333333342', '33333333-3333-3333-3333-333333333310', (current_date + 2 + time '11:00')::timestamptz, (current_date + 2 + time '11:30')::timestamptz, 'in_person', 'confirmed', 100000, 30000),
  ('33333333-3333-3333-3333-333333333353', '33333333-3333-3333-3333-333333333301', '33333333-3333-3333-3333-333333333340', '33333333-3333-3333-3333-333333333320', '33333333-3333-3333-3333-333333333340', '33333333-3333-3333-3333-333333333310', (current_date - 10 + time '09:00')::timestamptz, (current_date - 10 + time '09:30')::timestamptz, 'in_person', 'completed', 60000, 20000)
on conflict (id) do nothing;

insert into public.consent_records (clinic_id, patient_id, document_id, document_version, appointment_id, acceptance_method) values
  ('33333333-3333-3333-3333-333333333301', '33333333-3333-3333-3333-333333333340', '33333333-3333-3333-3333-333333333370', 1, '33333333-3333-3333-3333-333333333350', 'web_form'),
  ('33333333-3333-3333-3333-333333333301', '33333333-3333-3333-3333-333333333340', '33333333-3333-3333-3333-333333333371', 1, '33333333-3333-3333-3333-333333333350', 'web_form');

insert into public.payment_providers (id, clinic_id, provider_key, display_name, is_active, is_sandbox) values
  ('33333333-3333-3333-3333-333333333360', '33333333-3333-3333-3333-333333333301', 'manual_transfer', 'Transferencia bancaria', true, false),
  ('33333333-3333-3333-3333-333333333361', '33333333-3333-3333-3333-333333333301', 'wompi', 'Wompi (tarjeta/PSE)', true, true)
on conflict (id) do nothing;

insert into public.payment_methods (clinic_id, payment_provider_id, label, instructions, sort_order) values
  ('33333333-3333-3333-3333-333333333301', '33333333-3333-3333-3333-333333333360', 'Transferencia bancaria', 'Transfiere a la cuenta indicada y adjunta tu comprobante.', 1),
  ('33333333-3333-3333-3333-333333333301', '33333333-3333-3333-3333-333333333361', 'Tarjeta o PSE (Wompi)', 'Pago automático e inmediato con confirmación instantánea.', 2);

insert into public.payment_intents (id, clinic_id, appointment_id, patient_id, service_id, payment_provider_id, kind, amount, status) values
  ('33333333-3333-3333-3333-333333333362', '33333333-3333-3333-3333-333333333301', '33333333-3333-3333-3333-333333333350', '33333333-3333-3333-3333-333333333340', '33333333-3333-3333-3333-333333333341', '33333333-3333-3333-3333-333333333361', 'deposit', 30000, 'approved')
on conflict (id) do nothing;

insert into public.payments (clinic_id, payment_intent_id, amount, method, status, paid_at) values
  ('33333333-3333-3333-3333-333333333301', '33333333-3333-3333-3333-333333333362', 30000, 'wompi', 'approved', now() - interval '2 days');

insert into public.licenses (clinic_id, license_type, professionals_allowed, locations_allowed, status, purchased_at) values
  ('33333333-3333-3333-3333-333333333301', 'esencial', 1, 1, 'active', now() - interval '15 days')
on conflict (clinic_id) do nothing;

insert into public.support_subscriptions (clinic_id, support_plan_id, status, started_at, ends_at)
select '33333333-3333-3333-3333-333333333301', sp.id, 'active', current_date - 15, current_date + 350
from public.support_plans sp where sp.plan_key = 'esencial'
on conflict (clinic_id) do nothing;

insert into public.demo_data_profiles (vertical_key, clinic_id, display_name, description, is_active) values
  ('odontologo', '33333333-3333-3333-3333-333333333301', 'Odontología · Sonrisa Studio', 'Demo de Sonrisa Studio: agenda, ortodoncia, pagos y página pública para odontología estética.', true)
on conflict (vertical_key) do nothing;
