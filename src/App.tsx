import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Home } from "@/pages/Home";
import { About } from "@/pages/About";
import { Auth } from "@/pages/Auth";
import { Publications } from "@/pages/Publications";
import { PublicationDetail } from "@/pages/PublicationDetail";
import { NewPublication } from "@/pages/NewPublication";
import { EditPublication } from "@/pages/EditPublication";
import { AdminPanel } from "@/pages/AdminPanel";
import { AdminReview } from "@/pages/AdminReview";
import { RetainedPublications } from "@/pages/RetainedPublications";
import { Profile } from "@/pages/Profile";
import { MyPublications } from "@/pages/MyPublications";
import { SearchResults } from "@/pages/SearchResults";
import { HowToPublish } from "@/pages/HowToPublish";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-1">
             <Routes>
               <Route path="/" element={<Home />} />
               <Route path="/sobre" element={<About />} />
                <Route path="/publicacoes" element={<Publications />} />
                <Route path="/como-publicar" element={<HowToPublish />} />
               <Route path="/busca" element={<SearchResults />} />
               <Route path="/auth" element={<Auth />} />
               <Route path="/perfil" element={<Profile />} />
               <Route path="/minhas-publicacoes" element={<MyPublications />} />
               <Route path="/publicacao/:id" element={<PublicationDetail />} />
               <Route path="/nova-publicacao" element={<NewPublication />} />
               <Route path="/editar-publicacao/:id" element={<EditPublication />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/admin/revisar/:id" element={<AdminReview />} />
                <Route path="/admin/retidas" element={<RetainedPublications />} />
               {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
