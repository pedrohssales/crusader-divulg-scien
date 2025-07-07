import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, BookOpen, Target } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Sobre a Plataforma</h1>
          <p className="text-xl text-muted-foreground">
            Divulgação Científica da UFPE - Campus Caruaru
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-primary" />
                <span>Nossa Missão</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Promover a divulgação científica e facilitar o compartilhamento de 
                conhecimento entre a comunidade acadêmica do Campus Caruaru da UFPE, 
                tornando a ciência mais acessível e compreensível para todos.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span>O que Fazemos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Oferecemos uma plataforma digital onde pesquisadores, estudantes 
                e docentes podem publicar e compartilhar suas descobertas científicas, 
                projetos de pesquisa e reflexões acadêmicas de forma organizada e acessível.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span>UFPE - Campus Caruaru</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              O Campus Caruaru da Universidade Federal de Pernambuco foi criado em 2006 
              e desde então tem se destacado na região do Agreste pernambucano como um 
              centro de excelência em ensino, pesquisa e extensão.
            </p>
            <p className="text-muted-foreground">
              Com cursos de graduação e pós-graduação em diversas áreas do conhecimento, 
              o campus contribui significativamente para o desenvolvimento científico, 
              tecnológico e social da região.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Para Quem</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li>• <strong>Pesquisadores:</strong> Compartilhem suas descobertas e estudos</li>
              <li>• <strong>Estudantes:</strong> Divulguem projetos de iniciação científica e TCC</li>
              <li>• <strong>Docentes:</strong> Publiquem reflexões e resultados de pesquisa</li>
              <li>• <strong>Comunidade:</strong> Acesse conhecimento científico de qualidade</li>
            </ul>
          </CardContent>
        </Card>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Esta plataforma é uma iniciativa do Campus Caruaru da UFPE para fortalecer 
            a cultura científica e promover o diálogo entre academia e sociedade.
          </p>
        </div>
      </div>
    </div>
  );
};