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
      activity_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          project_id: string | null
          target_id: string | null
          target_type: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          target_id?: string | null
          target_type?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          target_id?: string | null
          target_type?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      artboards: {
        Row: {
          archived_at: string | null
          background_color: string | null
          background_type: string | null
          created_at: string
          current_image_url: string | null
          generated_prompt: string | null
          height: number
          id: string
          image_metadata: Json | null
          model_info: string | null
          name: string
          preset_size: string | null
          project_id: string
          scene_json: Json
          sort_order: number
          updated_at: string
          user_id: string
          width: number
        }
        Insert: {
          archived_at?: string | null
          background_color?: string | null
          background_type?: string | null
          created_at?: string
          current_image_url?: string | null
          generated_prompt?: string | null
          height?: number
          id?: string
          image_metadata?: Json | null
          model_info?: string | null
          name?: string
          preset_size?: string | null
          project_id: string
          scene_json?: Json
          sort_order?: number
          updated_at?: string
          user_id: string
          width?: number
        }
        Update: {
          archived_at?: string | null
          background_color?: string | null
          background_type?: string | null
          created_at?: string
          current_image_url?: string | null
          generated_prompt?: string | null
          height?: number
          id?: string
          image_metadata?: Json | null
          model_info?: string | null
          name?: string
          preset_size?: string | null
          project_id?: string
          scene_json?: Json
          sort_order?: number
          updated_at?: string
          user_id?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "artboards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_type: string
          created_at: string
          file_size: number | null
          file_type: string
          file_url: string
          height: number | null
          id: string
          is_shared: boolean | null
          metadata: Json | null
          mime_type: string | null
          name: string
          project_id: string | null
          tags: string[] | null
          user_id: string
          width: number | null
          workspace_id: string | null
        }
        Insert: {
          asset_type?: string
          created_at?: string
          file_size?: number | null
          file_type?: string
          file_url: string
          height?: number | null
          id?: string
          is_shared?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          name: string
          project_id?: string | null
          tags?: string[] | null
          user_id: string
          width?: number | null
          workspace_id?: string | null
        }
        Update: {
          asset_type?: string
          created_at?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          height?: number | null
          id?: string
          is_shared?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          name?: string
          project_id?: string | null
          tags?: string[] | null
          user_id?: string
          width?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_kits: {
        Row: {
          colors: Json | null
          created_at: string
          fonts: Json | null
          id: string
          is_shared: boolean | null
          logo_asset_id: string | null
          logo_url: string | null
          name: string
          secondary_colors: Json | null
          style_notes: string | null
          style_preferences: Json | null
          typography: Json | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          colors?: Json | null
          created_at?: string
          fonts?: Json | null
          id?: string
          is_shared?: boolean | null
          logo_asset_id?: string | null
          logo_url?: string | null
          name?: string
          secondary_colors?: Json | null
          style_notes?: string | null
          style_preferences?: Json | null
          typography?: Json | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          colors?: Json | null
          created_at?: string
          fonts?: Json | null
          id?: string
          is_shared?: boolean | null
          logo_asset_id?: string | null
          logo_url?: string | null
          name?: string
          secondary_colors?: Json | null
          style_notes?: string | null
          style_preferences?: Json | null
          typography?: Json | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_kits_logo_asset_id_fkey"
            columns: ["logo_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_kits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_ledger: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          operation: string
          related_usage_event_id: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          amount: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          operation: string
          related_usage_event_id?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          operation?: string
          related_usage_event_id?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_ledger_related_usage_event_id_fkey"
            columns: ["related_usage_event_id"]
            isOneToOne: false
            referencedRelation: "usage_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_ledger_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          personal_workspace_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          personal_workspace_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          personal_workspace_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_personal_workspace_id_fkey"
            columns: ["personal_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          archived_at: string | null
          created_at: string
          description: string | null
          id: string
          last_opened_at: string | null
          name: string
          preview_image_url: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          last_opened_at?: string | null
          name: string
          preview_image_url?: string | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          last_opened_at?: string | null
          name?: string
          preview_image_url?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      scene_versions: {
        Row: {
          artboard_id: string | null
          cost_units: number | null
          created_at: string
          generated_prompt: string | null
          generation_mode: string | null
          id: string
          image_metadata: Json | null
          image_url: string | null
          model_info: string | null
          provider: string | null
          scene_id: string
          scene_json: Json
          source_prompt: string | null
          thumbnail_url: string | null
          user_id: string
          version_label: string | null
          version_number: number
        }
        Insert: {
          artboard_id?: string | null
          cost_units?: number | null
          created_at?: string
          generated_prompt?: string | null
          generation_mode?: string | null
          id?: string
          image_metadata?: Json | null
          image_url?: string | null
          model_info?: string | null
          provider?: string | null
          scene_id: string
          scene_json?: Json
          source_prompt?: string | null
          thumbnail_url?: string | null
          user_id: string
          version_label?: string | null
          version_number?: number
        }
        Update: {
          artboard_id?: string | null
          cost_units?: number | null
          created_at?: string
          generated_prompt?: string | null
          generation_mode?: string | null
          id?: string
          image_metadata?: Json | null
          image_url?: string | null
          model_info?: string | null
          provider?: string | null
          scene_id?: string
          scene_json?: Json
          source_prompt?: string | null
          thumbnail_url?: string | null
          user_id?: string
          version_label?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "scene_versions_artboard_id_fkey"
            columns: ["artboard_id"]
            isOneToOne: false
            referencedRelation: "artboards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scene_versions_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      scenes: {
        Row: {
          created_at: string
          generated_image_url: string | null
          generated_prompt: string | null
          id: string
          original_prompt: string | null
          project_id: string
          scene_json: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generated_image_url?: string | null
          generated_prompt?: string | null
          id?: string
          original_prompt?: string | null
          project_id: string
          scene_json?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          generated_image_url?: string | null
          generated_prompt?: string | null
          id?: string
          original_prompt?: string | null
          project_id?: string
          scene_json?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_state: {
        Row: {
          active_from: string
          active_until: string | null
          billing_mode: string | null
          created_at: string
          current_plan: string
          id: string
          seat_count: number
          status: string
          telegram_payment_reference: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          active_from?: string
          active_until?: string | null
          billing_mode?: string | null
          created_at?: string
          current_plan?: string
          id?: string
          seat_count?: number
          status?: string
          telegram_payment_reference?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          active_from?: string
          active_until?: string | null
          billing_mode?: string | null
          created_at?: string
          current_plan?: string
          id?: string
          seat_count?: number
          status?: string
          telegram_payment_reference?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_state_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          category: string
          created_at: string
          created_by_user_id: string | null
          description: string | null
          id: string
          is_featured: boolean
          is_global: boolean
          preview_url: string | null
          scene_json: Json
          sort_order: number
          starter_prompt: string
          tags: string[] | null
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean
          is_global?: boolean
          preview_url?: string | null
          scene_json?: Json
          sort_order?: number
          starter_prompt?: string
          tags?: string[] | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean
          is_global?: boolean
          preview_url?: string | null
          scene_json?: Json
          sort_order?: number
          starter_prompt?: string
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      usage_events: {
        Row: {
          action_type: string | null
          artboard_id: string | null
          created_at: string
          credits_used: number
          event_type: string
          generation_mode: string | null
          id: string
          metadata: Json | null
          model: string | null
          project_id: string | null
          provider: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          action_type?: string | null
          artboard_id?: string | null
          created_at?: string
          credits_used?: number
          event_type: string
          generation_mode?: string | null
          id?: string
          metadata?: Json | null
          model?: string | null
          project_id?: string | null
          provider?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          action_type?: string | null
          artboard_id?: string | null
          created_at?: string
          credits_used?: number
          event_type?: string
          generation_mode?: string | null
          id?: string
          metadata?: Json | null
          model?: string | null
          project_id?: string | null
          provider?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_events_artboard_id_fkey"
            columns: ["artboard_id"]
            isOneToOne: false
            referencedRelation: "artboards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invited_by: string | null
          invited_email: string | null
          role: string
          status: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_by?: string | null
          invited_email?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_by?: string | null
          invited_email?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          archived_at: string | null
          created_at: string
          credit_balance: number
          daily_credits_reset_at: string | null
          daily_credits_used: number
          id: string
          name: string
          owner_id: string
          plan: string
          settings: Json | null
          type: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          credit_balance?: number
          daily_credits_reset_at?: string | null
          daily_credits_used?: number
          id?: string
          name: string
          owner_id: string
          plan?: string
          settings?: Json | null
          type?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          credit_balance?: number
          daily_credits_reset_at?: string | null
          daily_credits_used?: number
          id?: string
          name?: string
          owner_id?: string
          plan?: string
          settings?: Json | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_workspace_role: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: string
      }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
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
