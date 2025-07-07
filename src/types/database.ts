export type UserType = 'standard' | 'admin';

export type PublicationStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'returned';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  institution: string;
  display_name: string;
  user_type: UserType;
  created_at: string;
  updated_at: string;
}

export interface Publication {
  id: string;
  title: string;
  summary: string;
  content: string;
  status: PublicationStatus;
  author_id: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface PublicationReview {
  id: string;
  publication_id: string;
  reviewer_id: string;
  decision: PublicationStatus;
  justification: string;
  created_at: string;
}