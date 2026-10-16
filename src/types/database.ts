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
      programs: {
        Row: Program
        Insert: Omit<Program, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Program>
      }
      enquiries: {
        Row: Enquiry
        Insert: Omit<Enquiry, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Enquiry>
      }
      events: {
        Row: PreschoolEvent
        Insert: Omit<PreschoolEvent, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<PreschoolEvent>
      }
      announcements: {
        Row: Announcement
        Insert: Omit<Announcement, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Announcement>
      }
      gallery: {
        Row: GalleryRecord
        Insert: Omit<GalleryRecord, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<GalleryRecord>
      }
      testimonials: {
        Row: TestimonialRecord
        Insert: Omit<TestimonialRecord, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<TestimonialRecord>
      }
    }
  }
}

export interface Program {
  id: string
  title: string
  description: string
  age_group: string
  category: 'all' | 'daycare' | 'foundations' | 'kindergarten' | 'weekend' | string
  features: string[]
  timings?: string | null
  color?: string | null
  icon?: string | null
  image_url?: string | null
  published: boolean
  created_at: string
  updated_at: string
}

export type EnquiryStatus = 'pending' | 'contacted' | 'enrolled' | 'closed'
export type EnquiryType = 'admission' | 'campus_visit' | 'general'

export interface Enquiry {
  id: string
  parent_name: string
  phone: string
  email?: string | null
  child_name?: string | null
  child_age?: string | null
  program_id?: string | null
  message?: string | null
  enquiry_type: EnquiryType
  preferred_date?: string | null
  preferred_slot?: string | null
  status: EnquiryStatus
  created_at: string
}

export interface EnquirySubmission {
  parent_name: string
  phone: string
  email?: string
  child_name?: string
  child_age?: string
  program_id?: string
  message?: string
  enquiry_type?: EnquiryType
  preferred_date?: string
  preferred_slot?: string
}

export interface PreschoolEvent {
  id: string
  title: string
  description?: string | null
  event_date: string
  image_url?: string | null
  published: boolean
  created_at: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  published: boolean
  created_at: string
}

export interface GalleryRecord {
  id: string
  title: string
  description?: string | null
  image_url: string
  category: string
  emoji?: string | null
  published: boolean
  created_at: string
}

export interface TestimonialRecord {
  id: string
  parent_display_name: string
  feedback: string
  child_info?: string | null
  avatar?: string | null
  rating?: number | null
  published: boolean
  created_at: string
}
