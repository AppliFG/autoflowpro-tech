import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vehicules" element={<Vehicules />} />
          <Route path="/depot-vente" element={<DepotVente />} />
          <Route path="/crm" element={<CRM />} />
          <Route path="/reprises" element={<Reprises />} />
          <Route path="/diffusion" element={<Diffusion />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/agences" element={<Agences />} />
          <Route path="/abonnement" element={<Abonnement />} />
          <Route path="/extensions" element={<Extensions />} />
          <Route path="/parametres" element={<Parametres />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
