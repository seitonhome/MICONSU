-- ============================================================================
-- Seed: Demo comercial — Medicina alternativa / Biosanación Emocional
-- "Sanación Integral" — usado por /demo/alternativa para mostrar el sistema
-- a prospectos. Reutiliza las tablas de producción con clinics.is_demo = true.
-- Fechas relativas a CURRENT_DATE para que la demo siempre luzca vigente.
-- Nota: Fase 1 no incluye aún paquetes de sesiones, talleres grupales,
-- reseñas ni biblioteca de recursos (llegan en Fase 2); este seed cubre lo
-- que sí existe hoy: agenda, servicios, pacientes, pagos, consentimientos.
-- ============================================================================

-- ── Clínica demo ─────────────────────────────────────────────────────────

insert into public.clinics (
  id, slug, commercial_name, legal_name, description, contact_email, contact_phone,
  whatsapp_number, primary_practitioner_type, label_overrides, legal_disclaimer,
  is_demo, is_published
) values (
  '11111111-1111-1111-1111-111111111101',
  'sanacion-integral-demo',
  'Sanación Integral',
  'Sanación Integral SAS',
  'Espacio de acompañamiento en biosanación emocional y biodescodificación, enfocado en procesos de bienestar complementarios.',
  'contacto@sanacionintegral-demo.co',
  '+57 300 555 0101',
  '+57 300 555 0101',
  'biosanacion_biodescodificacion',
  '{"patient":"consultante","appointment":"sesión","clinical_note":"registro de proceso"}'::jsonb,
  'Este servicio puede ser complementario y no reemplaza una valoración médica, odontológica, psicológica o psiquiátrica cuando esta sea necesaria. Cada profesional es responsable del alcance, formación, habilitación y cumplimiento normativo de los servicios que ofrece.',
  true,
  true
)
on conflict (id) do nothing;

insert into public.clinic_branding (
  clinic_id, primary_color, secondary_color, visual_theme, font_style
) values (
  '11111111-1111-1111-1111-111111111101', '#9CAF88', '#E8DCC8', 'bienestar_premium', 'default'
)
on conflict (clinic_id) do nothing;

insert into public.clinic_locations (id, clinic_id, name, address, city, country, is_virtual, is_active) values
  ('11111111-1111-1111-1111-111111111110', '11111111-1111-1111-1111-111111111101', 'Sesiones en línea', null, 'Virtual', 'CO', true, true),
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111101', 'Espacio Sanación Integral', 'Calle 85 # 15-20, Chapinero', 'Bogotá', 'CO', false, true)
on conflict (id) do nothing;

-- ── Profesional ──────────────────────────────────────────────────────────

insert into public.professionals (
  id, clinic_id, profile_id, slug, practitioner_type, full_name, specialty_label, bio,
  accepts_virtual, accepts_in_person, is_active
) values (
  '11111111-1111-1111-1111-111111111120',
  '11111111-1111-1111-1111-111111111101',
  null,
  'mariana-duarte',
  'biosanacion_biodescodificacion',
  'Mariana Duarte',
  'Biosanación Emocional y Biodescodificación',
  'Acompaño procesos de bienestar emocional a través de la biosanación y la biodescodificación, como complemento a la valoración profesional que cada persona requiera.',
  true, true, true
)
on conflict (id) do nothing;

-- ── Categorías y servicios ───────────────────────────────────────────────

insert into public.service_categories (id, clinic_id, name, sort_order) values
  ('11111111-1111-1111-1111-111111111130', '11111111-1111-1111-1111-111111111101', 'Sesiones individuales', 1),
  ('11111111-1111-1111-1111-111111111131', '11111111-1111-1111-1111-111111111101', 'Procesos y talleres', 2)
on conflict (id) do nothing;

insert into public.services (
  id, clinic_id, category_id, name, description, classification, duration_minutes, price,
  price_visible, requires_payment, payment_type, deposit_amount, modality, default_location_id,
  color_hex, requires_additional_consent, min_advance_hours, max_cancel_hours, is_active,
  pre_instructions, post_message, disclaimer, max_group_capacity, allows_package
) values
  (
    '11111111-1111-1111-1111-111111111140', '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111130',
    'Sesión inicial de lectura emocional',
    'Primer encuentro para identificar el objetivo del proceso y las áreas a trabajar.',
    'terapia_alternativa_complementaria', 60, 180000, true, true, 'deposit', 50000,
    'both', '11111111-1111-1111-1111-111111111110', '#9CAF88', true, 12, 24, true,
    'Llega a tu sesión en un espacio tranquilo, sin interrupciones.',
    'Gracias por tu apertura en esta primera sesión. Pronto recibirás tus recomendaciones.',
    'Este servicio es complementario y no reemplaza una valoración médica o psicológica cuando esta sea necesaria.',
    null, false
  ),
  (
    '11111111-1111-1111-1111-111111111141', '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111130',
    'Sesión de biosanación',
    'Sesión individual de seguimiento dentro del proceso de biosanación emocional.',
    'terapia_alternativa_complementaria', 60, 150000, true, true, 'deposit', 50000,
    'both', '11111111-1111-1111-1111-111111111110', '#9CAF88', true, 12, 24, true,
    'Ten a la mano agua y un espacio cómodo para recostarte si es virtual.',
    'Recuerda registrar cómo te sientes en los próximos días.',
    'Este servicio es complementario y no reemplaza una valoración médica o psicológica cuando esta sea necesaria.',
    null, true
  ),
  (
    '11111111-1111-1111-1111-111111111142', '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111131',
    'Acompañamiento mensual',
    'Proceso mensual de acompañamiento continuo en biosanación emocional.',
    'terapia_alternativa_complementaria', 45, 480000, true, true, 'manual', null,
    'both', '11111111-1111-1111-1111-111111111110', '#C97C5D', true, 24, 48, true,
    null, 'Tu próxima sesión del acompañamiento queda sugerida automáticamente.',
    'Este servicio es complementario y no reemplaza una valoración médica o psicológica cuando esta sea necesaria.',
    null, true
  ),
  (
    '11111111-1111-1111-1111-111111111143', '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111131',
    'Taller grupal: Sanando el vínculo familiar',
    'Espacio grupal para explorar patrones familiares desde la biodescodificación.',
    'servicio_bienestar', 120, 90000, true, true, 'full', null,
    'both', '11111111-1111-1111-1111-111111111111', '#D4AF37', false, 48, 48, true,
    'Trae una libreta para tus notas del taller.',
    'Gracias por participar. Te compartiremos materiales de cierre en unos días.',
    'Servicio de bienestar grupal, de carácter educativo y de acompañamiento, no clínico.',
    12, false
  )
on conflict (id) do nothing;

insert into public.professional_services (clinic_id, professional_id, service_id)
select '11111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111120', s.id
from public.services s
where s.clinic_id = '11111111-1111-1111-1111-111111111101'
on conflict do nothing;

-- ── Disponibilidad (lunes a viernes, 8am-1pm y 2pm-6pm) ─────────────────

insert into public.availability_rules (clinic_id, professional_id, location_id, day_of_week, start_time, end_time, buffer_minutes)
select
  '11111111-1111-1111-1111-111111111101',
  '11111111-1111-1111-1111-111111111120',
  '11111111-1111-1111-1111-111111111110',
  d, t.start_time, t.end_time, 15
from generate_series(1, 5) as d
cross join (values ('08:00'::time, '13:00'::time), ('14:00'::time, '18:00'::time)) as t(start_time, end_time);

-- ── Pacientes/consultantes de ejemplo ────────────────────────────────────

insert into public.patients (id, clinic_id, full_name, document_type, document_number, email, phone, city, status) values
  ('11111111-1111-1111-1111-111111111140', '11111111-1111-1111-1111-111111111101', 'Laura Gómez Pardo', 'CC', '1010101010', 'laura.gomez.demo@example.com', '+57 310 555 0110', 'Bogotá', 'active'),
  ('11111111-1111-1111-1111-111111111141', '11111111-1111-1111-1111-111111111101', 'Andrés Felipe Rojas', 'CC', '1020202020', 'andres.rojas.demo@example.com', '+57 311 555 0111', 'Bogotá', 'active'),
  ('11111111-1111-1111-1111-111111111142', '11111111-1111-1111-1111-111111111101', 'Camila Torres Duarte', 'CC', '1030303030', 'camila.torres.demo@example.com', '+57 312 555 0112', 'Chía', 'active'),
  ('11111111-1111-1111-1111-111111111143', '11111111-1111-1111-1111-111111111101', 'Julián Esteban Vargas', 'CC', '1040404040', 'julian.vargas.demo@example.com', '+57 313 555 0113', 'Bogotá', 'active')
on conflict (id) do nothing;

-- ── Consentimientos ──────────────────────────────────────────────────────

insert into public.consent_documents (id, clinic_id, document_type, title, body, version, is_active) values
  ('11111111-1111-1111-1111-111111111170', '11111111-1111-1111-1111-111111111101', 'privacy_policy', 'Política de tratamiento de datos personales', 'Sanación Integral trata tus datos personales conforme a la Ley 1581 de 2012 y sus decretos reglamentarios, exclusivamente para la gestión de tu proceso y agenda.', 1, true),
  ('11111111-1111-1111-1111-111111111171', '11111111-1111-1111-1111-111111111101', 'alternative_medicine_disclaimer', 'Aviso de servicio complementario', 'Este servicio puede ser complementario y no reemplaza una valoración médica, odontológica, psicológica o psiquiátrica cuando esta sea necesaria. Cada profesional es responsable del alcance, formación, habilitación y cumplimiento normativo de los servicios que ofrece.', 1, true),
  ('11111111-1111-1111-1111-111111111172', '11111111-1111-1111-1111-111111111101', 'teleconsultation_consent', 'Consentimiento para sesión virtual', 'Acepto realizar mi sesión de forma virtual, entendiendo sus alcances y limitaciones frente a una sesión presencial.', 1, true)
on conflict (id) do nothing;

-- ── Citas (relativas a hoy, para que el dashboard demo siempre luzca vivo) ─

insert into public.appointments (
  id, clinic_id, patient_id, professional_id, service_id, location_id, starts_at, ends_at,
  modality, status, price, deposit_required
) values
  -- Hoy: confirmada en la mañana
  (
    '11111111-1111-1111-1111-111111111150', '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111140', '11111111-1111-1111-1111-111111111120',
    '11111111-1111-1111-1111-111111111141', '11111111-1111-1111-1111-111111111110',
    (current_date + time '09:00')::timestamptz, (current_date + time '10:00')::timestamptz,
    'virtual', 'confirmed', 150000, 50000
  ),
  -- Hoy: pendiente de pago en la tarde
  (
    '11111111-1111-1111-1111-111111111151', '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111141', '11111111-1111-1111-1111-111111111120',
    '11111111-1111-1111-1111-111111111140', '11111111-1111-1111-1111-111111111111',
    (current_date + time '15:00')::timestamptz, (current_date + time '16:00')::timestamptz,
    'in_person', 'pending_payment', 180000, 50000
  ),
  -- Mañana: confirmada
  (
    '11111111-1111-1111-1111-111111111152', '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111142', '11111111-1111-1111-1111-111111111120',
    '11111111-1111-1111-1111-111111111141', '11111111-1111-1111-1111-111111111110',
    (current_date + 1 + time '11:00')::timestamptz, (current_date + 1 + time '12:00')::timestamptz,
    'virtual', 'confirmed', 150000, 50000
  ),
  -- Próxima semana: solicitada (oportunidad de confirmar)
  (
    '11111111-1111-1111-1111-111111111153', '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111143', '11111111-1111-1111-1111-111111111120',
    '11111111-1111-1111-1111-111111111142', '11111111-1111-1111-1111-111111111110',
    (current_date + 7 + time '09:00')::timestamptz, (current_date + 7 + time '09:45')::timestamptz,
    'virtual', 'requested', 480000, 0
  ),
  -- Semana pasada: completada
  (
    '11111111-1111-1111-1111-111111111154', '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111140', '11111111-1111-1111-1111-111111111120',
    '11111111-1111-1111-1111-111111111140', '11111111-1111-1111-1111-111111111110',
    (current_date - 7 + time '09:00')::timestamptz, (current_date - 7 + time '10:00')::timestamptz,
    'virtual', 'completed', 180000, 50000
  ),
  -- Semana pasada: no-show
  (
    '11111111-1111-1111-1111-111111111155', '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111142', '11111111-1111-1111-1111-111111111120',
    '11111111-1111-1111-1111-111111111141', '11111111-1111-1111-1111-111111111111',
    (current_date - 5 + time '16:00')::timestamptz, (current_date - 5 + time '17:00')::timestamptz,
    'in_person', 'no_show', 150000, 50000
  ),
  -- Esta semana: cancelada (oportunidad de recuperar con lista de espera)
  (
    '11111111-1111-1111-1111-111111111156', '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111143', '11111111-1111-1111-1111-111111111120',
    '11111111-1111-1111-1111-111111111141', '11111111-1111-1111-1111-111111111110',
    (current_date + 2 + time '10:00')::timestamptz, (current_date + 2 + time '11:00')::timestamptz,
    'virtual', 'cancelled', 150000, 0
  )
on conflict (id) do nothing;

insert into public.consent_records (clinic_id, patient_id, document_id, document_version, appointment_id, acceptance_method) values
  ('11111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111140', '11111111-1111-1111-1111-111111111170', 1, '11111111-1111-1111-1111-111111111150', 'web_form'),
  ('11111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111140', '11111111-1111-1111-1111-111111111171', 1, '11111111-1111-1111-1111-111111111150', 'web_form'),
  ('11111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111141', '11111111-1111-1111-1111-111111111170', 1, '11111111-1111-1111-1111-111111111151', 'web_form');

-- ── Lista de espera (recuperar el espacio cancelado) ─────────────────────

insert into public.waitlist_entries (clinic_id, patient_id, service_id, professional_id, priority, status) values
  ('11111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111142', '11111111-1111-1111-1111-111111111141', '11111111-1111-1111-1111-111111111120', 1, 'waiting');

-- ── Pasarelas y métodos de pago (sandbox / manual, sin credenciales reales) ─

insert into public.payment_providers (id, clinic_id, provider_key, display_name, is_active, is_sandbox) values
  ('11111111-1111-1111-1111-111111111160', '11111111-1111-1111-1111-111111111101', 'manual_transfer', 'Transferencia bancaria', true, false),
  ('11111111-1111-1111-1111-111111111161', '11111111-1111-1111-1111-111111111101', 'wompi', 'Wompi (tarjeta/PSE)', true, true)
on conflict (id) do nothing;

insert into public.payment_methods (clinic_id, payment_provider_id, label, instructions, sort_order) values
  ('11111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111160', 'Transferencia bancaria', 'Transfiere a la cuenta de ahorros indicada y adjunta tu comprobante.', 1),
  ('11111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111161', 'Tarjeta o PSE (Wompi)', 'Pago automático e inmediato con confirmación instantánea.', 2);

insert into public.payment_intents (id, clinic_id, appointment_id, patient_id, service_id, payment_provider_id, kind, amount, status) values
  ('11111111-1111-1111-1111-111111111162', '11111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111150', '11111111-1111-1111-1111-111111111140', '11111111-1111-1111-1111-111111111141', '11111111-1111-1111-1111-111111111161', 'deposit', 50000, 'approved'),
  ('11111111-1111-1111-1111-111111111163', '11111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111151', '11111111-1111-1111-1111-111111111141', '11111111-1111-1111-1111-111111111140', '11111111-1111-1111-1111-111111111160', 'deposit', 50000, 'pending_confirmation')
on conflict (id) do nothing;

insert into public.payments (clinic_id, payment_intent_id, amount, method, status, paid_at) values
  ('11111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111162', 50000, 'wompi', 'approved', now() - interval '1 day');

insert into public.manual_payment_proofs (clinic_id, payment_intent_id, file_url, notes, status) values
  ('11111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111163', 'https://example.com/demo/comprobante-demo.pdf', 'Comprobante de transferencia cargado por el consultante.', 'pending');

-- ── Licencia y soporte (Plan Continuidad Clínica) ────────────────────────

insert into public.licenses (clinic_id, license_type, professionals_allowed, locations_allowed, status, purchased_at) values
  ('11111111-1111-1111-1111-111111111101', 'profesional', 3, 2, 'active', now() - interval '30 days')
on conflict (clinic_id) do nothing;

insert into public.support_subscriptions (clinic_id, support_plan_id, status, started_at, ends_at)
select '11111111-1111-1111-1111-111111111101', sp.id, 'active', current_date - 30, current_date + 335
from public.support_plans sp where sp.plan_key = 'profesional'
on conflict (clinic_id) do nothing;

-- ── Índice de demo comercial ─────────────────────────────────────────────

insert into public.demo_data_profiles (vertical_key, clinic_id, display_name, description, is_active) values
  ('alternativa', '11111111-1111-1111-1111-111111111101', 'Medicina alternativa · Biosanación emocional', 'Demo de Sanación Integral: agenda, pagos, servicios y página pública para medicina alternativa y bienestar.', true)
on conflict (vertical_key) do nothing;
