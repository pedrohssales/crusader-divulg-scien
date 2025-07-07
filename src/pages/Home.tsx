import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Publication } from '@/types/database';
import { PublicationCard } from '@/components/publications/PublicationCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

export const Home: React.FC = () => {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchPublications();
  }, [user]);

  const fetchPublications = async () => {
    try {
      let query = supabase
        .from('publications')
        .select(`
          *,
          profiles (*)
        `)
        .order('published_at', { ascending: false, nullsFirst: false });

      // If not authenticated, only show approved publications
      if (!user) {
        query = query.eq('status', 'approved');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching publications:', error);
        return;
      }

      setPublications(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Plataforma de Divulgação Científica
          </h1>
          <p className="text-xl text-muted-foreground">
            UFPE - Campus Caruaru
          </p>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Descubra as mais recentes pesquisas e publicações científicas desenvolvidas
            no campus Caruaru da Universidade Federal de Pernambuco.
          </p>
        </div>

        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : publications.length > 0 ? (
          <div className="space-y-6">
            {publications.map((publication) => (
              <PublicationCard key={publication.id} publication={publication} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              Nenhuma publicação encontrada.
            </p>
            {user && (
              <p className="mt-2 text-muted-foreground">
                Seja o primeiro a compartilhar uma descoberta científica!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};