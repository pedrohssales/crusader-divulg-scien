import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Publication } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ITEMS_PER_PAGE = 1;

export const Readings: React.FC = () => {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    fetchPublications();
  }, []);

  const fetchPublications = async () => {
    try {
      const { data, error } = await supabase
        .from('publications')
        .select(`
          *,
          profiles (*)
        `)
        .eq('status', 'approved')
        .order('published_at', { ascending: false, nullsFirst: false });

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

  const totalPages = Math.ceil(publications.length / ITEMS_PER_PAGE);
  const currentPublication = publications[currentPage];

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
          <h1 className="text-3xl font-bold mb-4">Leituras Contínuas</h1>
          <p className="text-muted-foreground">
            Nenhuma publicação aprovada encontrada para leitura.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Leituras Contínuas</h1>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>{currentPage + 1} de {totalPages}</span>
          </div>
        </div>

        {currentPublication && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl mb-2">
                {currentPublication.title}
              </CardTitle>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="font-medium">
                  Por {currentPublication.profiles?.display_name}
                </span>
                <span>
                  {formatDistanceToNow(
                    new Date(currentPublication.published_at || currentPublication.created_at),
                    { addSuffix: true, locale: ptBR }
                  )}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-none">
                <div dangerouslySetInnerHTML={{ __html: currentPublication.content }} />
              </div>
            </CardContent>
          </Card>
        )}

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