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
      agencies: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          install_date: string
          logo_url: string | null
          name: string
          owner_user_id: string | null
          phone: string | null
          siret: string | null
          subscription_active: boolean
          subscription_plan: string | null
          subscription_started_at: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          install_date?: string
          logo_url?: string | null
          name: string
          owner_user_id?: string | null
          phone?: string | null
          siret?: string | null
          subscription_active?: boolean
          subscription_plan?: string | null
          subscription_started_at?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          install_date?: string
          logo_url?: string | null
          name?: string
          owner_user_id?: string | null
          phone?: string | null
          siret?: string | null
          subscription_active?: boolean
          subscription_plan?: string | null
          subscription_started_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          ai_extracted_data: Json | null
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          expense_date: string | null
          file_type: string | null
          file_url: string | null
          id: string
          invoice_number: string | null
          notes: string | null
          source: string
          subcategory: string | null
          supplier_name: string | null
          telegram_file_id: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          ai_extracted_data?: Json | null
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          source?: string
          subcategory?: string | null
          supplier_name?: string | null
          telegram_file_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          ai_extracted_data?: Json | null
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          source?: string
          subcategory?: string | null
          supplier_name?: string | null
          telegram_file_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          client_adresse: string | null
          client_nom: string
          created_at: string
          created_by: string | null
          deposit_amount: number | null
          id: string
          invoice_number: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          payment_status: string
          pdf_url: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          amount?: number
          client_adresse?: string | null
          client_nom: string
          created_at?: string
          created_by?: string | null
          deposit_amount?: number | null
          id?: string
          invoice_number: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string
          pdf_url?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          amount?: number
          client_adresse?: string | null
          client_nom?: string
          created_at?: string
          created_by?: string | null
          deposit_amount?: number | null
          id?: string
          invoice_number?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string
          pdf_url?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prospects: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
          vehicle_interest: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          vehicle_interest?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          vehicle_interest?: string | null
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          article_name: string
          created_at: string
          id: string
          quantity: number
          quote_id: string
          unit_price: number | null
        }
        Insert: {
          article_name: string
          created_at?: string
          id?: string
          quantity?: number
          quote_id: string
          unit_price?: number | null
        }
        Update: {
          article_name?: string
          created_at?: string
          id?: string
          quantity?: number
          quote_id?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          photo_urls: string[] | null
          status: string
          supplier_id: string | null
          total_amount: number | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          photo_urls?: string[] | null
          status?: string
          supplier_id?: string | null
          total_amount?: number | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          photo_urls?: string[] | null
          status?: string
          supplier_id?: string | null
          total_amount?: number | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          telegram: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          telegram?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          telegram?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      trade_ins: {
        Row: {
          created_at: string
          desired_amount: number | null
          email: string
          full_name: string
          id: string
          mileage: number
          notes: string | null
          phone: string
          photo_urls: string[] | null
          registration: string
          rgpd_consent: boolean
          rgpd_consent_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          desired_amount?: number | null
          email: string
          full_name: string
          id?: string
          mileage: number
          notes?: string | null
          phone: string
          photo_urls?: string[] | null
          registration: string
          rgpd_consent?: boolean
          rgpd_consent_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          desired_amount?: number | null
          email?: string
          full_name?: string
          id?: string
          mileage?: number
          notes?: string | null
          phone?: string
          photo_urls?: string[] | null
          registration?: string
          rgpd_consent?: boolean
          rgpd_consent_date?: string | null
          status?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      vehicle_events: {
        Row: {
          client_name: string | null
          created_at: string
          event_date: string
          event_time: string | null
          event_type: string
          id: string
          notes: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          event_date: string
          event_time?: string | null
          event_type: string
          id?: string
          notes?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          client_name?: string | null
          created_at?: string
          event_date?: string
          event_time?: string | null
          event_type?: string
          id?: string
          notes?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_events_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_works: {
        Row: {
          client_visible: boolean
          cost: number
          created_at: string
          designation: string
          id: string
          intervention_date: string | null
          intervention_km: number | null
          vehicle_id: string
        }
        Insert: {
          client_visible?: boolean
          cost?: number
          created_at?: string
          designation: string
          id?: string
          intervention_date?: string | null
          intervention_km?: number | null
          vehicle_id: string
        }
        Update: {
          client_visible?: boolean
          cost?: number
          created_at?: string
          designation?: string
          id?: string
          intervention_date?: string | null
          intervention_km?: number | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_works_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string
          color: string | null
          created_at: string
          description: string | null
          fuel_type: string | null
          id: string
          mileage: number | null
          model: string
          photo_url: string | null
          photo_urls: string[] | null
          police_number: number | null
          purchase_price: number | null
          registration: string
          selling_price: number | null
          status: string
          updated_at: string
          version: string | null
          year: number | null
        }
        Insert: {
          brand: string
          color?: string | null
          created_at?: string
          description?: string | null
          fuel_type?: string | null
          id?: string
          mileage?: number | null
          model: string
          photo_url?: string | null
          photo_urls?: string[] | null
          police_number?: number | null
          purchase_price?: number | null
          registration: string
          selling_price?: number | null
          status?: string
          updated_at?: string
          version?: string | null
          year?: number | null
        }
        Update: {
          brand?: string
          color?: string | null
          created_at?: string
          description?: string | null
          fuel_type?: string | null
          id?: string
          mileage?: number | null
          model?: string
          photo_url?: string | null
          photo_urls?: string[] | null
          police_number?: number | null
          purchase_price?: number | null
          registration?: string
          selling_price?: number | null
          status?: string
          updated_at?: string
          version?: string | null
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "commercial" | "comptable" | "dev"
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
      app_role: ["admin", "commercial", "comptable", "dev"],
    },
  },
} as const
