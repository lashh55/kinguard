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
      admin_audit_log: {
        Row: {
          action: string
          admin_email: string
          created_at: string
          id: string
          path: string | null
        }
        Insert: {
          action: string
          admin_email: string
          created_at?: string
          id?: string
          path?: string | null
        }
        Update: {
          action?: string
          admin_email?: string
          created_at?: string
          id?: string
          path?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      guardian_activity: {
        Row: {
          action_type: string
          alert_id: string | null
          created_at: string
          guardian_id: string
          id: string
          senior_id: string
        }
        Insert: {
          action_type: string
          alert_id?: string | null
          created_at?: string
          guardian_id: string
          id?: string
          senior_id: string
        }
        Update: {
          action_type?: string
          alert_id?: string | null
          created_at?: string
          guardian_id?: string
          id?: string
          senior_id?: string
        }
        Relationships: []
      }
      guardian_relationships: {
        Row: {
          created_at: string
          guardian_id: string
          id: string
          invite_code: string | null
          last_alert_view_at: string | null
          relationship_label: string | null
          senior_id: string
          status: string
        }
        Insert: {
          created_at?: string
          guardian_id: string
          id?: string
          invite_code?: string | null
          last_alert_view_at?: string | null
          relationship_label?: string | null
          senior_id: string
          status?: string
        }
        Update: {
          created_at?: string
          guardian_id?: string
          id?: string
          invite_code?: string | null
          last_alert_view_at?: string | null
          relationship_label?: string | null
          senior_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardian_relationships_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardian_relationships_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inbound_email_logs: {
        Row: {
          body_preview: string | null
          created_at: string
          id: string
          matched_senior_id: string | null
          message: string | null
          raw_fields: Json | null
          sender_email: string | null
          status: string
          subject: string | null
          to_address: string | null
        }
        Insert: {
          body_preview?: string | null
          created_at?: string
          id?: string
          matched_senior_id?: string | null
          message?: string | null
          raw_fields?: Json | null
          sender_email?: string | null
          status: string
          subject?: string | null
          to_address?: string | null
        }
        Update: {
          body_preview?: string | null
          created_at?: string
          id?: string
          matched_senior_id?: string | null
          message?: string | null
          raw_fields?: Json | null
          sender_email?: string | null
          status?: string
          subject?: string | null
          to_address?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          challenge_stats: Json
          created_at: string
          font_size: string
          full_name: string
          id: string
          invite_code: string | null
          quiz_progress: Json
          role: string
          ssn_shield_progress: Json
        }
        Insert: {
          challenge_stats?: Json
          created_at?: string
          font_size?: string
          full_name: string
          id: string
          invite_code?: string | null
          quiz_progress?: Json
          role: string
          ssn_shield_progress?: Json
        }
        Update: {
          challenge_stats?: Json
          created_at?: string
          font_size?: string
          full_name?: string
          id?: string
          invite_code?: string | null
          quiz_progress?: Json
          role?: string
          ssn_shield_progress?: Json
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          created_at: string
          id: string
          question_id: string
          user_id: string
          was_correct: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          user_id: string
          was_correct: boolean
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
          was_correct?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          answer_a: string
          answer_b: string
          answer_c: string
          answer_d: string
          correct_answer: string
          created_at: string
          explanation: string
          id: string
          last_shown_date: string | null
          question_text: string
          rotation_group: number
          scam_category: string
          times_shown: number
        }
        Insert: {
          answer_a: string
          answer_b: string
          answer_c: string
          answer_d: string
          correct_answer: string
          created_at?: string
          explanation: string
          id?: string
          last_shown_date?: string | null
          question_text: string
          rotation_group?: number
          scam_category: string
          times_shown?: number
        }
        Update: {
          answer_a?: string
          answer_b?: string
          answer_c?: string
          answer_d?: string
          correct_answer?: string
          created_at?: string
          explanation?: string
          id?: string
          last_shown_date?: string | null
          question_text?: string
          rotation_group?: number
          scam_category?: string
          times_shown?: number
        }
        Relationships: []
      }
      scam_alerts: {
        Row: {
          ai_recommendation: string | null
          ai_urgency: string | null
          channel: string
          content_preview: string | null
          created_at: string
          guardian_notified: boolean
          id: string
          scam_flags: Json
          scam_score: number
          scam_type: string | null
          senior_id: string
          status: string
        }
        Insert: {
          ai_recommendation?: string | null
          ai_urgency?: string | null
          channel: string
          content_preview?: string | null
          created_at?: string
          guardian_notified?: boolean
          id?: string
          scam_flags?: Json
          scam_score?: number
          scam_type?: string | null
          senior_id: string
          status?: string
        }
        Update: {
          ai_recommendation?: string | null
          ai_urgency?: string | null
          channel?: string
          content_preview?: string | null
          created_at?: string
          guardian_notified?: boolean
          id?: string
          scam_flags?: Json
          scam_score?: number
          scam_type?: string | null
          senior_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "scam_alerts_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sos_events: {
        Row: {
          created_at: string
          id: string
          senior_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          senior_id: string
        }
        Update: {
          created_at?: string
          id?: string
          senior_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_get_stats: { Args: never; Returns: Json }
      admin_list_audit: {
        Args: never
        Returns: {
          action: string
          admin_email: string
          created_at: string
          id: string
          path: string
        }[]
      }
      admin_list_guardians: {
        Args: never
        Returns: {
          created_at: string
          full_name: string
          id: string
          linked_seniors: number
        }[]
      }
      admin_list_messages: {
        Args: never
        Returns: {
          channel: string
          content_preview: string
          created_at: string
          id: string
          scam_score: number
          scam_type: string
          senior_id: string
          senior_name: string
          status: string
        }[]
      }
      admin_list_seniors: {
        Args: never
        Returns: {
          created_at: string
          full_name: string
          guardian_count: number
          id: string
          invite_code: string
        }[]
      }
      admin_list_sos: {
        Args: never
        Returns: {
          created_at: string
          id: string
          senior_id: string
          senior_name: string
        }[]
      }
      admin_log_view: { Args: { _path: string }; Returns: undefined }
      delete_my_account: { Args: never; Returns: undefined }
      gen_invite_code: { Args: never; Returns: string }
      get_guardian_activity_feed: {
        Args: never
        Returns: {
          action_type: string
          alert_id: string
          alert_scam_type: string
          created_at: string
          guardian_first_name: string
          guardian_id: string
          id: string
        }[]
      }
      get_linked_seniors: {
        Args: never
        Returns: {
          first_name: string
          id: string
          relationship_label: string
        }[]
      }
      get_my_guardians: {
        Args: never
        Returns: {
          full_name: string
          guardian_id: string
          last_alert_view_at: string
          link_id: string
          linked_at: string
          relationship_label: string
          total_alerts_reviewed: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_guardian_of: { Args: { _senior: string }; Returns: boolean }
      link_guardian_by_code: {
        Args: { _code: string; _label: string }
        Returns: string
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
