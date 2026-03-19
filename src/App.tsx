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
import ResetPassword from "./pages/ResetPassword";
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

    {/* Subscription page - always accessible */}
    <Route path="/abonnement" element={<ProtectedRoute allowedRoles={["admin"]}><Abonnement /></ProtectedRoute>} />

    {/* Protected routes wrapped in trial gate */}
    <Route path="/" element={<ProtectedRoute><TrialExpiredGate><Dashboard /></TrialExpiredGate></ProtectedRoute>} />
    <Route path="/vehicules" element={<ProtectedRoute><TrialExpiredGate><Vehicules /></TrialExpiredGate></ProtectedRoute>} />
    <Route path="/stock" element={<ProtectedRoute><TrialExpiredGate><Stock /></TrialExpiredGate></ProtectedRoute>} />
    <Route path="/agenda" element={<ProtectedRoute><TrialExpiredGate><Agenda /></TrialExpiredGate></ProtectedRoute>} />

    {/* Admin + Commercial */}
    <Route path="/depot-vente" element={<ProtectedRoute allowedRoles={["admin", "commercial"]}><TrialExpiredGate><DepotVente /></TrialExpiredGate></ProtectedRoute>} />
    <Route path="/crm" element={<ProtectedRoute allowedRoles={["admin", "commercial"]}><TrialExpiredGate><CRM /></TrialExpiredGate></ProtectedRoute>} />
    <Route path="/reprises" element={<ProtectedRoute allowedRoles={["admin", "commercial"]}><TrialExpiredGate><Reprises /></TrialExpiredGate></ProtectedRoute>} />
    <Route path="/diffusion" element={<ProtectedRoute allowedRoles={["admin", "commercial"]}><TrialExpiredGate><Diffusion /></TrialExpiredGate></ProtectedRoute>} />

    {/* Admin + Commercial + Comptable */}
    <Route path="/devis" element={<ProtectedRoute allowedRoles={["admin", "commercial", "comptable"]}><TrialExpiredGate><Devis /></TrialExpiredGate></ProtectedRoute>} />

    {/* Admin + Comptable */}
    <Route path="/importation" element={<ProtectedRoute allowedRoles={["admin", "comptable"]}><TrialExpiredGate><Importation /></TrialExpiredGate></ProtectedRoute>} />
    <Route path="/finance" element={<ProtectedRoute allowedRoles={["admin", "comptable"]}><TrialExpiredGate><Finance /></TrialExpiredGate></ProtectedRoute>} />

    {/* Admin only */}
    <Route path="/agences" element={<ProtectedRoute allowedRoles={["admin"]}><TrialExpiredGate><Agences /></TrialExpiredGate></ProtectedRoute>} />
    <Route path="/extensions" element={<ProtectedRoute allowedRoles={["admin"]}><TrialExpiredGate><Extensions /></TrialExpiredGate></ProtectedRoute>} />
    <Route path="/parametres" element={<ProtectedRoute allowedRoles={["admin"]}><TrialExpiredGate><Parametres /></TrialExpiredGate></ProtectedRoute>} />

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
