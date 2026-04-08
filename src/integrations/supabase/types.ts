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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      affiliate_earnings: {
        Row: {
          affiliate_id: string
          amount: number
          created_at: string
          id: string
          referral_id: string | null
          type: Database["public"]["Enums"]["earning_type"]
        }
        Insert: {
          affiliate_id: string
          amount: number
          created_at?: string
          id?: string
          referral_id?: string | null
          type?: Database["public"]["Enums"]["earning_type"]
        }
        Update: {
          affiliate_id?: string
          amount?: number
          created_at?: string
          id?: string
          referral_id?: string | null
          type?: Database["public"]["Enums"]["earning_type"]
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_earnings_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_earnings_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_payouts: {
        Row: {
          affiliate_id: string
          amount: number
          approved_at: string | null
          completed_at: string | null
          destination_details: Json
          id: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          requested_at: string
          square_transfer_id: string | null
          status: Database["public"]["Enums"]["payout_status"]
        }
        Insert: {
          affiliate_id: string
          amount: number
          approved_at?: string | null
          completed_at?: string | null
          destination_details?: Json
          id?: string
          notes?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          requested_at?: string
          square_transfer_id?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
        }
        Update: {
          affiliate_id?: string
          amount?: number
          approved_at?: string | null
          completed_at?: string | null
          destination_details?: Json
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          requested_at?: string
          square_transfer_id?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          affiliate_type: Database["public"]["Enums"]["affiliate_type"]
          available_balance: number
          commission_rate: number
          created_at: string
          id: string
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          kyc_verified_at: string | null
          marketing_links_json: Json | null
          referral_code: string
          status: Database["public"]["Enums"]["affiliate_status"]
          total_earnings: number
          updated_at: string
          user_id: string
        }
        Insert: {
          affiliate_type?: Database["public"]["Enums"]["affiliate_type"]
          available_balance?: number
          commission_rate?: number
          created_at?: string
          id?: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          kyc_verified_at?: string | null
          marketing_links_json?: Json | null
          referral_code: string
          status?: Database["public"]["Enums"]["affiliate_status"]
          total_earnings?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          affiliate_type?: Database["public"]["Enums"]["affiliate_type"]
          available_balance?: number
          commission_rate?: number
          created_at?: string
          id?: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          kyc_verified_at?: string | null
          marketing_links_json?: Json | null
          referral_code?: string
          status?: Database["public"]["Enums"]["affiliate_status"]
          total_earnings?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cis_logs: {
        Row: {
          aggression_mode: string | null
          created_at: string
          dealer_card: string
          ev_score: number | null
          heat_index: number | null
          id: string
          player_cards: string[]
          recommendation: string
          user_id: string
        }
        Insert: {
          aggression_mode?: string | null
          created_at?: string
          dealer_card: string
          ev_score?: number | null
          heat_index?: number | null
          id?: string
          player_cards: string[]
          recommendation: string
          user_id: string
        }
        Update: {
          aggression_mode?: string | null
          created_at?: string
          dealer_card?: string
          ev_score?: number | null
          heat_index?: number | null
          id?: string
          player_cards?: string[]
          recommendation?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cis_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_secrets: {
        Row: {
          created_at: string
          device_fingerprint: string | null
          id: string
          profile_id: string
          updated_at: string
          whop_id: string | null
        }
        Insert: {
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          profile_id: string
          updated_at?: string
          whop_id?: string | null
        }
        Update: {
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          profile_id?: string
          updated_at?: string
          whop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_secrets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          daily_cis_used: number
          daily_sidebet_used: number
          id: string
          last_reset_date: string | null
          rank: string | null
          subscription_expires_at: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          total_cis_runs: number
          trial_started_at: string | null
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          daily_cis_used?: number
          daily_sidebet_used?: number
          id?: string
          last_reset_date?: string | null
          rank?: string | null
          subscription_expires_at?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          total_cis_runs?: number
          trial_started_at?: string | null
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          daily_cis_used?: number
          daily_sidebet_used?: number
          id?: string
          last_reset_date?: string | null
          rank?: string | null
          subscription_expires_at?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          total_cis_runs?: number
          trial_started_at?: string | null
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      referrals: {
        Row: {
          bonus_granted: boolean | null
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          bonus_granted?: boolean | null
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          bonus_granted?: boolean | null
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      session_tokens: {
        Row: {
          created_at: string
          device_fingerprint: string
          expires_at: string
          id: string
          ip_address: string | null
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint: string
          expires_at: string
          id?: string
          ip_address?: string | null
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_subscription: {
        Args: { days_valid?: number; profile_user_id: string }
        Returns: undefined
      }
      approve_affiliate: {
        Args: { p_affiliate_id: string }
        Returns: undefined
      }
      approve_payout: {
        Args: { p_payout_id: string }
        Returns: undefined
      }
      complete_payout: {
        Args: { p_payout_id: string; p_square_transfer_id?: string }
        Returns: undefined
      }
      create_affiliate: {
        Args: { p_affiliate_type?: Database["public"]["Enums"]["affiliate_type"] }
        Returns: string
      }
      fail_payout: {
        Args: { p_payout_id: string; p_notes?: string }
        Returns: undefined
      }
      increment_cis_usage: {
        Args: { profile_user_id: string }
        Returns: undefined
      }
      increment_sidebet_usage: {
        Args: { profile_user_id: string }
        Returns: undefined
      }
      record_affiliate_earning: {
        Args: {
          p_affiliate_id: string
          p_referral_id: string | null
          p_amount: number
          p_type?: Database["public"]["Enums"]["earning_type"]
        }
        Returns: undefined
      }
      reject_affiliate: {
        Args: { p_affiliate_id: string }
        Returns: undefined
      }
      set_kyc_rejected: {
        Args: { p_affiliate_id: string }
        Returns: undefined
      }
      set_kyc_verified: {
        Args: { p_affiliate_id: string }
        Returns: undefined
      }
      update_user_tier: {
        Args: {
          new_tier: Database["public"]["Enums"]["subscription_tier"]
          profile_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      affiliate_status: "pending" | "approved" | "rejected" | "inactive"
      affiliate_type: "standard" | "influencer"
      earning_type: "signup" | "conversion" | "subscription"
      kyc_status: "not_started" | "pending" | "verified" | "rejected"
      payment_method: "paypal" | "apple_pay" | "bank_transfer" | "other"
      payout_status: "pending" | "approved" | "processing" | "completed" | "failed"
      subscription_tier: "free" | "basic" | "elite" | "blackout" | "lifetime"
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
      affiliate_status: ["pending", "approved", "rejected", "inactive"],
      affiliate_type: ["standard", "influencer"],
      earning_type: ["signup", "conversion", "subscription"],
      kyc_status: ["not_started", "pending", "verified", "rejected"],
      payment_method: ["paypal", "apple_pay", "bank_transfer", "other"],
      payout_status: ["pending", "approved", "processing", "completed", "failed"],
      subscription_tier: ["free", "basic", "elite", "blackout", "lifetime"],
    },
  },
} as const
