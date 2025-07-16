import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Publication, PublicationReview, PublicationAuthor } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FileText, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const PublicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const [publication, setPublication] = useState<Publication | null>(null);
  const [reviews, setReviews] = useState<PublicationReview[]>([]);
  const [authors, setAuthors] = useState<PublicationAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPublication();
    }
  }, [id, user]);

  const fetchPublication = async () => {
    try {
      const { data, error } = await supabase
        .from('publications')
        .select(`
          *,
          profiles (*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching publication:', error);
        setNotFound(true);
        return;
      }

      // Check if user can view this publication
      if (data.status !== 'approved' && !user) {
        setNotFound(true);
        return;
      }

      if (data.status !== 'approved' && user) {
        // User can only see their own non-approved publications or if they're admin
        const isAuthor = data.profiles?.user_id === user.id;
        const isAdmin = profile?.user_type === 'admin';
        
        if (!isAuthor && !isAdmin) {
          setNotFound(true);
          return;
        }
      }

      setPublication(data);

      // Fetch additional authors
      const { data: authorsData } = await supabase
        .from('publication_authors')
        .select('*')
        .eq('publication_id', id)
        .order('author_order');

      if (authorsData) {
        setAuthors(authorsData);
      }

      // Fetch reviews if user is author or admin
      if (user && (data.profiles?.user_id === user.id || profile?.user_type === 'admin')) {
        fetchReviews();
      }
    } catch (error) {
      console.error('Error:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('publication_reviews')
        .select(`
          *,
          profiles (display_name)
        `)
        .eq('publication_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        return;
      }

      setReviews(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('publications')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const viewPDF = () => {
    if (publication?.file_path) {
      const url = getPublicUrl(publication.file_path);
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2 mb-8" />
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !publication) {
    return <Navigate to="/404" replace />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      case 'returned': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'pending': return 'Pendente';
      case 'rejected': return 'Rejeitado';
      case 'returned': return 'Devolvido';
      case 'draft': return 'Rascunho';
      default: return status;
    }
  };

  const allAuthors = [
    publication.profiles?.display_name || '',
    ...authors.map(a => a.author_name)
  ].filter(Boolean);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold leading-tight">
              {publication.title}
            </h1>
            {publication.status !== 'approved' && (
              <Badge variant={getStatusColor(publication.status)}>
                {getStatusText(publication.status)}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between text-muted-foreground mb-4">
            <span className="font-medium">
              Por {allAuthors.join(', ')}
            </span>
            <span>
              {formatDistanceToNow(
                new Date(publication.published_at || publication.created_at),
                { addSuffix: true, locale: ptBR }
              )}
            </span>
          </div>

          {publication.keywords && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                <strong>Palavras-chave:</strong> {publication.keywords}
              </p>
            </div>
          )}

          {publication.summary && (
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <p className="text-muted-foreground italic">
                {publication.summary}
              </p>
            </div>
          )}
        </div>

        {/* PDF Viewer */}
        {publication.file_path ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Documento</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={viewPDF} className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar PDF
                </Button>
                
                {/* Embed PDF viewer */}
                <div className="w-full h-96 border rounded-lg overflow-hidden">
                  <iframe
                    src={`${getPublicUrl(publication.file_path)}#toolbar=1&navpanes=1&scrollbar=1`}
                    className="w-full h-full"
                    title="PDF Viewer"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum arquivo PDF disponível para esta publicação.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews section - only visible to author and admin */}
        {reviews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Revisões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reviews.map((review) => (
                <Alert key={review.id}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant={getStatusColor(review.decision)}>
                          {getStatusText(review.decision)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(review.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      <p className="text-sm">{review.justification}</p>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};