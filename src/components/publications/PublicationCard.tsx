import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Publication } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PublicationCardProps {
  publication: Publication;
}

export const PublicationCard: React.FC<PublicationCardProps> = ({ publication }) => {
  const publishedDate = publication.published_at || publication.created_at;
  
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <Link to={`/publicacao/${publication.id}`}>
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="text-xl font-semibold leading-tight line-clamp-2">
              {publication.title}
            </h3>
            {publication.status !== 'approved' && (
              <Badge variant="secondary" className="ml-2">
                {publication.status === 'pending' && 'Pendente'}
                {publication.status === 'draft' && 'Rascunho'}
                {publication.status === 'rejected' && 'Rejeitado'}
                {publication.status === 'returned' && 'Devolvido'}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground line-clamp-3">
            {publication.summary}
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex flex-col">
              <span className="font-medium">
                {publication.profiles?.display_name || 'Autor Desconhecido'}
              </span>
              <span className="text-xs">
                {publication.profiles?.institution}
              </span>
            </div>
            <span>
              {formatDistanceToNow(new Date(publishedDate), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};