export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          user_id: string
          name: string
          industry: Industry
          domain: string | null
          website: string | null
          size: string | null
          description: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          industry?: Industry
          domain?: string | null
          website?: string | null
          size?: string | null
          description?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          industry?: Industry
          domain?: string | null
          website?: string | null
          size?: string | null
          description?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          user_id: string
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          linkedin: string | null
          company_id: string | null
          source: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          linkedin?: string | null
          company_id?: string | null
          source?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          linkedin?: string | null
          company_id?: string | null
          source?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contact_employment_history: {
        Row: {
          id: string
          contact_id: string
          company_id: string
          title: string
          start_date: string
          end_date: string | null
          is_current: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contact_id: string
          company_id: string
          title: string
          start_date: string
          end_date?: string | null
          is_current?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contact_id?: string
          company_id?: string
          title?: string
          start_date?: string
          end_date?: string | null
          is_current?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      custom_fields: {
        Row: {
          id: string
          contact_id: string
          field_name: string
          value: string
          type: 'text' | 'number' | 'date' | 'boolean'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contact_id: string
          field_name: string
          value: string
          type?: 'text' | 'number' | 'date' | 'boolean'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contact_id?: string
          field_name?: string
          value?: string
          type?: 'text' | 'number' | 'date' | 'boolean'
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          tag_name: string
          created_at: string
        }
        Insert: {
          id?: string
          tag_name: string
          created_at?: string
        }
        Update: {
          id?: string
          tag_name?: string
          created_at?: string
        }
      }
      contact_tags: {
        Row: {
          id: string
          contact_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          id?: string
          contact_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          id?: string
          contact_id?: string
          tag_id?: string
          created_at?: string
        }
      }
      email_stats: {
        Row: {
          contact_id: string
          total_sent: number
          replies: number
          response_rate: number
          linked_deals: number
          revenue: number
          created_at: string
          updated_at: string
        }
        Insert: {
          contact_id: string
          total_sent?: number
          replies?: number
          response_rate?: number
          linked_deals?: number
          revenue?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          contact_id?: string
          total_sent?: number
          replies?: number
          response_rate?: number
          linked_deals?: number
          revenue?: number
          created_at?: string
          updated_at?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          type: 'one_time' | 'automated' | 'sequence'
          status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'failed'
          template_id: string | null
          schedule_config: Json | null
          audience_filter: Json | null
          metadata: Json | null
          stats: Json
          created_at: string
          updated_at: string
          scheduled_at: string | null
          started_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          type?: 'one_time' | 'automated' | 'sequence'
          status?: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'failed'
          template_id?: string | null
          schedule_config?: Json | null
          audience_filter?: Json | null
          metadata?: Json | null
          stats?: Json
          created_at?: string
          updated_at?: string
          scheduled_at?: string | null
          started_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          type?: 'one_time' | 'automated' | 'sequence'
          status?: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'failed'
          template_id?: string | null
          schedule_config?: Json | null
          audience_filter?: Json | null
          metadata?: Json | null
          stats?: Json
          created_at?: string
          updated_at?: string
          scheduled_at?: string | null
          started_at?: string | null
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_template_id_fkey"
            columns: ["template_id"]
            referencedRelation: "campaign_templates"
            referencedColumns: ["id"]
          }
        ]
      }
      campaign_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          subject: string
          content: string
          variables: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          subject: string
          content: string
          variables?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          subject?: string
          content?: string
          variables?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_templates_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      campaign_recipients: {
        Row: {
          id: string
          campaign_id: string
          contact_id: string
          email: string
          status: string
          sent_at: string | null
          opened_at: string | null
          clicked_at: string | null
          replied_at: string | null
          bounced_at: string | null
          email_tracking_id: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          contact_id: string
          email: string
          status?: string
          sent_at?: string | null
          opened_at?: string | null
          clicked_at?: string | null
          replied_at?: string | null
          bounced_at?: string | null
          email_tracking_id?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          contact_id?: string
          email?: string
          status?: string
          sent_at?: string | null
          opened_at?: string | null
          clicked_at?: string | null
          replied_at?: string | null
          bounced_at?: string | null
          email_tracking_id?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_contact_id_fkey"
            columns: ["contact_id"]
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_email_tracking_id_fkey"
            columns: ["email_tracking_id"]
            referencedRelation: "email_tracking"
            referencedColumns: ["id"]
          }
        ]
      }
      campaign_sequences: {
        Row: {
          id: string
          campaign_id: string
          step_number: number
          template_id: string
          delay_days: number
          conditions: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          step_number: number
          template_id: string
          delay_days?: number
          conditions?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          step_number?: number
          template_id?: string
          delay_days?: number
          conditions?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_sequences_campaign_id_fkey"
            columns: ["campaign_id"]
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_sequences_template_id_fkey"
            columns: ["template_id"]
            referencedRelation: "campaign_templates"
            referencedColumns: ["id"]
          }
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
      industry_type: Industry
      custom_field_type: 'text' | 'number' | 'date' | 'boolean'
    }
  }
}

export enum Industry {
  Technology = 'Technology',
  Healthcare = 'Healthcare',
  Finance = 'Finance',
  Retail = 'Retail',
  Manufacturing = 'Manufacturing',
  Education = 'Education',
  RealEstate = 'Real Estate',
  Consulting = 'Consulting',
  Other = 'Other'
} 