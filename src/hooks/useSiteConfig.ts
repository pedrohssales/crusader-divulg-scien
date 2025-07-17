import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SiteConfig {
  id: string;
  logo_url: string | null;
  footer_text: string | null;
  created_at: string;
  updated_at: string;
}

export const useSiteConfig = () => {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('site_config')
          .select('*')
          .single();

        if (error) {
          console.error('Error fetching site config:', error);
          return;
        }

        setConfig(data);
      } catch (error) {
        console.error('Error fetching site config:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { config, loading };
};