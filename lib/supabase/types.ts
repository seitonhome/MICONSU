/**
 * Tipos escritos a mano a partir de supabase/migrations/*.sql (no hay proyecto
 * Supabase local/enlazado disponible para `supabase gen types typescript`).
 * Regenerar con el comando real en cuanto haya conexión directa a la base de
 * datos (CLI, --db-url o proyecto enlazado):
 *   supabase gen types typescript --linked > lib/supabase/types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      clinics: {
        Row: {
          id: string;
          slug: string;
          commercial_name: string;
          legal_name: string | null;
          tax_id: string | null;
          description: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          whatsapp_number: string | null;
          website_url: string | null;
          primary_practitioner_type: Database["public"]["Enums"]["practitioner_type"] | null;
          label_overrides: Json;
          legal_disclaimer: string | null;
          is_demo: boolean;
          is_published: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          commercial_name: string;
          legal_name?: string | null;
          tax_id?: string | null;
          description?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          whatsapp_number?: string | null;
          website_url?: string | null;
          primary_practitioner_type?: Database["public"]["Enums"]["practitioner_type"] | null;
          label_overrides?: Json;
          legal_disclaimer?: string | null;
          is_demo?: boolean;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          commercial_name?: string;
          legal_name?: string | null;
          tax_id?: string | null;
          description?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          whatsapp_number?: string | null;
          website_url?: string | null;
          primary_practitioner_type?: Database["public"]["Enums"]["practitioner_type"] | null;
          label_overrides?: Json;
          legal_disclaimer?: string | null;
          is_demo?: boolean;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          clinic_id: string | null;
          role: Database["public"]["Enums"]["app_role"];
          full_name: string;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          clinic_id?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clinic_branding: {
        Row: {
          clinic_id: string;
          logo_url: string | null;
          cover_image_url: string | null;
          professional_photo_url: string | null;
          primary_color: string;
          secondary_color: string;
          visual_theme: Database["public"]["Enums"]["visual_theme"];
          font_style: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          clinic_id: string;
          logo_url?: string | null;
          cover_image_url?: string | null;
          professional_photo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          visual_theme?: Database["public"]["Enums"]["visual_theme"];
          font_style?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          clinic_id?: string;
          logo_url?: string | null;
          cover_image_url?: string | null;
          professional_photo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          visual_theme?: Database["public"]["Enums"]["visual_theme"];
          font_style?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clinic_locations: {
        Row: {
          id: string;
          clinic_id: string;
          name: string;
          address: string | null;
          city: string | null;
          country: string;
          is_virtual: boolean;
          google_maps_url: string | null;
          phone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          name: string;
          address?: string | null;
          city?: string | null;
          country?: string;
          is_virtual?: boolean;
          google_maps_url?: string | null;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          name?: string;
          address?: string | null;
          city?: string | null;
          country?: string;
          is_virtual?: boolean;
          google_maps_url?: string | null;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      professionals: {
        Row: {
          id: string;
          clinic_id: string;
          profile_id: string | null;
          slug: string;
          practitioner_type: Database["public"]["Enums"]["practitioner_type"];
          full_name: string;
          specialty_label: string | null;
          bio: string | null;
          photo_url: string | null;
          license_number: string | null;
          accepts_virtual: boolean;
          accepts_in_person: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          profile_id?: string | null;
          slug: string;
          practitioner_type?: Database["public"]["Enums"]["practitioner_type"];
          full_name: string;
          specialty_label?: string | null;
          bio?: string | null;
          photo_url?: string | null;
          license_number?: string | null;
          accepts_virtual?: boolean;
          accepts_in_person?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          profile_id?: string | null;
          slug?: string;
          practitioner_type?: Database["public"]["Enums"]["practitioner_type"];
          full_name?: string;
          specialty_label?: string | null;
          bio?: string | null;
          photo_url?: string | null;
          license_number?: string | null;
          accepts_virtual?: boolean;
          accepts_in_person?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      professional_credentials: {
        Row: {
          id: string;
          clinic_id: string;
          professional_id: string;
          credential_type: string;
          title: string;
          issuing_entity: string | null;
          issue_date: string | null;
          expiry_date: string | null;
          document_url: string | null;
          is_verified: boolean;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          professional_id: string;
          credential_type: string;
          title: string;
          issuing_entity?: string | null;
          issue_date?: string | null;
          expiry_date?: string | null;
          document_url?: string | null;
          is_verified?: boolean;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          professional_id?: string;
          credential_type?: string;
          title?: string;
          issuing_entity?: string | null;
          issue_date?: string | null;
          expiry_date?: string | null;
          document_url?: string | null;
          is_verified?: boolean;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      assistants: {
        Row: {
          id: string;
          clinic_id: string;
          profile_id: string;
          scope: string;
          assigned_professional_ids: string[];
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          profile_id: string;
          scope?: string;
          assigned_professional_ids?: string[];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          profile_id?: string;
          scope?: string;
          assigned_professional_ids?: string[];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      patients: {
        Row: {
          id: string;
          clinic_id: string;
          full_name: string;
          document_type: string | null;
          document_number: string | null;
          email: string | null;
          phone: string | null;
          birth_date: string | null;
          city: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          administrative_notes: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          full_name: string;
          document_type?: string | null;
          document_number?: string | null;
          email?: string | null;
          phone?: string | null;
          birth_date?: string | null;
          city?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          administrative_notes?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          full_name?: string;
          document_type?: string | null;
          document_number?: string | null;
          email?: string | null;
          phone?: string | null;
          birth_date?: string | null;
          city?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          administrative_notes?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      service_categories: {
        Row: {
          id: string;
          clinic_id: string;
          name: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          name: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          name?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          clinic_id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          classification: Database["public"]["Enums"]["service_classification"];
          duration_minutes: number;
          price: number;
          price_visible: boolean;
          requires_payment: boolean;
          payment_type: "none" | "deposit" | "full" | "manual" | "in_person";
          deposit_amount: number | null;
          modality: "in_person" | "virtual" | "both";
          default_location_id: string | null;
          color_hex: string;
          requires_additional_consent: boolean;
          min_advance_hours: number;
          max_cancel_hours: number;
          is_active: boolean;
          pre_instructions: string | null;
          post_message: string | null;
          disclaimer: string | null;
          max_group_capacity: number | null;
          allows_package: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          category_id?: string | null;
          name: string;
          description?: string | null;
          classification?: Database["public"]["Enums"]["service_classification"];
          duration_minutes?: number;
          price?: number;
          price_visible?: boolean;
          requires_payment?: boolean;
          payment_type?: "none" | "deposit" | "full" | "manual" | "in_person";
          deposit_amount?: number | null;
          modality?: "in_person" | "virtual" | "both";
          default_location_id?: string | null;
          color_hex?: string;
          requires_additional_consent?: boolean;
          min_advance_hours?: number;
          max_cancel_hours?: number;
          is_active?: boolean;
          pre_instructions?: string | null;
          post_message?: string | null;
          disclaimer?: string | null;
          max_group_capacity?: number | null;
          allows_package?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          category_id?: string | null;
          name?: string;
          description?: string | null;
          classification?: Database["public"]["Enums"]["service_classification"];
          duration_minutes?: number;
          price?: number;
          price_visible?: boolean;
          requires_payment?: boolean;
          payment_type?: "none" | "deposit" | "full" | "manual" | "in_person";
          deposit_amount?: number | null;
          modality?: "in_person" | "virtual" | "both";
          default_location_id?: string | null;
          color_hex?: string;
          requires_additional_consent?: boolean;
          min_advance_hours?: number;
          max_cancel_hours?: number;
          is_active?: boolean;
          pre_instructions?: string | null;
          post_message?: string | null;
          disclaimer?: string | null;
          max_group_capacity?: number | null;
          allows_package?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      professional_services: {
        Row: {
          id: string;
          clinic_id: string;
          professional_id: string;
          service_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          professional_id: string;
          service_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          professional_id?: string;
          service_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      availability_rules: {
        Row: {
          id: string;
          clinic_id: string;
          professional_id: string;
          location_id: string | null;
          day_of_week: number;
          start_time: string;
          end_time: string;
          buffer_minutes: number;
          is_recurring: boolean;
          valid_from: string | null;
          valid_to: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          professional_id: string;
          location_id?: string | null;
          day_of_week: number;
          start_time: string;
          end_time: string;
          buffer_minutes?: number;
          is_recurring?: boolean;
          valid_from?: string | null;
          valid_to?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          professional_id?: string;
          location_id?: string | null;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          buffer_minutes?: number;
          is_recurring?: boolean;
          valid_from?: string | null;
          valid_to?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      blocked_times: {
        Row: {
          id: string;
          clinic_id: string;
          professional_id: string | null;
          starts_at: string;
          ends_at: string;
          reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          professional_id?: string | null;
          starts_at: string;
          ends_at: string;
          reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          professional_id?: string | null;
          starts_at?: string;
          ends_at?: string;
          reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rooms_or_chairs: {
        Row: {
          id: string;
          clinic_id: string;
          location_id: string;
          name: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          location_id: string;
          name: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          location_id?: string;
          name?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          clinic_id: string;
          patient_id: string;
          professional_id: string;
          service_id: string;
          location_id: string | null;
          room_id: string | null;
          starts_at: string;
          ends_at: string;
          modality: "in_person" | "virtual";
          status: Database["public"]["Enums"]["appointment_status"];
          price: number;
          deposit_required: number;
          administrative_notes: string | null;
          cancellation_reason: string | null;
          cancelled_by: string | null;
          rescheduled_from_id: string | null;
          booking_token: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          patient_id: string;
          professional_id: string;
          service_id: string;
          location_id?: string | null;
          room_id?: string | null;
          starts_at: string;
          ends_at: string;
          modality?: "in_person" | "virtual";
          status?: Database["public"]["Enums"]["appointment_status"];
          price?: number;
          deposit_required?: number;
          administrative_notes?: string | null;
          cancellation_reason?: string | null;
          cancelled_by?: string | null;
          rescheduled_from_id?: string | null;
          booking_token?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          patient_id?: string;
          professional_id?: string;
          service_id?: string;
          location_id?: string | null;
          room_id?: string | null;
          starts_at?: string;
          ends_at?: string;
          modality?: "in_person" | "virtual";
          status?: Database["public"]["Enums"]["appointment_status"];
          price?: number;
          deposit_required?: number;
          administrative_notes?: string | null;
          cancellation_reason?: string | null;
          cancelled_by?: string | null;
          rescheduled_from_id?: string | null;
          booking_token?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      appointment_events: {
        Row: {
          id: string;
          clinic_id: string;
          appointment_id: string;
          event_type: string;
          from_status: Database["public"]["Enums"]["appointment_status"] | null;
          to_status: Database["public"]["Enums"]["appointment_status"] | null;
          actor_profile_id: string | null;
          actor_type: "patient" | "staff" | "system";
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          appointment_id: string;
          event_type: string;
          from_status?: Database["public"]["Enums"]["appointment_status"] | null;
          to_status?: Database["public"]["Enums"]["appointment_status"] | null;
          actor_profile_id?: string | null;
          actor_type?: "patient" | "staff" | "system";
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          appointment_id?: string;
          event_type?: string;
          from_status?: Database["public"]["Enums"]["appointment_status"] | null;
          to_status?: Database["public"]["Enums"]["appointment_status"] | null;
          actor_profile_id?: string | null;
          actor_type?: "patient" | "staff" | "system";
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      waitlist_entries: {
        Row: {
          id: string;
          clinic_id: string;
          patient_id: string;
          service_id: string | null;
          professional_id: string | null;
          date_range_start: string | null;
          date_range_end: string | null;
          time_preference: string | null;
          priority: number;
          status: "waiting" | "notified" | "booked" | "expired" | "cancelled";
          notified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          patient_id: string;
          service_id?: string | null;
          professional_id?: string | null;
          date_range_start?: string | null;
          date_range_end?: string | null;
          time_preference?: string | null;
          priority?: number;
          status?: "waiting" | "notified" | "booked" | "expired" | "cancelled";
          notified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          patient_id?: string;
          service_id?: string | null;
          professional_id?: string | null;
          date_range_start?: string | null;
          date_range_end?: string | null;
          time_preference?: string | null;
          priority?: number;
          status?: "waiting" | "notified" | "booked" | "expired" | "cancelled";
          notified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_providers: {
        Row: {
          id: string;
          clinic_id: string;
          provider_key:
            | "wompi"
            | "mercado_pago"
            | "payu"
            | "epayco"
            | "bold"
            | "placetopay"
            | "manual_transfer"
            | "in_person"
            | "external_link";
          display_name: string;
          is_active: boolean;
          is_sandbox: boolean;
          encrypted_credentials: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          provider_key:
            | "wompi"
            | "mercado_pago"
            | "payu"
            | "epayco"
            | "bold"
            | "placetopay"
            | "manual_transfer"
            | "in_person"
            | "external_link";
          display_name: string;
          is_active?: boolean;
          is_sandbox?: boolean;
          encrypted_credentials?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          provider_key?:
            | "wompi"
            | "mercado_pago"
            | "payu"
            | "epayco"
            | "bold"
            | "placetopay"
            | "manual_transfer"
            | "in_person"
            | "external_link";
          display_name?: string;
          is_active?: boolean;
          is_sandbox?: boolean;
          encrypted_credentials?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_methods: {
        Row: {
          id: string;
          clinic_id: string;
          payment_provider_id: string;
          label: string;
          instructions: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          payment_provider_id: string;
          label: string;
          instructions?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          payment_provider_id?: string;
          label?: string;
          instructions?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_intents: {
        Row: {
          id: string;
          clinic_id: string;
          appointment_id: string | null;
          patient_id: string;
          service_id: string | null;
          payment_provider_id: string | null;
          kind: "deposit" | "full";
          amount: number;
          currency: string;
          status: Database["public"]["Enums"]["payment_status"];
          external_reference: string | null;
          checkout_url: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          appointment_id?: string | null;
          patient_id: string;
          service_id?: string | null;
          payment_provider_id?: string | null;
          kind?: "deposit" | "full";
          amount: number;
          currency?: string;
          status?: Database["public"]["Enums"]["payment_status"];
          external_reference?: string | null;
          checkout_url?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          appointment_id?: string | null;
          patient_id?: string;
          service_id?: string | null;
          payment_provider_id?: string | null;
          kind?: "deposit" | "full";
          amount?: number;
          currency?: string;
          status?: Database["public"]["Enums"]["payment_status"];
          external_reference?: string | null;
          checkout_url?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          clinic_id: string;
          payment_intent_id: string;
          amount: number;
          currency: string;
          method: string;
          external_transaction_id: string | null;
          status: Database["public"]["Enums"]["payment_status"];
          paid_at: string | null;
          confirmed_by: string | null;
          raw_provider_response: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          payment_intent_id: string;
          amount: number;
          currency?: string;
          method: string;
          external_transaction_id?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          paid_at?: string | null;
          confirmed_by?: string | null;
          raw_provider_response?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          payment_intent_id?: string;
          amount?: number;
          currency?: string;
          method?: string;
          external_transaction_id?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          paid_at?: string | null;
          confirmed_by?: string | null;
          raw_provider_response?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_webhooks: {
        Row: {
          id: string;
          clinic_id: string | null;
          provider_key: string;
          external_event_id: string | null;
          payload: Json;
          signature_valid: boolean;
          processed: boolean;
          processed_at: string | null;
          error: string | null;
          received_at: string;
        };
        Insert: {
          id?: string;
          clinic_id?: string | null;
          provider_key: string;
          external_event_id?: string | null;
          payload: Json;
          signature_valid?: boolean;
          processed?: boolean;
          processed_at?: string | null;
          error?: string | null;
          received_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string | null;
          provider_key?: string;
          external_event_id?: string | null;
          payload?: Json;
          signature_valid?: boolean;
          processed?: boolean;
          processed_at?: string | null;
          error?: string | null;
          received_at?: string;
        };
        Relationships: [];
      };
      manual_payment_proofs: {
        Row: {
          id: string;
          clinic_id: string;
          payment_intent_id: string;
          file_url: string;
          uploaded_by_patient: boolean;
          notes: string | null;
          status: "pending" | "approved" | "rejected";
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          payment_intent_id: string;
          file_url: string;
          uploaded_by_patient?: boolean;
          notes?: string | null;
          status?: "pending" | "approved" | "rejected";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          payment_intent_id?: string;
          file_url?: string;
          uploaded_by_patient?: boolean;
          notes?: string | null;
          status?: "pending" | "approved" | "rejected";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      payment_reconciliation_logs: {
        Row: {
          id: string;
          clinic_id: string;
          payment_id: string | null;
          payment_intent_id: string | null;
          action: "confirmed" | "rejected" | "marked_review" | "refunded" | "exported";
          performed_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          payment_id?: string | null;
          payment_intent_id?: string | null;
          action: "confirmed" | "rejected" | "marked_review" | "refunded" | "exported";
          performed_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          payment_id?: string | null;
          payment_intent_id?: string | null;
          action?: "confirmed" | "rejected" | "marked_review" | "refunded" | "exported";
          performed_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      consent_documents: {
        Row: {
          id: string;
          clinic_id: string;
          document_type: Database["public"]["Enums"]["consent_document_type"];
          service_id: string | null;
          title: string;
          body: string;
          version: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          document_type: Database["public"]["Enums"]["consent_document_type"];
          service_id?: string | null;
          title: string;
          body: string;
          version?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          document_type?: Database["public"]["Enums"]["consent_document_type"];
          service_id?: string | null;
          title?: string;
          body?: string;
          version?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      consent_records: {
        Row: {
          id: string;
          clinic_id: string;
          patient_id: string;
          document_id: string;
          document_version: number;
          appointment_id: string | null;
          accepted_at: string;
          ip_address: string | null;
          user_agent: string | null;
          acceptance_method: "web_form" | "portal" | "staff_recorded";
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          patient_id: string;
          document_id: string;
          document_version: number;
          appointment_id?: string | null;
          accepted_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          acceptance_method?: "web_form" | "portal" | "staff_recorded";
          created_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          patient_id?: string;
          document_id?: string;
          document_version?: number;
          appointment_id?: string | null;
          accepted_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          acceptance_method?: "web_form" | "portal" | "staff_recorded";
          created_at?: string;
        };
        Relationships: [];
      };
      patient_documents: {
        Row: {
          id: string;
          clinic_id: string;
          patient_id: string;
          uploaded_by: string | null;
          file_url: string;
          file_name: string;
          document_type: string | null;
          is_clinical: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          patient_id: string;
          uploaded_by?: string | null;
          file_url: string;
          file_name: string;
          document_type?: string | null;
          is_clinical?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          patient_id?: string;
          uploaded_by?: string | null;
          file_url?: string;
          file_name?: string;
          document_type?: string | null;
          is_clinical?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          clinic_id: string | null;
          actor_profile_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          before_data: Json | null;
          after_data: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id?: string | null;
          actor_profile_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          before_data?: Json | null;
          after_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string | null;
          actor_profile_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          before_data?: Json | null;
          after_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      licenses: {
        Row: {
          id: string;
          clinic_id: string;
          license_type: "esencial" | "profesional" | "centro";
          professionals_allowed: number;
          locations_allowed: number;
          status: "active" | "trial" | "suspended" | "expired" | "cancelled";
          purchased_at: string | null;
          trial_ends_at: string | null;
          internal_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          license_type: "esencial" | "profesional" | "centro";
          professionals_allowed?: number;
          locations_allowed?: number;
          status?: "active" | "trial" | "suspended" | "expired" | "cancelled";
          purchased_at?: string | null;
          trial_ends_at?: string | null;
          internal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          license_type?: "esencial" | "profesional" | "centro";
          professionals_allowed?: number;
          locations_allowed?: number;
          status?: "active" | "trial" | "suspended" | "expired" | "cancelled";
          purchased_at?: string | null;
          trial_ends_at?: string | null;
          internal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      enabled_modules: {
        Row: {
          id: string;
          clinic_id: string;
          module_key: Database["public"]["Enums"]["module_key"];
          is_active: boolean;
          activated_at: string;
          deactivated_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          module_key: Database["public"]["Enums"]["module_key"];
          is_active?: boolean;
          activated_at?: string;
          deactivated_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          module_key?: Database["public"]["Enums"]["module_key"];
          is_active?: boolean;
          activated_at?: string;
          deactivated_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      support_plans: {
        Row: {
          id: string;
          plan_key: "esencial" | "profesional" | "centro";
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plan_key: "esencial" | "profesional" | "centro";
          name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          plan_key?: "esencial" | "profesional" | "centro";
          name?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      support_subscriptions: {
        Row: {
          id: string;
          clinic_id: string;
          support_plan_id: string;
          status: "active" | "expiring_soon" | "expired" | "suspended";
          started_at: string;
          ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          support_plan_id: string;
          status?: "active" | "expiring_soon" | "expired" | "suspended";
          started_at?: string;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          support_plan_id?: string;
          status?: "active" | "expiring_soon" | "expired" | "suspended";
          started_at?: string;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      support_tickets: {
        Row: {
          id: string;
          clinic_id: string;
          created_by: string | null;
          assigned_to: string | null;
          subject: string;
          description: string | null;
          category: Database["public"]["Enums"]["support_ticket_category"];
          priority: Database["public"]["Enums"]["support_ticket_priority"];
          status: Database["public"]["Enums"]["support_ticket_status"];
          first_response_at: string | null;
          resolved_at: string | null;
          csat_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          created_by?: string | null;
          assigned_to?: string | null;
          subject: string;
          description?: string | null;
          category?: Database["public"]["Enums"]["support_ticket_category"];
          priority?: Database["public"]["Enums"]["support_ticket_priority"];
          status?: Database["public"]["Enums"]["support_ticket_status"];
          first_response_at?: string | null;
          resolved_at?: string | null;
          csat_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          created_by?: string | null;
          assigned_to?: string | null;
          subject?: string;
          description?: string | null;
          category?: Database["public"]["Enums"]["support_ticket_category"];
          priority?: Database["public"]["Enums"]["support_ticket_priority"];
          status?: Database["public"]["Enums"]["support_ticket_status"];
          first_response_at?: string | null;
          resolved_at?: string | null;
          csat_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      support_ticket_comments: {
        Row: {
          id: string;
          ticket_id: string;
          author_profile_id: string | null;
          body: string;
          attachments: Json;
          is_internal: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          author_profile_id?: string | null;
          body: string;
          attachments?: Json;
          is_internal?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          author_profile_id?: string | null;
          body?: string;
          attachments?: Json;
          is_internal?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      system_health_logs: {
        Row: {
          id: string;
          metric_key: string;
          metric_value: number | null;
          metadata: Json;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          metric_key: string;
          metric_value?: number | null;
          metadata?: Json;
          recorded_at?: string;
        };
        Update: {
          id?: string;
          metric_key?: string;
          metric_value?: number | null;
          metadata?: Json;
          recorded_at?: string;
        };
        Relationships: [];
      };
      backup_logs: {
        Row: {
          id: string;
          clinic_id: string | null;
          backup_type: "daily" | "weekly_external" | "manual_export" | "restore_test";
          status: "success" | "failed" | "in_progress";
          started_at: string;
          completed_at: string | null;
          size_bytes: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id?: string | null;
          backup_type: "daily" | "weekly_external" | "manual_export" | "restore_test";
          status?: "success" | "failed" | "in_progress";
          started_at?: string;
          completed_at?: string | null;
          size_bytes?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string | null;
          backup_type?: "daily" | "weekly_external" | "manual_export" | "restore_test";
          status?: "success" | "failed" | "in_progress";
          started_at?: string;
          completed_at?: string | null;
          size_bytes?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      demo_data_profiles: {
        Row: {
          id: string;
          vertical_key: "medico" | "odontologo" | "psicologo" | "alternativa" | "bienestar";
          clinic_id: string;
          display_name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vertical_key: "medico" | "odontologo" | "psicologo" | "alternativa" | "bienestar";
          clinic_id: string;
          display_name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vertical_key?: "medico" | "odontologo" | "psicologo" | "alternativa" | "bienestar";
          clinic_id?: string;
          display_name?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sales_demo_sessions: {
        Row: {
          id: string;
          vertical_key: string;
          viewer_identifier: string | null;
          referrer: string | null;
          started_at: string;
          ended_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          vertical_key: string;
          viewer_identifier?: string | null;
          referrer?: string | null;
          started_at?: string;
          ended_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          vertical_key?: string;
          viewer_identifier?: string | null;
          referrer?: string | null;
          started_at?: string;
          ended_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notification_templates: {
        Row: {
          id: string;
          clinic_id: string;
          template_key: Database["public"]["Enums"]["notification_template_key"];
          channel: Database["public"]["Enums"]["notification_channel"];
          subject: string | null;
          body: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          template_key: Database["public"]["Enums"]["notification_template_key"];
          channel?: Database["public"]["Enums"]["notification_channel"];
          subject?: string | null;
          body: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          template_key?: Database["public"]["Enums"]["notification_template_key"];
          channel?: Database["public"]["Enums"]["notification_channel"];
          subject?: string | null;
          body?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_logs: {
        Row: {
          id: string;
          clinic_id: string;
          appointment_id: string | null;
          patient_id: string | null;
          template_key: Database["public"]["Enums"]["notification_template_key"];
          channel: Database["public"]["Enums"]["notification_channel"];
          recipient: string | null;
          status: "sent" | "failed" | "skipped";
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          appointment_id?: string | null;
          patient_id?: string | null;
          template_key: Database["public"]["Enums"]["notification_template_key"];
          channel?: Database["public"]["Enums"]["notification_channel"];
          recipient?: string | null;
          status?: "sent" | "failed" | "skipped";
          error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          appointment_id?: string | null;
          patient_id?: string | null;
          template_key?: Database["public"]["Enums"]["notification_template_key"];
          channel?: Database["public"]["Enums"]["notification_channel"];
          recipient?: string | null;
          status?: "sent" | "failed" | "skipped";
          error?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      payment_providers_public: {
        Row: {
          id: string;
          clinic_id: string;
          provider_key: string;
          display_name: string;
          is_active: boolean;
          is_sandbox: boolean;
          created_at: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      current_clinic_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      current_role: {
        Args: Record<string, never>;
        Returns: Database["public"]["Enums"]["app_role"] | null;
      };
      is_super_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      current_professional_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      create_clinic_and_assign_owner: {
        Args: { p_commercial_name: string; p_slug: string };
        Returns: Database["public"]["Tables"]["clinics"]["Row"];
      };
      has_conflicting_appointment: {
        Args: {
          p_professional_id: string;
          p_starts_at: string;
          p_ends_at: string;
          p_exclude_appointment_id?: string | null;
        };
        Returns: boolean;
      };
      is_range_blocked: {
        Args: {
          p_professional_id: string;
          p_clinic_id: string;
          p_starts_at: string;
          p_ends_at: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role:
        | "super_admin"
        | "clinic_owner"
        | "professional"
        | "assistant"
        | "receptionist"
        | "finance_user"
        | "support_agent"
        | "patient";
      practitioner_type:
        | "medico_general"
        | "medico_especialista"
        | "odontologo"
        | "ortodoncista"
        | "psicologo"
        | "psiquiatra"
        | "fisioterapeuta"
        | "nutricionista"
        | "medicina_funcional_integrativa"
        | "medicina_alternativa"
        | "homeopatia"
        | "acupuntura_mtc"
        | "ayurveda"
        | "naturopatia"
        | "terapia_neural"
        | "quiropraxia"
        | "osteopatia"
        | "biomagnetismo"
        | "bioenergetica"
        | "reiki"
        | "biosanacion_biodescodificacion"
        | "coaching_mentoria_emocional"
        | "terapias_respiracion_meditacion"
        | "terapias_corporales_masajes"
        | "otro";
      visual_theme:
        | "clinico_moderno"
        | "bienestar_premium"
        | "integrativo"
        | "terapeutico_emocional"
        | "odontologico_premium"
        | "personalizado";
      service_classification:
        | "servicio_salud_habilitado"
        | "terapia_alternativa_complementaria"
        | "servicio_bienestar"
        | "servicio_educativo_acompanamiento"
        | "servicio_no_clinico";
      appointment_status:
        | "requested"
        | "pending_payment"
        | "pending_manual_confirmation"
        | "confirmed"
        | "paid"
        | "checked_in"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "rescheduled"
        | "no_show"
        | "expired";
      payment_status:
        | "pending"
        | "pending_confirmation"
        | "approved"
        | "rejected"
        | "cancelled"
        | "expired"
        | "refunded"
        | "partially_refunded"
        | "failed"
        | "manual_review";
      consent_document_type:
        | "privacy_policy"
        | "data_authorization"
        | "sensitive_data_authorization"
        | "informed_consent_general"
        | "teleconsultation_consent"
        | "service_specific_consent"
        | "cancellation_policy"
        | "refund_policy"
        | "terms_and_conditions"
        | "alternative_medicine_disclaimer"
        | "wellness_disclaimer"
        | "non_clinical_disclaimer";
      module_key:
        | "extra_professional"
        | "extra_location"
        | "extra_payment_gateway"
        | "whatsapp_automation"
        | "sms"
        | "advanced_telehealth"
        | "advanced_clinical_history"
        | "custom_domain"
        | "data_migration"
        | "extra_training"
        | "priority_support"
        | "advanced_therapeutic_packages"
        | "group_workshops"
        | "digital_resources"
        | "premium_reports"
        | "premium_visual_customization";
      support_ticket_category:
        | "acceso"
        | "agenda"
        | "pagos"
        | "pasarelas"
        | "recordatorios"
        | "pagina_publica"
        | "pacientes"
        | "reportes"
        | "diseno"
        | "soporte_legal_documentos"
        | "configuracion"
        | "error_tecnico"
        | "solicitud_mejora"
        | "backup_restauracion"
        | "seguridad";
      support_ticket_priority: "critical" | "high" | "medium" | "low";
      support_ticket_status:
        | "open"
        | "in_review"
        | "waiting_client"
        | "in_progress"
        | "resolved"
        | "closed"
        | "escalated";
      notification_channel: "email" | "whatsapp" | "sms";
      notification_template_key:
        | "appointment_confirmation"
        | "appointment_reminder_24h"
        | "appointment_reminder_2h"
        | "appointment_cancelled"
        | "appointment_rescheduled"
        | "payment_pending"
        | "payment_approved";
    };
    CompositeTypes: Record<string, never>;
  };
};
