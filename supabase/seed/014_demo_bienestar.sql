-- ============================================================================
-- Seed: Demo comercial — Centro de bienestar
-- "Raíz Bienestar" — usado por /demo/bienestar (masajes y terapias corporales).
-- ============================================================================

insert into public.clinics (
  id, slug, commercial_name, legal_name, description, contact_email, contact_phone,
  whatsapp_number, primary_practitioner_type, label_overrides, legal_disclaimer,
  is_demo, is_published
) values (
  '55555555-5555-5555-5555-555555555501',
  'raiz-bienestar-demo',
  'Raíz Bienestar',
  'Raíz Bienestar SAS',
  'Centro de bienestar con masajes terapéuticos, relajación y experiencias corporales.',
  'contacto@raizbienestar-demo.co',
  '+57 300 555 0501',
  '+57 300 555 0501',
  'terapias_corporales_masajes',
  '{"patient":"cliente","appointment":"experiencia","clinical_note":"registro de sesión"}'::jsonb,
  'Este servicio es una experiencia de bienestar complementaria y no reemplaza una valoración médica cuando esta sea necesaria.',
  true,
  true
)
on conflict (id) do nothing;

insert into public.clinic_branding (clinic_id, primary_color, secondary_color, visual_theme, font_style) values
  ('55555555-5555-5555-5555-555555555501', '#3F7256', '#EFE7D8', 'integrativo', 'default')
on conflict (clinic_id) do nothing;

insert into public.clinic_locations (id, clinic_id, name, address, city, country, is_virtual, is_active) values
  ('55555555-5555-5555-5555-555555555510', '55555555-5555-5555-5555-555555555501', 'Raíz Bienestar', 'Carrera 11 # 82-15', 'Bogotá', 'CO', false, true)
on conflict (id) do nothing;

insert into public.professionals (
  id, clinic_id, profile_id, slug, practitioner_type, full_name, specialty_label, bio,
  accepts_virtual, accepts_in_person, is_active
) values (
  '55555555-5555-5555-5555-555555555520', '55555555-5555-5555-5555-555555555501', null,
  'camila-restrepo', 'terapias_corporales_masajes', 'Camila Restrepo', 'Terapias corporales y masajes',
  'Terapeuta corporal especializada en masajes de relajación y liberación de tensión muscular.',
  false, true, true
)
on conflict (id) do nothing;

insert into public.service_categories (id, clinic_id, name, sort_order) values
  ('55555555-5555-5555-5555-555555555530', '55555555-5555-5555-5555-555555555501', 'Experiencias individuales', 1),
  ('55555555-5555-5555-5555-555555555531', '55555555-5555-5555-5555-555555555501', 'Programas grupales', 2)
on conflict (id) do nothing;

insert into public.services (
  id, clinic_id, category_id, name, description, classification, duration_minutes, price,
  price_visible, requires_payment, payment_type, deposit_amount, modality, default_location_id,
  color_hex, requires_additional_consent, min_advance_hours, max_cancel_hours, is_active,
  pre_instructions, post_message, disclaimer, max_group_capacity, allows_package
) values
  (
    '55555555-5555-5555-5555-555555555540', '55555555-5555-5555-5555-555555555501', '55555555-5555-5555-5555-555555555530',
    'Valoración corporal', 'Encuentro inicial para identificar tensiones y objetivos de bienestar.',
    'servicio_bienestar', 30, 60000, true, true, 'deposit', 20000,
    'in_person', '55555555-5555-5555-5555-555555555510', '#3F7256', false, 6, 24, true,
    null, 'Gracias por tu apertura. Pronto recibirás recomendaciones para tu proceso.', null, null, false
  ),
  (
    '55555555-5555-5555-5555-555555555541', '55555555-5555-5555-5555-555555555501', '55555555-5555-5555-5555-555555555530',
    'Masaje terapéutico', 'Sesión de masaje enfocada en liberar tensión muscular.',
    'servicio_bienestar', 60, 130000, true, true, 'deposit', 40000,
    'in_person', '55555555-5555-5555-5555-555555555510', '#3F7256', false, 12, 24, true,
    'Llega 10 minutos antes para prepararte.', 'Hidrátate bien después de tu sesión.', null, null, true
  ),
  (
    '55555555-5555-5555-5555-555555555542', '55555555-5555-5555-5555-555555555501', '55555555-5555-5555-5555-555555555531',
    'Círculo de respiración y relajación', 'Sesión grupal guiada de respiración y relajación profunda.',
    'servicio_bienestar', 90, 70000, true, true, 'full', null,
    'in_person', '55555555-5555-5555-5555-555555555510', '#D4AF37', false, 24, 48, true,
    'Usa ropa cómoda y trae una manta si gustas.', 'Gracias por participar en nuestro círculo de bienestar.', null, 15, false
  )
on conflict (id) do nothing;

insert into public.professional_services (clinic_id, professional_id, service_id)
select '55555555-5555-5555-5555-555555555501', '55555555-5555-5555-5555-555555555520', s.id
from public.services s where s.clinic_id = '55555555-5555-5555-5555-555555555501'
on conflict do nothing;

insert into public.availability_rules (clinic_id, professional_id, location_id, day_of_week, start_time, end_time, buffer_minutes)
select '55555555-5555-5555-5555-555555555501', '55555555-5555-5555-5555-555555555520', '55555555-5555-5555-5555-555555555510',
  d, t.start_time, t.end_time, 15
from generate_series(2, 6) as d
cross join (values ('09:00'::time, '13:00'::time), ('14:00'::time, '19:00'::time)) as t(start_time, end_time);

insert into public.patients (id, clinic_id, full_name, document_type, document_number, email, phone, city, status) values
  ('55555555-5555-5555-5555-555555555540', '55555555-5555-5555-5555-555555555501', 'Laura Fernanda Puentes', 'CC', '1140505050', 'laura.puentes.demo@example.com', '+57 323 555 0510', 'Bogotá', 'active'),
  ('55555555-5555-5555-5555-555555555541', '55555555-5555-5555-5555-555555555501', 'Diego Alejandro Peña', 'CC', '1150606060', 'diego.pena.demo@example.com', '+57 324 555 0511', 'Bogotá', 'active'),
  ('55555555-5555-5555-5555-555555555542', '55555555-5555-5555-5555-555555555501', 'Manuela Castro Gil', 'CC', '1160707070', 'manuela.castro.demo@example.com', '+57 325 555 0512', 'Bogotá', 'active')
on conflict (id) do nothing;

insert into public.consent_documents (id, clinic_id, document_type, title, body, version, is_active) values
  ('55555555-5555-5555-5555-555555555570', '55555555-5555-5555-5555-555555555501', 'privacy_policy', 'Política de tratamiento de datos personales', 'Raíz Bienestar trata tus datos personales conforme a la Ley 1581 de 2012 y sus decretos reglamentarios.', 1, true),
  ('55555555-5555-5555-5555-555555555571', '55555555-5555-5555-5555-555555555501', 'wellness_disclaimer', 'Aviso de servicio de bienestar', 'Este servicio es una experiencia de bienestar complementaria y no reemplaza una valoración médica cuando esta sea necesaria.', 1, true)
on conflict (id) do nothing;

insert into public.appointments (
  id, clinic_id, patient_id, professional_id, service_id, location_id, starts_at, ends_at,
  modality, status, price, deposit_required
) values
  ('55555555-5555-5555-5555-555555555550', '55555555-5555-5555-5555-555555555501', '55555555-5555-5555-5555-555555555540', '55555555-5555-5555-5555-555555555520', '55555555-5555-5555-5555-555555555541', '55555555-5555-5555-5555-555555555510', (current_date + time '10:00')::timestamptz, (current_date + time '11:00')::timestamptz, 'in_person', 'confirmed', 130000, 40000),
  ('55555555-5555-5555-5555-555555555551', '55555555-5555-5555-5555-555555555501', '55555555-5555-5555-5555-555555555541', '55555555-5555-5555-5555-555555555520', '55555555-5555-5555-5555-555555555540', '55555555-5555-5555-5555-555555555510', (current_date + time '13:00')::timestamptz, (current_date + time '13:30')::timestamptz, 'in_person', 'pending_payment', 60000, 20000),
  ('55555555-5555-5555-5555-555555555552', '55555555-5555-5555-5555-555555555501', '55555555-5555-5555-5555-555555555542', '55555555-5555-5555-5555-555555555520', '55555555-5555-5555-5555-555555555542', '55555555-5555-5555-5555-555555555510', (current_date + 4 + time '17:00')::timestamptz, (current_date + 4 + time '18:30')::timestamptz, 'in_person', 'confirmed', 70000, 0),
  ('55555555-5555-5555-5555-555555555553', '55555555-5555-5555-5555-555555555501', '55555555-5555-5555-5555-555555555540', '55555555-5555-5555-5555-555555555520', '55555555-5555-5555-5555-555555555541', '55555555-5555-5555-5555-555555555510', (current_date - 6 + time '10:00')::timestamptz, (current_date - 6 + time '11:00')::timestamptz, 'in_person', 'completed', 130000, 40000)
on conflict (id) do nothing;

insert into public.consent_records (clinic_id, patient_id, document_id, document_version, appointment_id, acceptance_method) values
  ('55555555-5555-5555-5555-555555555501', '55555555-5555-5555-5555-555555555540', '55555555-5555-5555-5555-555555555570', 1, '55555555-5555-5555-5555-555555555550', 'web_form'),
  ('55555555-5555-5555-5555-555555555501', '55555555-5555-5555-5555-555555555540', '55555555-5555-5555-5555-555555555571', 1, '55555555-5555-5555-5555-555555555550', 'web_form');

insert into public.payment_providers (id, clinic_id, provider_key, display_name, is_active, is_sandbox) values
  ('55555555-5555-5555-5555-555555555560', '55555555-5555-5555-5555-555555555501', 'manual_transfer', 'Transferencia bancaria', true, false),
  ('55555555-5555-5555-5555-555555555561', '55555555-5555-5555-5555-555555555501', 'wompi', 'Wompi (tarjeta/PSE)', true, true)
on conflict (id) do nothing;

insert into public.payment_methods (clinic_id, payment_provider_id, label, instructions, sort_order) values
  ('55555555-5555-5555-5555-555555555501', '55555555-5555-5555-5555-555555555560', 'Transferencia bancaria', 'Transfiere a la cuenta indicada y adjunta tu comprobante.', 1),
  ('55555555-5555-5555-5555-555555555501', '55555555-5555-5555-5555-555555555561', 'Tarjeta o PSE (Wompi)', 'Pago automático e inmediato con confirmación instantánea.', 2);

insert into public.payment_intents (id, clinic_id, appointment_id, patient_id, service_id, payment_provider_id, kind, amount, status) values
  ('55555555-5555-5555-5555-555555555562', '55555555-5555-5555-5555-555555555501', '55555555-5555-5555-5555-555555555550', '55555555-5555-5555-5555-555555555540', '55555555-5555-5555-5555-555555555541', '55555555-5555-5555-5555-555555555561', 'deposit', 40000, 'approved')
on conflict (id) do nothing;

insert into public.payments (clinic_id, payment_intent_id, amount, method, status, paid_at) values
  ('55555555-5555-5555-5555-555555555501', '55555555-5555-5555-5555-555555555562', 40000, 'wompi', 'approved', now() - interval '3 days');

insert into public.licenses (clinic_id, license_type, professionals_allowed, locations_allowed, status, purchased_at) values
  ('55555555-5555-5555-5555-555555555501', 'esencial', 1, 1, 'active', now() - interval '10 days')
on conflict (clinic_id) do nothing;

insert into public.support_subscriptions (clinic_id, support_plan_id, status, started_at, ends_at)
select '55555555-5555-5555-5555-555555555501', sp.id, 'active', current_date - 10, current_date + 355
from public.support_plans sp where sp.plan_key = 'esencial'
on conflict (clinic_id) do nothing;

insert into public.demo_data_profiles (vertical_key, clinic_id, display_name, description, is_active) values
  ('bienestar', '55555555-5555-5555-5555-555555555501', 'Centro de bienestar · Raíz Bienestar', 'Demo de Raíz Bienestar: agenda, masajes terapéuticos, programas grupales y página pública para bienestar.', true)
on conflict (vertical_key) do nothing;
