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
      auction_activity: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          room_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          room_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          room_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auction_activity_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      auction_players: {
        Row: {
          bid_count: number | null
          created_at: string | null
          current_bid: number | null
          current_bidder_team_id: string | null
          id: string
          player_id: string | null
          room_id: string | null
          sold_price: number | null
          sold_to_team_id: string | null
          status: Database["public"]["Enums"]["auction_status"] | null
        }
        Insert: {
          bid_count?: number | null
          created_at?: string | null
          current_bid?: number | null
          current_bidder_team_id?: string | null
          id?: string
          player_id?: string | null
          room_id?: string | null
          sold_price?: number | null
          sold_to_team_id?: string | null
          status?: Database["public"]["Enums"]["auction_status"] | null
        }
        Update: {
          bid_count?: number | null
          created_at?: string | null
          current_bid?: number | null
          current_bidder_team_id?: string | null
          id?: string
          player_id?: string | null
          room_id?: string | null
          sold_price?: number | null
          sold_to_team_id?: string | null
          status?: Database["public"]["Enums"]["auction_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "auction_players_current_bidder_team_id_fkey"
            columns: ["current_bidder_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auction_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auction_players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auction_players_sold_to_team_id_fkey"
            columns: ["sold_to_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          auction_player_id: string | null
          bid_amount: number
          created_at: string | null
          id: string
          team_id: string | null
        }
        Insert: {
          auction_player_id?: string | null
          bid_amount: number
          created_at?: string | null
          id?: string
          team_id?: string | null
        }
        Update: {
          auction_player_id?: string | null
          bid_amount?: number
          created_at?: string | null
          id?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_auction_player_id_fkey"
            columns: ["auction_player_id"]
            isOneToOne: false
            referencedRelation: "auction_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          created_at: string | null
          id: string
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          username?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          base_price: number
          batting_score: number | null
          bowling_score: number | null
          country: string
          created_at: string | null
          id: string
          is_overseas: boolean | null
          name: string
          overall_score: number | null
          role: Database["public"]["Enums"]["player_role"]
        }
        Insert: {
          base_price: number
          batting_score?: number | null
          bowling_score?: number | null
          country: string
          created_at?: string | null
          id?: string
          is_overseas?: boolean | null
          name: string
          overall_score?: number | null
          role: Database["public"]["Enums"]["player_role"]
        }
        Update: {
          base_price?: number
          batting_score?: number | null
          bowling_score?: number | null
          country?: string
          created_at?: string | null
          id?: string
          is_overseas?: boolean | null
          name?: string
          overall_score?: number | null
          role?: Database["public"]["Enums"]["player_role"]
        }
        Relationships: []
      }
      rooms: {
        Row: {
          bid_increment_large: number | null
          bid_increment_medium: number | null
          bid_increment_small: number | null
          created_at: string | null
          host_id: string | null
          id: string
          is_paused: boolean | null
          max_users: number | null
          min_users: number | null
          room_code: string
          status: Database["public"]["Enums"]["room_status"] | null
          timer_duration: number | null
        }
        Insert: {
          bid_increment_large?: number | null
          bid_increment_medium?: number | null
          bid_increment_small?: number | null
          created_at?: string | null
          host_id?: string | null
          id?: string
          is_paused?: boolean | null
          max_users?: number | null
          min_users?: number | null
          room_code: string
          status?: Database["public"]["Enums"]["room_status"] | null
          timer_duration?: number | null
        }
        Update: {
          bid_increment_large?: number | null
          bid_increment_medium?: number | null
          bid_increment_small?: number | null
          created_at?: string | null
          host_id?: string | null
          id?: string
          is_paused?: boolean | null
          max_users?: number | null
          min_users?: number | null
          room_code?: string
          status?: Database["public"]["Enums"]["room_status"] | null
          timer_duration?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      team_players: {
        Row: {
          created_at: string | null
          id: string
          in_playing_xi: boolean | null
          is_impact_player: boolean | null
          player_id: string | null
          price: number
          team_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          in_playing_xi?: boolean | null
          is_impact_player?: boolean | null
          player_id?: string | null
          price: number
          team_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          in_playing_xi?: boolean | null
          is_impact_player?: boolean | null
          player_id?: string | null
          price?: number
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_ratings: {
        Row: {
          balance_score: number | null
          batting_rating: number | null
          bench_depth: number | null
          bowling_rating: number | null
          created_at: string | null
          id: string
          overall_rating: number | null
          team_id: string | null
        }
        Insert: {
          balance_score?: number | null
          batting_rating?: number | null
          bench_depth?: number | null
          bowling_rating?: number | null
          created_at?: string | null
          id?: string
          overall_rating?: number | null
          team_id?: string | null
        }
        Update: {
          balance_score?: number | null
          batting_rating?: number | null
          bench_depth?: number | null
          bowling_rating?: number | null
          created_at?: string | null
          id?: string
          overall_rating?: number | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_ratings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          id: string
          initial_purse: number | null
          is_ready: boolean | null
          logo_url: string | null
          participant_id: string | null
          purse_left: number | null
          room_id: string | null
          team_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          initial_purse?: number | null
          is_ready?: boolean | null
          logo_url?: string | null
          participant_id?: string | null
          purse_left?: number | null
          room_id?: string | null
          team_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          initial_purse?: number | null
          is_ready?: boolean | null
          logo_url?: string | null
          participant_id?: string | null
          purse_left?: number | null
          room_id?: string | null
          team_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
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
      auction_status: "WAITING" | "ACTIVE" | "COMPLETED"
      player_role: "BATSMAN" | "BOWLER" | "ALL_ROUNDER" | "WICKET_KEEPER"
      room_status: "LOBBY" | "IN_PROGRESS" | "COMPLETED"
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
      auction_status: ["WAITING", "ACTIVE", "COMPLETED"],
      player_role: ["BATSMAN", "BOWLER", "ALL_ROUNDER", "WICKET_KEEPER"],
      room_status: ["LOBBY", "IN_PROGRESS", "COMPLETED"],
    },
  },
} as const
