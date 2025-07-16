
-- Adicionar campos para palavras-chave e arquivo PDF na tabela publications
ALTER TABLE publications 
ADD COLUMN keywords TEXT,
ADD COLUMN file_path TEXT;

-- Criar tabela para múltiplos autores
CREATE TABLE publication_authors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  publication_id UUID NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS para a tabela publication_authors
ALTER TABLE publication_authors ENABLE ROW LEVEL SECURITY;

-- Política para autores verem autores de suas próprias publicações
CREATE POLICY "Authors can view authors of their publications" 
  ON publication_authors 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM publications p 
      JOIN profiles pr ON p.author_id = pr.id 
      WHERE p.id = publication_authors.publication_id 
      AND pr.user_id = auth.uid()
    )
  );

-- Política para autores adicionarem autores às suas publicações
CREATE POLICY "Authors can insert authors to their publications" 
  ON publication_authors 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM publications p 
      JOIN profiles pr ON p.author_id = pr.id 
      WHERE p.id = publication_authors.publication_id 
      AND pr.user_id = auth.uid()
    )
  );

-- Política para administradores verem todos os autores
CREATE POLICY "Admins can view all publication authors" 
  ON publication_authors 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND user_type = 'admin'
    )
  );

-- Política para qualquer pessoa ver autores de publicações aprovadas
CREATE POLICY "Anyone can view authors of approved publications" 
  ON publication_authors 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM publications p 
      WHERE p.id = publication_authors.publication_id 
      AND p.status = 'approved'
    )
  );

-- Criar bucket para armazenar PDFs das publicações
INSERT INTO storage.buckets (id, name, public) 
VALUES ('publications', 'publications', true);

-- Política para autores fazerem upload de seus PDFs
CREATE POLICY "Authors can upload their publication files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'publications' 
  AND auth.uid() IS NOT NULL
);

-- Política para qualquer pessoa visualizar arquivos de publicações aprovadas
CREATE POLICY "Anyone can view approved publication files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'publications');

-- Política para autores atualizarem seus próprios arquivos
CREATE POLICY "Authors can update their publication files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'publications' 
  AND auth.uid() IS NOT NULL
);

-- Política para autores removerem seus próprios arquivos
CREATE POLICY "Authors can delete their publication files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'publications' 
  AND auth.uid() IS NOT NULL
);
