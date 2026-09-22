export interface Composition {
  id: string
  slug: string
  title: string
  short_description: string | null
  story: string | null
  lyrics: string | null
  cover_url: string | null
  audio_url: string | null
  position: number
  is_featured: boolean
  created_at: string
}

export interface Comment {
  id: string
  composition_id: string
  user_id: string | null
  display_name: string
  body: string
  created_at: string
}

export interface Like {
  id: string
  composition_id: string
  user_id: string
  created_at: string
}

export interface FanSubmission {
  id: string
  user_id: string | null
  display_name: string
  message: string | null
  file_url: string
  file_type: 'image' | 'audio' | 'video' | 'other'
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface Profile {
  id: string
  display_name: string | null
  is_admin: boolean
  created_at: string
}
