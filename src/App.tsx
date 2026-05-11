import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { setupOnlineListener } from "@/lib/sync";
import Index from "./pages/Index";
import LandingLayout from "./components/landing/LandingLayout";
import Platform from "./pages/landing/Platform";
import Solutions from "./pages/landing/Solutions";
import Impact from "./pages/landing/Impact";
import Resources from "./pages/landing/Resources";
import Welcome from "./pages/Welcome";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import FarmSetup from "./pages/FarmSetup";
import Dashboard from "./pages/Dashboard";
import Batches from "./pages/Batches";
import BatchCreate from "./pages/BatchCreate";
import BatchDetail from "./pages/BatchDetail";
import Feed from "./pages/Feed";
import FeedFormulation from "./pages/FeedFormulation";
import Health from "./pages/Health";
import Eggs from "./pages/Eggs";
import Finance from "./pages/Finance";
import Stock from "./pages/Stock";
import Records from "./pages/Records";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppInner() {
  useEffect(() => {
    setupOnlineListener();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/farm-setup" element={<ProtectedRoute><FarmSetup /></ProtectedRoute>} />

      {/* App shell routes */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/batches" element={<Batches />} />
        <Route path="/batches/new" element={<BatchCreate />} />
        <Route path="/batches/:id" element={<BatchDetail />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/feed/formulate" element={<FeedFormulation />} />
        <Route path="/health" element={<Health />} />
        <Route path="/eggs" element={<Eggs />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/records" element={<Records />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppInner />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
