import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import TrialExpiredGate from "@/components/TrialExpiredGate";
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
import Importation from "./pages/Importation";
import Login from "./pages/Login";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";
import { useAppMode } from "./hooks/useHostname";

const queryClient = new QueryClient();

const CrmRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<ProtectedRoute allowedRoles={["admin", "commercial"]}><CRM /></ProtectedRoute>} />
    <Route path="/crm" element={<ProtectedRoute allowedRoles={["admin", "commercial"]}><CRM /></ProtectedRoute>} />
    <Route path="/agenda" element={<ProtectedRoute allowedRoles={["admin", "commercial"]}><Agenda /></ProtectedRoute>} />
    <Route path="/reprises" element={<ProtectedRoute allowedRoles={["admin", "commercial"]}><Reprises /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const AppRoutes = () => (
  <Routes>
    {/* Public routes */}
    <Route path="/login" element={<Login />} />
    <Route path="/vitrine" element={<Vitrine />} />
    <Route path="/install" element={<Install />} />

    {/* Protected routes - all roles */}
    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/vehicules" element={<ProtectedRoute><Vehicules /></ProtectedRoute>} />
    <Route path="/stock" element={<ProtectedRoute><Stock /></ProtectedRoute>} />
    <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />

    {/* Admin + Commercial */}
    <Route path="/depot-vente" element={<ProtectedRoute allowedRoles={["admin", "commercial"]}><DepotVente /></ProtectedRoute>} />
    <Route path="/crm" element={<ProtectedRoute allowedRoles={["admin", "commercial"]}><CRM /></ProtectedRoute>} />
    <Route path="/reprises" element={<ProtectedRoute allowedRoles={["admin", "commercial"]}><Reprises /></ProtectedRoute>} />
    <Route path="/diffusion" element={<ProtectedRoute allowedRoles={["admin", "commercial"]}><Diffusion /></ProtectedRoute>} />

    {/* Admin + Commercial + Comptable */}
    <Route path="/devis" element={<ProtectedRoute allowedRoles={["admin", "commercial", "comptable"]}><Devis /></ProtectedRoute>} />

    {/* Admin + Comptable */}
    <Route path="/importation" element={<ProtectedRoute allowedRoles={["admin", "comptable"]}><Importation /></ProtectedRoute>} />
    <Route path="/finance" element={<ProtectedRoute allowedRoles={["admin", "comptable"]}><Finance /></ProtectedRoute>} />

    {/* Admin only */}
    <Route path="/agences" element={<ProtectedRoute allowedRoles={["admin"]}><Agences /></ProtectedRoute>} />
    <Route path="/abonnement" element={<ProtectedRoute allowedRoles={["admin"]}><Abonnement /></ProtectedRoute>} />
    <Route path="/extensions" element={<ProtectedRoute allowedRoles={["admin"]}><Extensions /></ProtectedRoute>} />
    <Route path="/parametres" element={<ProtectedRoute allowedRoles={["admin"]}><Parametres /></ProtectedRoute>} />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const AppContent = () => {
  const mode = useAppMode();
  return mode === 'crm' ? <CrmRoutes /> : <AppRoutes />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
