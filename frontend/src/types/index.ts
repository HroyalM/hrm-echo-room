export type Privacy = 'private' | 'friends' | 'public';
export type EchoStatus = 'scheduled' | 'processing' | 'delivered' | 'failed' | 'retrying' | 'cancelled';
export type DeliveryMethod = 'inapp' | 'email' | 'whatsapp';

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface Echo {
  id: string;
  sender_id: string;
  recipient_type: 'self' | 'friend' | 'multiple';
  content: string;
  privacy: Privacy;
  scheduled_at: string;
  delivery_methods: DeliveryMethod[];
  status: EchoStatus;
  created_at: string;
}
