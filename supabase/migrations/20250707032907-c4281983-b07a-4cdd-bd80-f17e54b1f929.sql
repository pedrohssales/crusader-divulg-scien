-- Create enum for user types
CREATE TYPE public.user_type AS ENUM ('standard', 'admin');

-- Create enum for publication status
CREATE TYPE public.publication_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'returned');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  institution TEXT NOT NULL,
  display_name TEXT NOT NULL,
  user_type user_type NOT NULL DEFAULT 'standard',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create publications table
CREATE TABLE public.publications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  status publication_status NOT NULL DEFAULT 'draft',
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create publication reviews table for tracking review history
CREATE TABLE public.publication_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  publication_id UUID NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  decision publication_status NOT NULL,
  justification TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publication_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for publications
CREATE POLICY "Anyone can view approved publications" ON public.publications FOR SELECT USING (status = 'approved' OR auth.uid() IS NOT NULL);
CREATE POLICY "Authors can insert their own publications" ON public.publications FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = author_id));
CREATE POLICY "Authors can update their own publications" ON public.publications FOR UPDATE USING (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = author_id));
CREATE POLICY "Admins can update any publication" ON public.publications FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND user_type = 'admin'
  )
);

-- Create policies for publication reviews
CREATE POLICY "Authors can view reviews of their publications" ON public.publication_reviews FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.publications p 
    JOIN public.profiles pr ON p.author_id = pr.id
    WHERE p.id = publication_id AND pr.user_id = auth.uid()
  )
);
CREATE POLICY "Admins can view all reviews" ON public.publication_reviews FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND user_type = 'admin'
  )
);
CREATE POLICY "Admins can insert reviews" ON public.publication_reviews FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND user_type = 'admin'
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_publications_updated_at
  BEFORE UPDATE ON public.publications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, institution, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'institution', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', '')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();