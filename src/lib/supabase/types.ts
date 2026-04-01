export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          council_slug: string | null;
          reputation: number;
          role: 'reader' | 'voter' | 'admin';
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          display_name?: string | null;
          council_slug?: string | null;
          reputation?: number;
          role?: 'reader' | 'voter' | 'admin';
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          council_slug?: string | null;
          reputation?: number;
          role?: 'reader' | 'voter' | 'admin';
          created_at?: string;
        };
        Relationships: [];
      };
      proposals: {
        Row: {
          id: string;
          council_slug: string;
          budget_category: string;
          title: string;
          body: string;
          author_id: string;
          score: number;
          status: 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed' | 'flagged';
          labels: string[];
          created_at: string;
          comment_count: number;
        };
        Insert: {
          id?: string;
          council_slug: string;
          budget_category: string;
          title: string;
          body: string;
          author_id?: string;
          score?: number;
          status?: 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed' | 'flagged';
          labels?: string[];
          created_at?: string;
          comment_count?: number;
        };
        Update: {
          id?: string;
          council_slug?: string;
          budget_category?: string;
          title?: string;
          body?: string;
          author_id?: string;
          score?: number;
          status?: 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed' | 'flagged';
          labels?: string[];
          created_at?: string;
          comment_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'proposals_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      votes: {
        Row: {
          id: string;
          proposal_id: string;
          user_id: string;
          direction: 'up' | 'down';
          created_at: string;
        };
        Insert: {
          id?: string;
          proposal_id: string;
          user_id?: string;
          direction: 'up' | 'down';
          created_at?: string;
        };
        Update: {
          id?: string;
          proposal_id?: string;
          user_id?: string;
          direction?: 'up' | 'down';
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'votes_proposal_id_fkey';
            columns: ['proposal_id'];
            isOneToOne: false;
            referencedRelation: 'proposals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'votes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      comments: {
        Row: {
          id: string;
          proposal_id: string;
          parent_id: string | null;
          author_id: string;
          body: string;
          status: 'visible' | 'flagged' | 'removed';
          flag_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          proposal_id: string;
          parent_id?: string | null;
          author_id?: string;
          body: string;
          status?: 'visible' | 'flagged' | 'removed';
          flag_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          proposal_id?: string;
          parent_id?: string | null;
          author_id?: string;
          body?: string;
          status?: 'visible' | 'flagged' | 'removed';
          flag_count?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'comments_proposal_id_fkey';
            columns: ['proposal_id'];
            isOneToOne: false;
            referencedRelation: 'proposals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comments_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'comments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comments_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      civic_diffs: {
        Row: {
          id: string;
          council_slug: string;
          budget_category: string;
          year_from: number;
          year_to: number;
          amount_from: number;
          amount_to: number;
          pct_change: number;
          summary: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          council_slug: string;
          budget_category: string;
          year_from: number;
          year_to: number;
          amount_from: number;
          amount_to: number;
          pct_change: number;
          summary: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          council_slug?: string;
          budget_category?: string;
          year_from?: number;
          year_to?: number;
          amount_from?: number;
          amount_to?: number;
          pct_change?: number;
          summary?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
