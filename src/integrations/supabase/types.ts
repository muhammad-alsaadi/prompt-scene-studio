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
          created_at: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          is_shared: boolean | null
          metadata: Json | null
          mime_type: string | null
          name: string
          project_id: string | null
          tags: string[] | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          file_type?: string
          file_url: string
          id?: string
          is_shared?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          name: string
          project_id?: string | null
          tags?: string[] | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          is_shared?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          name?: string
          project_id?: string | null
          tags?: string[] | null
          user_id?: string
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
          logo_url: string | null
          name: string
          style_notes: string | null
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
          logo_url?: string | null
          name?: string
          style_notes?: string | null
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
          logo_url?: string | null
          name?: string
          style_notes?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
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
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
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
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          preview_image_url: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          preview_image_url?: string | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
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
      templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_featured: boolean
          preview_url: string | null
          scene_json: Json
          sort_order: number
          starter_prompt: string
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          preview_url?: string | null
          scene_json?: Json
          sort_order?: number
          starter_prompt?: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          preview_url?: string | null
          scene_json?: Json
          sort_order?: number
          starter_prompt?: string
          title?: string
        }
        Relationships: []
      }
      usage_events: {
        Row: {
          created_at: string
          credits_used: number
          event_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_used?: number
          event_type: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          credits_used?: number
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invited_by: string | null
          invited_email: string | null
          role: string
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
          created_at: string
          credit_balance: number
          daily_credits_reset_at: string | null
          daily_credits_used: number
          id: string
          name: string
          owner_id: string
          plan: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          credit_balance?: number
          daily_credits_reset_at?: string | null
          daily_credits_used?: number
          id?: string
          name: string
          owner_id: string
          plan?: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          credit_balance?: number
          daily_credits_reset_at?: string | null
          daily_credits_used?: number
          id?: string
          name?: string
          owner_id?: string
          plan?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: []
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
