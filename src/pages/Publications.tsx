import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Publication, PublicationAuthor } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Search, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ITEMS_PER_PAGE = 6;

export const Publications: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [authorsMap, setAuthorsMap] = useState<Record<string, PublicationAuthor[]>>({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  useEffect(() => {
    fetchPublications();
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  const fetchPublications = async () => {
    try {
      let query = supabase
        .from('publications')
        .select(`
          *,
          profiles (*)
        `)
        .eq('status', 'approved');

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%,keywords.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.order('published_at', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('Error fetching publications:', error);
        return;
      }

      setPublications(data || []);

      // Fetch authors for all publications
      if (data && data.length > 0) {
        const publicationIds = data.map(p => p.id);
        const { data: authorsData } = await supabase
          .from('publication_authors')
          .select('*')
          .in('publication_id', publicationIds)
          .order('author_order');

        if (authorsData) {
          const authorsGrouped = authorsData.reduce((acc, author) => {
            if (!acc[author.publication_id]) {
              acc[author.publication_id] = [];
            }
            acc[author.publication_id].push(author);
            return acc;
          }, {} as Record<string, PublicationAuthor[]>);
          setAuthorsMap(authorsGrouped);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPublications = publications.filter(pub => {
    if (!searchTerm) return true;
    return pub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           pub.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (pub.keywords && pub.keywords.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const totalPages = Math.ceil(filteredPublications.length / ITEMS_PER_PAGE);
  const currentPublications = filteredPublications.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  const goToNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (publications.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Publicações</h1>
          <p className="text-muted-foreground">
            {searchTerm ? 'Nenhuma publicação encontrada para sua busca.' : 'Nenhuma publicação aprovada encontrada para leitura.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">Publicações</h1>
          
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar por título, resumo ou palavras-chave..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredPublications.length > 0 && (
                <span>{currentPage + 1} de {totalPages} páginas</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 mb-8">
          {currentPublications.map((publication) => {
            const allAuthors = [
              publication.profiles?.display_name || '',
              ...(authorsMap[publication.id] || []).map(a => a.author_name)
            ].filter(Boolean);

            return (
              <Card key={publication.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl mb-2">
                    <Link 
                      to={`/publicacao/${publication.id}`}
                      className="hover:text-primary transition-colors"
                    >
                      {publication.title}
                    </Link>
                  </CardTitle>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">
                        Por {allAuthors.join(', ')}
                      </span>
                      {publication.profiles?.institution && (
                        <span className="ml-2">• {publication.profiles.institution}</span>
                      )}
                    </div>
                    <span>
                      {formatDistanceToNow(
                        new Date(publication.published_at || publication.created_at),
                        { addSuffix: true, locale: ptBR }
                      )}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {publication.summary && (
                      <p className="text-muted-foreground">{publication.summary}</p>
                    )}
                    
                    {publication.keywords && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Palavras-chave:</strong> {publication.keywords}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <Link to={`/publicacao/${publication.id}`}>
                        <Button variant="outline">
                          <FileText className="h-4 w-4 mr-2" />
                          Ler Publicação
                        </Button>
                      </Link>
                      
                      {publication.file_path && (
                        <span className="text-xs text-muted-foreground">PDF disponível</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goToPrevious}
            disabled={currentPage === 0}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Anterior</span>
          </Button>

          <div className="flex space-x-2">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageIndex = Math.max(0, Math.min(currentPage - 2, totalPages - 5)) + i;
              if (pageIndex >= totalPages) return null;
              
              return (
                <Button
                  key={pageIndex}
                  variant={currentPage === pageIndex ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageIndex)}
                >
                  {pageIndex + 1}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            onClick={goToNext}
            disabled={currentPage === totalPages - 1}
            className="flex items-center space-x-2"
          >
            <span>Próximo</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};