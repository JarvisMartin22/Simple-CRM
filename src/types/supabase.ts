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