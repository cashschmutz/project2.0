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
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'employee'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'admin' | 'employee'
          created_at?: string
          updated_at?: string
        }
      }
      shifts: {
        Row: {
          id: string
          employee_id: string
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
          shift_date?: string
          start_time?: string
          end_time?: string
          shift_role?: string
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
