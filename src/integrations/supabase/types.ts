export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointment_services: {
        Row: {
          appointment_id: string
          created_at: string
          id: string
          price_at_time: number
          service_id: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          id?: string
          price_at_time: number
          service_id: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          id?: string
          price_at_time?: number
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          cabin_id: string | null
          client_id: string
          created_at: string
          end_time: string | null
          id: string
          notes: string | null
          specialist_id: string | null
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"]
          total_price: number | null
          updated_at: string
          confirmation_token: string | null
          confirmed_at: string | null
          reminder_sent_at: string | null
        }
        Insert: {
          cabin_id?: string | null
          client_id: string
          created_at?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          specialist_id?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
          total_price?: number | null
          updated_at?: string
          confirmation_token?: string | null
          confirmed_at?: string | null
          reminder_sent_at?: string | null
        }
        Update: {
          cabin_id?: string | null
          client_id?: string
          created_at?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          specialist_id?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          total_price?: number | null
          updated_at?: string
          confirmation_token?: string | null
          confirmed_at?: string | null
          reminder_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      cabins: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_packages: {
        Row: {
          client_id: string
          created_at: string
          expires_at: string | null
          id: string
          notes: string | null
          package_id: string
          purchased_at: string
          sessions_total: number
          sessions_used: number
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          package_id: string
          purchased_at?: string
          sessions_total: number
          sessions_used?: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          package_id?: string
          purchased_at?: string
          sessions_total?: number
          sessions_used?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_packages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      evaluation_product_recommendations: {
        Row: {
          created_at: string
          evaluation_id: string
          id: string
          notes: string | null
          product_id: string
        }
        Insert: {
          created_at?: string
          evaluation_id: string
          id?: string
          notes?: string | null
          product_id: string
        }
        Update: {
          created_at?: string
          evaluation_id?: string
          id?: string
          notes?: string | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_product_recommendations_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "facial_evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_product_recommendations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_product_recommendations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_staff_view"
            referencedColumns: ["id"]
          },
        ]
      }
      facial_evaluations: {
        Row: {
          allergy_details: string | null
          cleaning_frequency: Database["public"]["Enums"]["cleaning_frequency_type"]
          cleanser_brand: string | null
          client_id: string
          cream_brand: string | null
          created_at: string
          has_allergies: boolean
          has_skin_disease: boolean
          id: string
          medication_details: string | null
          pregnancy_lactation: boolean
          recent_treatments: boolean
          removes_makeup_properly: boolean
          serum_brand: string | null
          skin_analysis: string | null
          skin_disease_details: string | null
          skin_type: Database["public"]["Enums"]["skin_type"]
          smokes_alcohol: boolean
          sunscreen_brand: string | null
          takes_medication: boolean
          treatment_details: string | null
          treatment_performed: string | null
          updated_at: string
          uses_exfoliants: boolean
          uses_makeup: boolean
          uses_sunscreen: boolean
        }
        Insert: {
          allergy_details?: string | null
          cleaning_frequency?: Database["public"]["Enums"]["cleaning_frequency_type"]
          cleanser_brand?: string | null
          client_id: string
          cream_brand?: string | null
          created_at?: string
          has_allergies?: boolean
          has_skin_disease?: boolean
          id?: string
          medication_details?: string | null
          pregnancy_lactation?: boolean
          recent_treatments?: boolean
          removes_makeup_properly?: boolean
          serum_brand?: string | null
          skin_analysis?: string | null
          skin_disease_details?: string | null
          skin_type: Database["public"]["Enums"]["skin_type"]
          smokes_alcohol?: boolean
          sunscreen_brand?: string | null
          takes_medication?: boolean
          treatment_details?: string | null
          treatment_performed?: string | null
          updated_at?: string
          uses_exfoliants?: boolean
          uses_makeup?: boolean
          uses_sunscreen?: boolean
        }
        Update: {
          allergy_details?: string | null
          cleaning_frequency?: Database["public"]["Enums"]["cleaning_frequency_type"]
          cleanser_brand?: string | null
          client_id?: string
          cream_brand?: string | null
          created_at?: string
          has_allergies?: boolean
          has_skin_disease?: boolean
          id?: string
          medication_details?: string | null
          pregnancy_lactation?: boolean
          recent_treatments?: boolean
          removes_makeup_properly?: boolean
          serum_brand?: string | null
          skin_analysis?: string | null
          skin_disease_details?: string | null
          skin_type?: Database["public"]["Enums"]["skin_type"]
          smokes_alcohol?: boolean
          sunscreen_brand?: string | null
          takes_medication?: boolean
          treatment_details?: string | null
          treatment_performed?: string | null
          updated_at?: string
          uses_exfoliants?: boolean
          uses_makeup?: boolean
          uses_sunscreen?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "facial_evaluations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          cost_price: number
          created_at: string
          id: string
          name: string
          qr_code: string | null
          sale_price: number
          sku: string | null
          stock_level: number
          supplier: string | null
          updated_at: string
        }
        Insert: {
          cost_price?: number
          created_at?: string
          id?: string
          name: string
          qr_code?: string | null
          sale_price?: number
          sku?: string | null
          stock_level?: number
          supplier?: string | null
          updated_at?: string
        }
        Update: {
          cost_price?: number
          created_at?: string
          id?: string
          name?: string
          qr_code?: string | null
          sale_price?: number
          sku?: string | null
          stock_level?: number
          supplier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          service_id: string | null
          total_sessions: number
          updated_at: string
          validity_days: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
          service_id?: string | null
          total_sessions: number
          updated_at?: string
          validity_days?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          service_id?: string | null
          total_sessions?: number
          updated_at?: string
          validity_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "packages_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          subscription_status: string
          trial_ends_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          subscription_status?: string
          trial_ends_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          subscription_status?: string
          trial_ends_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          item_name: string
          product_id: string | null
          quantity: number
          sale_id: string
          service_id: string | null
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_name: string
          product_id?: string | null
          quantity?: number
          sale_id: string
          service_id?: string | null
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          item_name?: string
          product_id?: string | null
          quantity?: number
          sale_id?: string
          service_id?: string | null
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_staff_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          notes: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          duration: number
          id: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration?: number
          id?: string
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration?: number
          id?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      inventory_staff_view: {
        Row: {
          cost_price: number | null
          created_at: string | null
          id: string | null
          name: string | null
          qr_code: string | null
          sale_price: number | null
          sku: string | null
          stock_level: number | null
          supplier: string | null
          updated_at: string | null
        }
        Insert: {
          cost_price?: never
          created_at?: string | null
          id?: string | null
          name?: string | null
          qr_code?: string | null
          sale_price?: number | null
          sku?: string | null
          stock_level?: number | null
          supplier?: string | null
          updated_at?: string | null
        }
        Update: {
          cost_price?: never
          created_at?: string | null
          id?: string | null
          name?: string | null
          qr_code?: string | null
          sale_price?: number | null
          sku?: string | null
          stock_level?: number | null
          supplier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_first_admin: { Args: { _user_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff_or_admin: { Args: { _user_id: string }; Returns: boolean }
      public_get_appointment_by_token: {
        Args: {
          p_token: string
        }
        Returns: Json
      }
      public_respond_appointment: {
        Args: {
          p_token: string
          p_response: string
        }
        Returns: Json
      }
      use_package_session: {
        Args: { p_client_package_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff"
      appointment_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "in_room"
        | "no_show"
      cleaning_frequency_type: "once" | "twice" | "occasional"
      skin_type:
        | "normal"
        | "dry"
        | "combination"
        | "oily"
        | "sensitive"
        | "acneic"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff"],
      appointment_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "in_room",
        "no_show",
      ],
      cleaning_frequency_type: ["once", "twice", "occasional"],
      skin_type: [
        "normal",
        "dry",
        "combination",
        "oily",
        "sensitive",
        "acneic",
      ],
    },
  },
} as const
