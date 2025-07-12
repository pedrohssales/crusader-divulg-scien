import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  LogIn, 
  FileText, 
  Send, 
  CheckCircle,
  ArrowRight,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const HowToPublish: React.FC = () => {
  const [rules, setRules] = useState<{ title: string; content: string; priority: string }[]>([]);

  useEffect(() => {
    // Buscar regras do Supabase (quando implementado)
    // Por enquanto, usamos regras de exemplo
    setRules([
      {
        title: "Critérios de Qualidade",
        content: "As publicações devem apresentar conteúdo científico relevante, com base em pesquisas, estudos ou reflexões acadêmicas fundamentadas.",
        priority: "high"
      },
      {
        title: "Formatação e Estrutura",
        content: "O texto deve ser bem estruturado, com introdução, desenvolvimento e conclusão claros. Use formatação adequada para facilitar a leitura.",
        priority: "medium"
      },
      {
        title: "Referências e Fontes",
        content: "Sempre cite suas fontes e referências bibliográficas quando aplicável. Trabalhos baseados em pesquisas devem incluir metodologia.",
        priority: "high"
      },
      {
        title: "Originalidade",
        content: "O conteúdo deve ser original e inédito. Não publique trabalhos já publicados em outras plataformas sem devida autorização.",
        priority: "high"
      },
      {
        title: "Linguagem Adequada",
        content: "Use linguagem formal acadêmica, mas acessível. Evite jargões excessivos que possam dificultar a compreensão.",
        priority: "medium"
      },
      {
        title: "Imagens e Mídia",
        content: "Certifique-se de ter direitos de uso de todas as imagens, vídeos ou outros materiais multimídia incluídos.",
        priority: "medium"
      }
    ]);
  }, []);

  const steps = [
    {
      number: 1,
      title: "Criar uma Conta",
      description: "Registre-se na plataforma com seus dados acadêmicos",
      icon: UserPlus,
      action: "Cadastrar-se",
      link: "/auth",
      details: [
        "Acesse a página de autenticação",
        "Clique em 'Criar conta'",
        "Preencha nome completo, e-mail, instituição e nome de exibição",
        "Confirme seu e-mail se necessário"
      ]
    },
    {
      number: 2,
      title: "Fazer Login",
      description: "Entre na sua conta para acessar as funcionalidades",
      icon: LogIn,
      action: "Entrar",
      link: "/auth",
      details: [
        "Use seu e-mail e senha cadastrados",
        "Acesse o menu do usuário no canto superior direito",
        "Navegue pelas opções disponíveis"
      ]
    },
    {
      number: 3,
      title: "Escrever a Publicação",
      description: "Use nosso editor avançado para criar seu conteúdo",
      icon: FileText,
      action: "Nova Publicação",
      link: "/nova-publicacao",
      details: [
        "Clique em 'Nova Publicação' no menu",
        "Adicione um título chamativo e informativo",
        "Escreva um resumo claro do seu trabalho",
        "Use o editor para formatar seu texto com imagens, vídeos e links",
        "Revise cuidadosamente antes de enviar"
      ]
    },
    {
      number: 4,
      title: "Enviar para Análise",
      description: "Submeta sua publicação para revisão administrativa",
      icon: Send,
      action: "Publicar",
      link: "",
      details: [
        "Clique em 'Publicar' após revisar seu conteúdo",
        "Sua publicação será enviada para análise",
        "Acompanhe o status em 'Minhas Publicações'",
        "Aguarde o retorno da equipe editorial"
      ]
    },
    {
      number: 5,
      title: "Acompanhar Status",
      description: "Monitore o progresso da sua publicação",
      icon: CheckCircle,
      action: "Minhas Publicações",
      link: "/minhas-publicacoes",
      details: [
        "Acesse 'Minhas Publicações' no menu do usuário",
        "Veja o status: Pendente, Aprovada, Devolvida ou Rejeitada",
        "Se devolvida, faça os ajustes solicitados",
        "Se aprovada, sua publicação estará disponível publicamente"
      ]
    }
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Alta Prioridade</Badge>;
      case 'medium':
        return <Badge variant="secondary">Média Prioridade</Badge>;
      case 'low':
        return <Badge variant="outline">Baixa Prioridade</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Como Publicar</h1>
          <p className="text-xl text-muted-foreground">
            Guia completo para compartilhar seu conhecimento na Vitrine Científica
          </p>
        </div>

        {/* Steps */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Passo a Passo</h2>
          <div className="space-y-6">
            {steps.map((step, index) => (
              <Card key={step.number} className="relative">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                        {step.number}
                      </div>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="flex items-center space-x-2">
                        <step.icon className="h-5 w-5" />
                        <span>{step.title}</span>
                      </CardTitle>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                    {step.link && (
                      <Button asChild>
                        <Link to={step.link}>
                          {step.action}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 ml-16">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                {index < steps.length - 1 && (
                  <div className="absolute left-6 bottom-0 w-0.5 h-6 bg-border translate-y-full"></div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Rules and Guidelines */}
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <BookOpen className="h-6 w-6" />
            <h2 className="text-2xl font-bold">Diretrizes para Publicação</h2>
          </div>
          
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Importante
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Todas as publicações passam por análise editorial antes de serem publicadas. 
                  Seguir estas diretrizes aumenta as chances de aprovação.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            {rules.map((rule, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{rule.title}</CardTitle>
                    {getPriorityBadge(rule.priority)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{rule.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button asChild size="lg">
              <Link to="/nova-publicacao">
                <FileText className="h-5 w-5 mr-2" />
                Começar a Escrever
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};