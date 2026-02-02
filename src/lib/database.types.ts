export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'employee'
          avatar_url: string | null
          desired_weekly_hours: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'employee'
          avatar_url?: string | null
          desired_weekly_hours?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'admin' | 'employee'
          avatar_url?: string | null
          desired_weekly_hours?: number
          created_at?: string
          updated_at?: string
        }
      }
      shifts: {
        Row: {
          id: string
          employee_id: string
          route_id: string | null
          shift_date: string
          start_time: string
          end_time: string
          shift_role: string
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          route_id?: string | null
          shift_date: string
          start_time: string
          end_time: string
          shift_role: string
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          route_id?: string | null
          shift_date?: string
          start_time?: string
          end_time?: string
          shift_role?: string
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      routes: {
        Row: {
          id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          created_at?: string
        }
      }
      route_requirements: {
        Row: {
          id: string
          route_id: string
          day_of_week: string
          start_time: string
          end_time: string
          created_at: string
        }
        Insert: {
          id?: string
          route_id: string
          day_of_week: string
          start_time: string
          end_time: string
          created_at?: string
        }
        Update: {
          id?: string
          route_id?: string
          day_of_week?: string
          start_time?: string
          end_time?: string
          created_at?: string
        }
      }
      availability: {
        Row: {
          id: string
          employee_id: string
          day_of_week: string
          start_time: string
          end_time: string
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          day_of_week: string
          start_time: string
          end_time: string
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          day_of_week?: string
          start_time?: string
          end_time?: string
          created_at?: string
        }
      }
    }
  }
}
