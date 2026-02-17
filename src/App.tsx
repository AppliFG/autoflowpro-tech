import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Vehicules from "./pages/Vehicules";
import DepotVente from "./pages/DepotVente";
import CRM from "./pages/CRM";
import Reprises from "./pages/Reprises";
import Diffusion from "./pages/Diffusion";
import Finance from "./pages/Finance";
import Stock from "./pages/Stock";
import Agences from "./pages/Agences";
import Abonnement from "./pages/Abonnement";
import Extensions from "./pages/Extensions";
import Parametres from "./pages/Parametres";
import Devis from "./pages/Devis";
import Agenda from "./pages/Agenda";
import Vitrine from "./pages/Vitrine";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/vitrine" element={<Vitrine />} />

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/vehicules" element={<ProtectedRoute><Vehicules /></ProtectedRoute>} />
            <Route path="/depot-vente" element={<ProtectedRoute><DepotVente /></ProtectedRoute>} />
            <Route path="/crm" element={<ProtectedRoute><CRM /></ProtectedRoute>} />
            <Route path="/reprises" element={<ProtectedRoute><Reprises /></ProtectedRoute>} />
            <Route path="/diffusion" element={<ProtectedRoute><Diffusion /></ProtectedRoute>} />
            <Route path="/finance" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
            <Route path="/stock" element={<ProtectedRoute><Stock /></ProtectedRoute>} />
            <Route path="/agences" element={<ProtectedRoute><Agences /></ProtectedRoute>} />
            <Route path="/abonnement" element={<ProtectedRoute><Abonnement /></ProtectedRoute>} />
            <Route path="/extensions" element={<ProtectedRoute><Extensions /></ProtectedRoute>} />
            <Route path="/parametres" element={<ProtectedRoute><Parametres /></ProtectedRoute>} />
            <Route path="/devis" element={<ProtectedRoute><Devis /></ProtectedRoute>} />
            <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
