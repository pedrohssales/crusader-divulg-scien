import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t bg-background/50 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <p className="text-sm text-muted-foreground">
              © 2025 Vitrine Científica - UFPE Campus Acadêmico do Agreste
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            <Link 
              to="/sobre" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sobre
            </Link>
            <Link 
              to="/como-publicar" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Como Publicar
            </Link>
            <a 
              href="https://www.ufpe.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              UFPE
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};