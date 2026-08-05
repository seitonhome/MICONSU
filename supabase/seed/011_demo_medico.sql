-- ============================================================================
-- Seed: Demo comercial — Médico general
-- "Consultorio Vitalis" — usado por /demo/medico para mostrar el sistema a
-- prospectos del área médica. Mismo patrón que 010_demo_alternativa.sql.
-- ============================================================================

insert into public.clinics (
  id, slug, commercial_name, legal_name, description, contact_email, contact_phone,
  whatsapp_number, primary_practitioner_type, label_overrides, legal_disclaimer,
  is_demo, is_published
) values (
  '22222222-2222-2222-2222-222222222201',
  'consultorio-vitalis-demo',
  'Consultorio Vitalis',
  'Consultorio Vitalis SAS',
  'Consulta médica general y de control, con atención presencial y por teleconsulta.',
  'contacto@vitalis-demo.co',
  '+57 300 555 0201',
  '+57 300 555 0201',
  'medico_general',
  '{"patient":"paciente","appointment":"consulta","clinical_note":"historia clínica"}'::jsonb,
  'Este servicio es una consulta médica general y no reemplaza una valoración de urgencias cuando esta sea necesaria.',
  true,
  true
)
on conflict (id) do nothing;

insert into public.clinic_branding (clinic_id, primary_color, secondary_color, visual_theme, font_style) values
  ('22222222-2222-2222-2222-222222222201', '#0F4C4C', '#F5F1E8', 'clinico_moderno', 'default')
on conflict (clinic_id) do nothing;

insert into public.clinic_locations (id, clinic_id, name, address, city, country, is_virtual, is_active) values
  ('22222222-2222-2222-2222-222222222210', '22222222-2222-2222-2222-222222222201', 'Teleconsulta', null, 'Virtual', 'CO', true, true),
  ('22222222-2222-2222-2222-222222222211', '22222222-2222-2222-2222-222222222201', 'Consultorio Vitalis', 'Carrera 15 # 93-40, Consultorio 302', 'Bogotá', 'CO', false, true)
on conflict (id) do nothing;

insert into public.professionals (
  id, clinic_id, profile_id, slug, practitioner_type, full_name, specialty_label, bio,
  accepts_virtual, accepts_in_person, is_active
) values (
  '22222222-2222-2222-2222-222222222220', '22222222-2222-2222-2222-222222222201', null,
  'daniel-castano', 'medico_general', 'Dr. Daniel Castaño', 'Medicina General',
  'Médico general con enfoque en medicina preventiva y control de enfermedades crónicas.',
  true, true, true
)
on conflict (id) do nothing;

insert into public.service_categories (id, clinic_id, name, sort_order) values
  ('22222222-2222-2222-2222-222222222230', '22222222-2222-2222-2222-222222222201', 'Consultas', 1)
on conflict (id) do nothing;

insert into public.services (
  id, clinic_id, category_id, name, description, classification, duration_minutes, price,
  price_visible, requires_payment, payment_type, deposit_amount, modality, default_location_id,
  color_hex, requires_additional_consent, min_advance_hours, max_cancel_hours, is_active,
  pre_instructions, post_message, disclaimer, max_group_capacity, allows_package
) values
  (
    '22222222-2222-2222-2222-222222222240', '22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222230',
    'Primera consulta médica', 'Valoración médica general inicial.',
    'servicio_salud_habilitado', 30, 120000, true, true, 'deposit', 40000,
    'both', '22222222-2222-2222-2222-222222222211', '#0F4C4C', false, 6, 24, true,
    'Trae tus exámenes o fórmulas previas si tienes.', 'Recuerda seguir las indicaciones médicas entregadas en tu consulta.',
    null, null, false
  ),
  (
    '22222222-2222-2222-2222-222222222241', '22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222230',
    'Control médico', 'Consulta de seguimiento y control.',
    'servicio_salud_habilitado', 20, 80000, true, true, 'deposit', 30000,
    'both', '22222222-2222-2222-2222-222222222211', '#0F4C4C', false, 6, 24, true,
    null, 'Recuerda tu próximo control según la indicación médica.', null, null, false
  ),
  (
    '22222222-2222-2222-2222-222222222242', '22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222230',
    'Teleconsulta', 'Consulta médica general por videollamada.',
    'servicio_salud_habilitado', 20, 70000, true, true, 'full', null,
    'virtual', '22222222-2222-2222-2222-222222222210', '#3E7C7C', false, 3, 12, true,
    'Ten a la mano tu documento de identidad y una conexión estable a internet.', 'Gracias por tu consulta virtual.', null, null, false
  )
on conflict (id) do nothing;

insert into public.professional_services (clinic_id, professional_id, service_id)
select '22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222220', s.id
from public.services s where s.clinic_id = '22222222-2222-2222-2222-222222222201'
on conflict do nothing;

insert into public.availability_rules (clinic_id, professional_id, location_id, day_of_week, start_time, end_time, buffer_minutes)
select '22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222220', '22222222-2222-2222-2222-222222222211',
  d, t.start_time, t.end_time, 10
from generate_series(1, 5) as d
cross join (values ('07:00'::time, '12:00'::time), ('14:00'::time, '17:00'::time)) as t(start_time, end_time);

insert into public.patients (id, clinic_id, full_name, document_type, document_number, email, phone, city, status) values
  ('22222222-2222-2222-2222-222222222240', '22222222-2222-2222-2222-222222222201', 'Sofía Ramírez León', 'CC', '1050505050', 'sofia.ramirez.demo@example.com', '+57 314 555 0210', 'Bogotá', 'active'),
  ('22222222-2222-2222-2222-222222222241', '22222222-2222-2222-2222-222222222201', 'Carlos Andrés Mejía', 'CC', '1060606060', 'carlos.mejia.demo@example.com', '+57 315 555 0211', 'Bogotá', 'active'),
  ('22222222-2222-2222-2222-222222222242', '22222222-2222-2222-2222-222222222201', 'Valentina Ortiz Cruz', 'CC', '1070707070', 'valentina.ortiz.demo@example.com', '+57 316 555 0212', 'Bogotá', 'active')
on conflict (id) do nothing;

insert into public.consent_documents (id, clinic_id, document_type, title, body, version, is_active) values
  ('22222222-2222-2222-2222-222222222270', '22222222-2222-2222-2222-222222222201', 'privacy_policy', 'Política de tratamiento de datos personales', 'Consultorio Vitalis trata tus datos personales conforme a la Ley 1581 de 2012 y sus decretos reglamentarios.', 1, true),
  ('22222222-2222-2222-2222-222222222271', '22222222-2222-2222-2222-222222222201', 'informed_consent_general', 'Consentimiento informado general', 'Acepto la valoración médica general descrita y comprendo su alcance.', 1, true),
  ('22222222-2222-2222-2222-222222222272', '22222222-2222-2222-2222-222222222201', 'teleconsultation_consent', 'Consentimiento para teleconsulta', 'Acepto realizar mi consulta de forma virtual, entendiendo sus alcances y limitaciones.', 1, true)
on conflict (id) do nothing;

insert into public.appointments (
  id, clinic_id, patient_id, professional_id, service_id, location_id, starts_at, ends_at,
  modality, status, price, deposit_required
) values
  ('22222222-2222-2222-2222-222222222250', '22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222240', '22222222-2222-2222-2222-222222222220', '22222222-2222-2222-2222-222222222241', '22222222-2222-2222-2222-222222222211', (current_date + time '08:00')::timestamptz, (current_date + time '08:20')::timestamptz, 'in_person', 'confirmed', 80000, 30000),
  ('22222222-2222-2222-2222-222222222251', '22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222241', '22222222-2222-2222-2222-222222222220', '22222222-2222-2222-2222-222222222242', '22222222-2222-2222-2222-222222222210', (current_date + time '15:00')::timestamptz, (current_date + time '15:20')::timestamptz, 'virtual', 'pending_payment', 70000, 0),
  ('22222222-2222-2222-2222-222222222252', '22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222242', '22222222-2222-2222-2222-222222222220', '22222222-2222-2222-2222-222222222240', '22222222-2222-2222-2222-222222222211', (current_date + 1 + time '09:00')::timestamptz, (current_date + 1 + time '09:30')::timestamptz, 'in_person', 'confirmed', 120000, 40000),
  ('22222222-2222-2222-2222-222222222253', '22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222240', '22222222-2222-2222-2222-222222222220', '22222222-2222-2222-2222-222222222241', '22222222-2222-2222-2222-222222222211', (current_date - 7 + time '08:00')::timestamptz, (current_date - 7 + time '08:20')::timestamptz, 'in_person', 'completed', 80000, 30000),
  ('22222222-2222-2222-2222-222222222254', '22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222241', '22222222-2222-2222-2222-222222222220', '22222222-2222-2222-2222-222222222240', '22222222-2222-2222-2222-222222222211', (current_date - 3 + time '16:00')::timestamptz, (current_date - 3 + time '16:30')::timestamptz, 'in_person', 'no_show', 120000, 40000)
on conflict (id) do nothing;

insert into public.consent_records (clinic_id, patient_id, document_id, document_version, appointment_id, acceptance_method) values
  ('22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222240', '22222222-2222-2222-2222-222222222270', 1, '22222222-2222-2222-2222-222222222250', 'web_form'),
  ('22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222240', '22222222-2222-2222-2222-222222222271', 1, '22222222-2222-2222-2222-222222222250', 'web_form');

insert into public.payment_providers (id, clinic_id, provider_key, display_name, is_active, is_sandbox) values
  ('22222222-2222-2222-2222-222222222260', '22222222-2222-2222-2222-222222222201', 'manual_transfer', 'Transferencia bancaria', true, false),
  ('22222222-2222-2222-2222-222222222261', '22222222-2222-2222-2222-222222222201', 'wompi', 'Wompi (tarjeta/PSE)', true, true)
on conflict (id) do nothing;

insert into public.payment_methods (clinic_id, payment_provider_id, label, instructions, sort_order) values
  ('22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222260', 'Transferencia bancaria', 'Transfiere a la cuenta indicada y adjunta tu comprobante.', 1),
  ('22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222261', 'Tarjeta o PSE (Wompi)', 'Pago automático e inmediato con confirmación instantánea.', 2);

insert into public.payment_intents (id, clinic_id, appointment_id, patient_id, service_id, payment_provider_id, kind, amount, status) values
  ('22222222-2222-2222-2222-222222222262', '22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222250', '22222222-2222-2222-2222-222222222240', '22222222-2222-2222-2222-222222222241', '22222222-2222-2222-2222-222222222261', 'deposit', 30000, 'approved')
on conflict (id) do nothing;

insert into public.payments (clinic_id, payment_intent_id, amount, method, status, paid_at) values
  ('22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222262', 30000, 'wompi', 'approved', now() - interval '1 day');

insert into public.licenses (clinic_id, license_type, professionals_allowed, locations_allowed, status, purchased_at) values
  ('22222222-2222-2222-2222-222222222201', 'esencial', 1, 1, 'active', now() - interval '20 days')
on conflict (clinic_id) do nothing;

insert into public.support_subscriptions (clinic_id, support_plan_id, status, started_at, ends_at)
select '22222222-2222-2222-2222-222222222201', sp.id, 'active', current_date - 20, current_date + 345
from public.support_plans sp where sp.plan_key = 'esencial'
on conflict (clinic_id) do nothing;

insert into public.demo_data_profiles (vertical_key, clinic_id, display_name, description, is_active) values
  ('medico', '22222222-2222-2222-2222-222222222201', 'Médico general · Consultorio Vitalis', 'Demo de Consultorio Vitalis: agenda, teleconsulta, pagos y página pública para consulta médica general.', true)
on conflict (vertical_key) do nothing;
