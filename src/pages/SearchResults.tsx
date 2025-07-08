import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Publication } from '@/types/database';
import { PublicationCard } from '@/components/publications/PublicationCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';

export const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) {
      searchPublications();
    }
  }, [query]);

  const searchPublications = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('publications')
        .select(`
          *,
          profiles (*)
        `)
        .eq('status', 'approved')
        .or(`title.ilike.%${query}%,summary.ilike.%${query}%,content.ilike.%${query}%`)
        .order('published_at', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('Error searching publications:', error);
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
        <div className="flex items-center space-x-3 mb-8">
          <Search className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold">Resultados da Busca</h1>
            <p className="text-muted-foreground">
              {query && `Pesquisando por: "${query}"`}
            </p>
          </div>
        </div>

        {!query ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              Digite um termo para pesquisar nas publicações.
            </p>
          </div>
        ) : loading ? (
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
            <p className="text-sm text-muted-foreground mb-4">
              {publications.length} resultado(s) encontrado(s)
            </p>
            {publications.map((publication) => (
              <PublicationCard key={publication.id} publication={publication} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              Nenhuma publicação encontrada para "{query}".
            </p>
            <p className="mt-2 text-muted-foreground">
              Tente usar outros termos de pesquisa.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};