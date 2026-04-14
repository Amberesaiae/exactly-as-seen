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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          batch_id: string | null
          created_at: string
          description: string
          event_type: string
          farm_id: string
          id: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          description: string
          event_type: string
          farm_id: string
          id?: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          description?: string
          event_type?: string
          farm_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_tasks: {
        Row: {
          batch_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string
          farm_id: string
          id: string
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          batch_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          farm_id: string
          id?: string
          task_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          batch_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          farm_id?: string
          id?: string
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_tasks_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_tasks_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      batches: {
        Row: {
          created_at: string
          current_day: number
          current_population: number
          current_week: number
          farm_id: string
          house_id: string | null
          id: string
          initial_quantity: number
          name: string
          notes: string | null
          phase: string
          production_system: string
          species: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_day?: number
          current_population?: number
          current_week?: number
          farm_id: string
          house_id?: string | null
          id?: string
          initial_quantity?: number
          name: string
          notes?: string | null
          phase?: string
          production_system?: string
          species?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_day?: number
          current_population?: number
          current_week?: number
          farm_id?: string
          house_id?: string | null
          id?: string
          initial_quantity?: number
          name?: string
          notes?: string | null
          phase?: string
          production_system?: string
          species?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "batches_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      egg_records: {
        Row: {
          batch_id: string
          broken: number
          created_at: string
          date: string
          dirty: number
          farm_id: string
          good: number
          id: string
          notes: string | null
          size_category: string
          total_eggs: number
        }
        Insert: {
          batch_id: string
          broken?: number
          created_at?: string
          date?: string
          dirty?: number
          farm_id: string
          good?: number
          id?: string
          notes?: string | null
          size_category?: string
          total_eggs?: number
        }
        Update: {
          batch_id?: string
          broken?: number
          created_at?: string
          date?: string
          dirty?: number
          farm_id?: string
          good?: number
          id?: string
          notes?: string | null
          size_category?: string
          total_eggs?: number
        }
        Relationships: [
          {
            foreignKeyName: "egg_records_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "egg_records_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      egg_sales: {
        Row: {
          buyer: string | null
          created_at: string
          date: string
          farm_id: string
          id: string
          notes: string | null
          quantity: number
          size_category: string
          total_amount: number
          unit_price: number
        }
        Insert: {
          buyer?: string | null
          created_at?: string
          date?: string
          farm_id: string
          id?: string
          notes?: string | null
          quantity?: number
          size_category?: string
          total_amount?: number
          unit_price?: number
        }
        Update: {
          buyer?: string | null
          created_at?: string
          date?: string
          farm_id?: string
          id?: string
          notes?: string | null
          quantity?: number
          size_category?: string
          total_amount?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "egg_sales_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          batch_id: string | null
          category: string
          created_at: string
          date: string
          description: string
          farm_id: string
          id: string
          source: string
          source_ref: string | null
        }
        Insert: {
          amount?: number
          batch_id?: string | null
          category?: string
          created_at?: string
          date?: string
          description: string
          farm_id: string
          id?: string
          source?: string
          source_ref?: string | null
        }
        Update: {
          amount?: number
          batch_id?: string | null
          category?: string
          created_at?: string
          date?: string
          description?: string
          farm_id?: string
          id?: string
          source?: string
          source_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farms: {
        Row: {
          created_at: string
          farm_type: string
          id: string
          location_district: string | null
          location_region: string | null
          name: string
          setup_complete: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          farm_type?: string
          id?: string
          location_district?: string | null
          location_region?: string | null
          name: string
          setup_complete?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          farm_type?: string
          id?: string
          location_district?: string | null
          location_region?: string | null
          name?: string
          setup_complete?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feed_formulations: {
        Row: {
          bag_size_kg: number
          bags_count: number
          batch_id: string | null
          created_at: string
          farm_id: string
          formulation_type: string
          id: string
          phase: string
          population: number
          species: string
          total_kg: number
        }
        Insert: {
          bag_size_kg?: number
          bags_count?: number
          batch_id?: string | null
          created_at?: string
          farm_id: string
          formulation_type?: string
          id?: string
          phase?: string
          population?: number
          species?: string
          total_kg?: number
        }
        Update: {
          bag_size_kg?: number
          bags_count?: number
          batch_id?: string | null
          created_at?: string
          farm_id?: string
          formulation_type?: string
          id?: string
          phase?: string
          population?: number
          species?: string
          total_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "feed_formulations_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_formulations_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_ingredients: {
        Row: {
          category: string
          formulation_id: string
          id: string
          name: string
          quantity_kg: number
          total_cost: number
          unit_price: number
        }
        Insert: {
          category?: string
          formulation_id: string
          id?: string
          name: string
          quantity_kg?: number
          total_cost?: number
          unit_price?: number
        }
        Update: {
          category?: string
          formulation_id?: string
          id?: string
          name?: string
          quantity_kg?: number
          total_cost?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "feed_ingredients_formulation_id_fkey"
            columns: ["formulation_id"]
            isOneToOne: false
            referencedRelation: "feed_formulations"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_schedules: {
        Row: {
          amount_per_bird_g: number
          batch_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          day: number
          farm_id: string
          id: string
          total_amount_kg: number
          week: number
        }
        Insert: {
          amount_per_bird_g?: number
          batch_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          day?: number
          farm_id: string
          id?: string
          total_amount_kg?: number
          week?: number
        }
        Update: {
          amount_per_bird_g?: number
          batch_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          day?: number
          farm_id?: string
          id?: string
          total_amount_kg?: number
          week?: number
        }
        Relationships: [
          {
            foreignKeyName: "feed_schedules_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_schedules_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      health_tasks: {
        Row: {
          batch_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          dose_per_gallon: number | null
          duration_days: number
          farm_id: string
          id: string
          notes: string | null
          product_name: string
          scheduled_date: string
          task_type: string
          updated_at: string
          withdrawal_egg_days: number
          withdrawal_meat_days: number
        }
        Insert: {
          batch_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          dose_per_gallon?: number | null
          duration_days?: number
          farm_id: string
          id?: string
          notes?: string | null
          product_name: string
          scheduled_date?: string
          task_type?: string
          updated_at?: string
          withdrawal_egg_days?: number
          withdrawal_meat_days?: number
        }
        Update: {
          batch_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          dose_per_gallon?: number | null
          duration_days?: number
          farm_id?: string
          id?: string
          notes?: string | null
          product_name?: string
          scheduled_date?: string
          task_type?: string
          updated_at?: string
          withdrawal_egg_days?: number
          withdrawal_meat_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "health_tasks_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_tasks_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      houses: {
        Row: {
          capacity: number
          created_at: string
          farm_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          farm_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          farm_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "houses_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      mortality_records: {
        Row: {
          batch_id: string
          cause: string | null
          count: number
          farm_id: string
          id: string
          notes: string | null
          recorded_at: string
        }
        Insert: {
          batch_id: string
          cause?: string | null
          count?: number
          farm_id: string
          id?: string
          notes?: string | null
          recorded_at?: string
        }
        Update: {
          batch_id?: string
          cause?: string | null
          count?: number
          farm_id?: string
          id?: string
          notes?: string | null
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mortality_records_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mortality_records_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
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
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      revenue: {
        Row: {
          amount: number
          batch_id: string | null
          buyer: string | null
          category: string
          created_at: string
          date: string
          description: string
          farm_id: string
          id: string
        }
        Insert: {
          amount?: number
          batch_id?: string | null
          buyer?: string | null
          category?: string
          created_at?: string
          date?: string
          description: string
          farm_id: string
          id?: string
        }
        Update: {
          amount?: number
          batch_id?: string | null
          buyer?: string | null
          category?: string
          created_at?: string
          date?: string
          description?: string
          farm_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_items: {
        Row: {
          category: string
          created_at: string
          current_quantity: number
          farm_id: string
          id: string
          name: string
          reorder_threshold: number
          unit: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          current_quantity?: number
          farm_id: string
          id?: string
          name: string
          reorder_threshold?: number
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          current_quantity?: number
          farm_id?: string
          id?: string
          name?: string
          reorder_threshold?: number
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_items_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transactions: {
        Row: {
          created_at: string
          date: string
          farm_id: string
          id: string
          notes: string | null
          quantity: number
          source_ref: string | null
          stock_item_id: string
          total_cost: number
          transaction_type: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          date?: string
          farm_id: string
          id?: string
          notes?: string | null
          quantity?: number
          source_ref?: string | null
          stock_item_id: string
          total_cost?: number
          transaction_type?: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          date?: string
          farm_id?: string
          id?: string
          notes?: string | null
          quantity?: number
          source_ref?: string | null
          stock_item_id?: string
          total_cost?: number
          transaction_type?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_transactions_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          cost_privacy_enabled: boolean
          created_at: string
          currency: string
          id: string
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_privacy_enabled?: boolean
          created_at?: string
          currency?: string
          id?: string
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_privacy_enabled?: boolean
          created_at?: string
          currency?: string
          id?: string
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vaccination_schedule: {
        Row: {
          administered: boolean
          administered_at: string | null
          batch_id: string
          created_at: string
          farm_id: string
          id: string
          scheduled_date: string
          scheduled_week: number
          vaccine_name: string
        }
        Insert: {
          administered?: boolean
          administered_at?: string | null
          batch_id: string
          created_at?: string
          farm_id: string
          id?: string
          scheduled_date: string
          scheduled_week?: number
          vaccine_name: string
        }
        Update: {
          administered?: boolean
          administered_at?: string | null
          batch_id?: string
          created_at?: string
          farm_id?: string
          id?: string
          scheduled_date?: string
          scheduled_week?: number
          vaccine_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccination_schedule_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccination_schedule_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      water_records: {
        Row: {
          batch_id: string
          created_at: string
          date: string
          farm_id: string
          gallons_consumed: number
          id: string
          notes: string | null
          temperature_c: number | null
        }
        Insert: {
          batch_id: string
          created_at?: string
          date?: string
          farm_id: string
          gallons_consumed?: number
          id?: string
          notes?: string | null
          temperature_c?: number | null
        }
        Update: {
          batch_id?: string
          created_at?: string
          date?: string
          farm_id?: string
          gallons_consumed?: number
          id?: string
          notes?: string | null
          temperature_c?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "water_records_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "water_records_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
