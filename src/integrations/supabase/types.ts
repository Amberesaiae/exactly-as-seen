export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
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
          cycle_length_weeks: number
          duck_type: string | null
          farm_id: string
          has_active_withdrawal: boolean
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
          termination_reason: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_day?: number
          current_population?: number
          current_week?: number
          cycle_length_weeks?: number
          duck_type?: string | null
          farm_id: string
          has_active_withdrawal?: boolean
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
          termination_reason?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_day?: number
          current_population?: number
          current_week?: number
          cycle_length_weeks?: number
          duck_type?: string | null
          farm_id?: string
          has_active_withdrawal?: boolean
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
          termination_reason?: string | null
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
      config_overrides: {
        Row: {
          created_at: string
          farm_id: string
          id: string
          key: string
          value: string
        }
        Insert: {
          created_at?: string
          farm_id: string
          id?: string
          key: string
          value: string
        }
        Update: {
          created_at?: string
          farm_id?: string
          id?: string
          key?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "config_overrides_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      container_types: {
        Row: {
          id: string
          name: string
          volume_gal: number
          volume_l: number
        }
        Insert: {
          id: string
          name: string
          volume_gal: number
          volume_l: number
        }
        Update: {
          id?: string
          name?: string
          volume_gal?: number
          volume_l?: number
        }
        Relationships: []
      }
      egg_collections: {
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
          batch_id: string | null
          buyer: string | null
          crates_sold: number
          created_at: string
          date: string
          farm_id: string
          id: string
          ledger_entry_id: string | null
          looses_sold: number
          notes: string | null
          payment_method: string
          price_per_crate_pesewas: number
          price_per_loose_pesewas: number
          quantity: number
          size_category: string
          total_amount: number
          total_revenue_pesewas: number
          unit_price: number
        }
        Insert: {
          batch_id?: string | null
          buyer?: string | null
          crates_sold?: number
          created_at?: string
          date?: string
          farm_id: string
          id?: string
          ledger_entry_id?: string | null
          looses_sold?: number
          notes?: string | null
          payment_method?: string
          price_per_crate_pesewas?: number
          price_per_loose_pesewas?: number
          quantity?: number
          size_category?: string
          total_amount?: number
          total_revenue_pesewas?: number
          unit_price?: number
        }
        Update: {
          batch_id?: string | null
          buyer?: string | null
          crates_sold?: number
          created_at?: string
          date?: string
          farm_id?: string
          id?: string
          ledger_entry_id?: string | null
          looses_sold?: number
          notes?: string | null
          payment_method?: string
          price_per_crate_pesewas?: number
          price_per_loose_pesewas?: number
          quantity?: number
          size_category?: string
          total_amount?: number
          total_revenue_pesewas?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "egg_sales_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
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
          amount_pesewas: number | null
          batch_id: string | null
          category: string
          created_at: string
          date: string
          description: string
          farm_id: string
          id: string
          payment_method: string | null
          payment_status: string
          source: string
          source_ref: string | null
        }
        Insert: {
          amount?: number
          amount_pesewas?: number | null
          batch_id?: string | null
          category?: string
          created_at?: string
          date?: string
          description: string
          farm_id: string
          id?: string
          payment_method?: string | null
          payment_status?: string
          source?: string
          source_ref?: string | null
        }
        Update: {
          amount?: number
          amount_pesewas?: number | null
          batch_id?: string | null
          category?: string
          created_at?: string
          date?: string
          description?: string
          farm_id?: string
          id?: string
          payment_method?: string | null
          payment_status?: string
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
          currency: string
          egg_low_inventory_crates: number
          farm_type: string
          id: string
          location_district: string | null
          location_region: string | null
          name: string
          setup_complete: boolean
          timezone: string
          updated_at: string
          user_id: string
          water_source_chlorinated: boolean
          water_rate_per_liter_pesewas: number | null
        }
        Insert: {
          created_at?: string
          currency?: string
          egg_low_inventory_crates?: number
          farm_type?: string
          id?: string
          location_district?: string | null
          location_region?: string | null
          name: string
          setup_complete?: boolean
          timezone?: string
          updated_at?: string
          user_id: string
          water_source_chlorinated?: boolean
          water_rate_per_liter_pesewas?: number | null
        }
        Update: {
          created_at?: string
          currency?: string
          egg_low_inventory_crates?: number
          farm_type?: string
          id?: string
          location_district?: string | null
          location_region?: string | null
          name?: string
          setup_complete?: boolean
          timezone?: string
          updated_at?: string
          user_id?: string
          water_source_chlorinated?: boolean
          water_rate_per_liter_pesewas?: number | null
        }
        Relationships: []
      }
            feed_logs: {
        Row: {
          id: string
          farm_id: string
          batch_id: string
          date: string
          quantity_kg: number
          feed_type: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          farm_id: string
          batch_id: string
          date?: string
          quantity_kg?: number
          feed_type?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          farm_id?: string
          batch_id?: string
          date?: string
          quantity_kg?: number
          feed_type?: string | null
          notes?: string | null
          created_at?: string
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
      feed_recipes: {
        Row: {
          created_at: string
          description: string | null
          farm_id: string
          id: string
          ingredients: Json
          name: string
          nutritional_profile: Json | null
          species: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          farm_id: string
          id?: string
          ingredients: Json
          name: string
          nutritional_profile?: Json | null
          species: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          farm_id?: string
          id?: string
          ingredients?: Json
          name?: string
          nutritional_profile?: Json | null
          species?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_recipes_farm_id_fkey"
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
          total_cost_pesewas: number | null
          unit_price: number
          unit_price_pesewas: number | null
          stock_item_id: string | null
        }
        Insert: {
          category?: string
          formulation_id: string
          id?: string
          name: string
          quantity_kg?: number
          total_cost?: number
          total_cost_pesewas?: number | null
          unit_price?: number
          unit_price_pesewas?: number | null
          stock_item_id?: string | null
        }
        Update: {
          category?: string
          formulation_id?: string
          id?: string
          name?: string
          quantity_kg?: number
          total_cost?: number
          total_cost_pesewas?: number | null
          unit_price?: number
          unit_price_pesewas?: number | null
          stock_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_ingredients_formulation_id_fkey"
            columns: ["formulation_id"]
            isOneToOne: false
            referencedRelation: "feed_formulations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_ingredients_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
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
          bird_count: number | null
          blocked_reason: string | null
          completed: boolean
          completed_at: string | null
          computed_dose_amount: number | null
          computed_dose_unit: string | null
          container_count: number | null
          container_type_id: string | null
          cost_pesewas: number | null
          created_at: string
          delivery_method: string | null
          dose_per_gallon: number | null
          duration_days: number
          farm_id: string
          id: string
          medication_id: string | null
          notes: string | null
          product_name: string
          scheduled_date: string
          task_type: string
          updated_at: string
          water_volume_l: number | null
          withdrawal_egg_days: number
          withdrawal_eggs_until: string | null
          withdrawal_meat_days: number
          withdrawal_meat_until: string | null
        }
        Insert: {
          batch_id: string
          bird_count?: number | null
          blocked_reason?: string | null
          completed?: boolean
          completed_at?: string | null
          computed_dose_amount?: number | null
          computed_dose_unit?: string | null
          container_count?: number | null
          container_type_id?: string | null
          cost_pesewas?: number | null
          created_at?: string
          delivery_method?: string | null
          dose_per_gallon?: number | null
          duration_days?: number
          farm_id: string
          id?: string
          medication_id?: string | null
          notes?: string | null
          product_name: string
          scheduled_date?: string
          task_type?: string
          updated_at?: string
          water_volume_l?: number | null
          withdrawal_egg_days?: number
          withdrawal_eggs_until?: string | null
          withdrawal_meat_days?: number
          withdrawal_meat_until?: string | null
        }
        Update: {
          batch_id?: string
          bird_count?: number | null
          blocked_reason?: string | null
          completed?: boolean
          completed_at?: string | null
          computed_dose_amount?: number | null
          computed_dose_unit?: string | null
          container_count?: number | null
          container_type_id?: string | null
          cost_pesewas?: number | null
          created_at?: string
          delivery_method?: string | null
          dose_per_gallon?: number | null
          duration_days?: number
          farm_id?: string
          id?: string
          medication_id?: string | null
          notes?: string | null
          product_name?: string
          scheduled_date?: string
          task_type?: string
          updated_at?: string
          water_volume_l?: number | null
          withdrawal_egg_days?: number
          withdrawal_eggs_until?: string | null
          withdrawal_meat_days?: number
          withdrawal_meat_until?: string | null
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
          occupied_by_batch_id: string | null
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          farm_id: string
          id?: string
          name: string
          occupied_by_batch_id?: string | null
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          farm_id?: string
          id?: string
          name?: string
          occupied_by_batch_id?: string | null
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
          {
            foreignKeyName: "houses_occupied_by_batch_id_fkey"
            columns: ["occupied_by_batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      idempotency_keys: {
        Row: {
          expires_at: string
          farm_id: string
          id: string
          key: string
        }
        Insert: {
          expires_at: string
          farm_id: string
          id?: string
          key: string
        }
        Update: {
          expires_at?: string
          farm_id?: string
          id?: string
          key?: string
        }
        Relationships: [
          {
            foreignKeyName: "idempotency_keys_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          calcium_pct: number
          category: string
          contains_aflatoxin_risk: boolean
          contains_gossypol: boolean
          energy_kcal_per_kg: number
          id: string
          lysine_pct: number
          max_share_pct: number
          methionine_pct: number
          name: string
          phosphorus_pct: number
          protein_pct: number
        }
        Insert: {
          calcium_pct?: number
          category: string
          contains_aflatoxin_risk?: boolean
          contains_gossypol?: boolean
          energy_kcal_per_kg?: number
          id: string
          lysine_pct?: number
          max_share_pct?: number
          methionine_pct?: number
          name: string
          phosphorus_pct?: number
          protein_pct?: number
        }
        Update: {
          calcium_pct?: number
          category?: string
          contains_aflatoxin_risk?: boolean
          contains_gossypol?: boolean
          energy_kcal_per_kg?: number
          id?: string
          lysine_pct?: number
          max_share_pct?: number
          methionine_pct?: number
          name?: string
          phosphorus_pct?: number
          protein_pct?: number
        }
        Relationships: []
      }
      medications: {
        Row: {
          category: string
          contains_calcium: boolean
          delivery_method: string
          dose_per_gallon: number | null
          id: string
          is_activated_charcoal: boolean
          is_live_vaccine: boolean
          is_sulfa: boolean
          is_tetracycline: boolean
          name: string
          withdrawal_egg_days: number
          withdrawal_meat_days: number
        }
        Insert: {
          category: string
          contains_calcium?: boolean
          delivery_method: string
          dose_per_gallon?: number | null
          id: string
          is_activated_charcoal?: boolean
          is_live_vaccine?: boolean
          is_sulfa?: boolean
          is_tetracycline?: boolean
          name: string
          withdrawal_egg_days?: number
          withdrawal_meat_days?: number
        }
        Update: {
          category?: string
          contains_calcium?: boolean
          delivery_method?: string
          dose_per_gallon?: number | null
          id?: string
          is_activated_charcoal?: boolean
          is_live_vaccine?: boolean
          is_sulfa?: boolean
          is_tetracycline?: boolean
          name?: string
          withdrawal_egg_days?: number
          withdrawal_meat_days?: number
        }
        Relationships: []
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
      nutritional_requirements: {
        Row: {
          calcium_max: number
          calcium_min: number
          duck_type: string | null
          energy_max: number
          energy_min: number
          id: string
          lysine_min: number
          methionine_min: number
          phase: string
          phosphorus_min: number
          protein_min: number
          species: string
        }
        Insert: {
          calcium_max?: number
          calcium_min?: number
          duck_type?: string | null
          energy_max?: number
          energy_min?: number
          id?: string
          lysine_min?: number
          methionine_min?: number
          phase: string
          phosphorus_min?: number
          protein_min?: number
          species: string
        }
        Update: {
          calcium_max?: number
          calcium_min?: number
          duck_type?: string | null
          energy_max?: number
          energy_min?: number
          id?: string
          lysine_min?: number
          methionine_min?: number
          phase?: string
          phosphorus_min?: number
          protein_min?: number
          species?: string
        }
        Relationships: []
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
          amount_pesewas: number | null
          batch_id: string | null
          buyer: string | null
          category: string
          created_at: string
          date: string
          description: string
          farm_id: string
          id: string
          payment_method: string | null
          payment_status: string
          source: string
          source_ref: string | null
        }
        Insert: {
          amount?: number
          amount_pesewas?: number | null
          batch_id?: string | null
          buyer?: string | null
          category?: string
          created_at?: string
          date?: string
          description: string
          farm_id: string
          id?: string
          payment_method?: string | null
          payment_status?: string
          source?: string
          source_ref?: string | null
        }
        Update: {
          amount?: number
          amount_pesewas?: number | null
          batch_id?: string | null
          buyer?: string | null
          category?: string
          created_at?: string
          date?: string
          description?: string
          farm_id?: string
          id?: string
          payment_method?: string | null
          payment_status?: string
          source?: string
          source_ref?: string | null
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
      stock_allocations: {
        Row: {
          allocated_at: string
          batch_id: string | null
          farm_id: string
          id: string
          lot_id: string
          qty_allocated: number
          reason: string
          source_ref: string | null
        }
        Insert: {
          allocated_at?: string
          batch_id?: string | null
          farm_id: string
          id?: string
          lot_id: string
          qty_allocated?: number
          reason: string
          source_ref?: string | null
        }
        Update: {
          allocated_at?: string
          batch_id?: string | null
          farm_id?: string
          id?: string
          lot_id?: string
          qty_allocated?: number
          reason?: string
          source_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_allocations_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_allocations_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_allocations_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "stock_lots"
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
          unit_price_pesewas: number | null
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
          unit_price_pesewas?: number | null
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
          unit_price_pesewas?: number | null
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
      stock_lots: {
        Row: {
          expiry_date: string | null
          farm_id: string
          id: string
          qty_on_hand: number
          quality_grade: string
          received_at: string
          stock_item_id: string
          unit_price_pesewas: number
        }
        Insert: {
          expiry_date?: string | null
          farm_id: string
          id?: string
          qty_on_hand?: number
          quality_grade?: string
          received_at?: string
          stock_item_id: string
          unit_price_pesewas?: number
        }
        Update: {
          expiry_date?: string | null
          farm_id?: string
          id?: string
          qty_on_hand?: number
          quality_grade?: string
          received_at?: string
          stock_item_id?: string
          unit_price_pesewas?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_lots_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_lots_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
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
          total_cost_pesewas: number | null
          transaction_type: string
          unit_price: number
          unit_price_pesewas: number | null
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
          total_cost_pesewas?: number | null
          transaction_type?: string
          unit_price?: number
          unit_price_pesewas?: number | null
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
          total_cost_pesewas?: number | null
          transaction_type?: string
          unit_price?: number
          unit_price_pesewas?: number | null
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
          cost_privacy_pin: string | null
          created_at: string
          currency: string
          id: string
          theme: string
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_privacy_enabled?: boolean
          cost_privacy_pin?: string | null
          created_at?: string
          currency?: string
          id?: string
          theme?: string
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_privacy_enabled?: boolean
          cost_privacy_pin?: string | null
          created_at?: string
          currency?: string
          id?: string
          theme?: string
          timezone?: string | null
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

