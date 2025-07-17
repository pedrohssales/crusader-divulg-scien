-- Criar tabela para configurações do sistema
CREATE TABLE public.site_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_url TEXT,
  footer_text TEXT DEFAULT '© 2025 Vitrine Científica - UFPE Campus Acadêmico do Agreste',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- Política para administradores gerenciarem configurações
CREATE POLICY "Admins can manage site config" 
ON public.site_config 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND user_type = 'admin'
  )
);

-- Política para todos verem as configurações
CREATE POLICY "Anyone can view site config" 
ON public.site_config 
FOR SELECT 
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_site_config_updated_at
  BEFORE UPDATE ON public.site_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir linha inicial de configuração
INSERT INTO public.site_config (logo_url, footer_text) 
VALUES (
  'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/graduation-cap.svg',
  '© 2025 Vitrine Científica - UFPE Campus Acadêmico do Agreste'
);