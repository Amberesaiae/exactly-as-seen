import { useEffect, useState, lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { setupOnlineListener } from "@/lib/sync";

// Eagerly loaded critical pages (for SEO / immediate rendering)
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

// Lazy loaded pages/layouts for code-splitting
const LandingLayout = lazy(() => import("./components/landing/LandingLayout"));
const Platform = lazy(() => import("./pages/landing/Platform"));
const Solutions = lazy(() => import("./pages/landing/Solutions"));
const Impact = lazy(() => import("./pages/landing/Impact"));
const Resources = lazy(() => import("./pages/landing/Resources"));
const Welcome = lazy(() => import("./pages/Welcome"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const FarmSetup = lazy(() => import("./pages/FarmSetup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Batches = lazy(() => import("./pages/Batches"));
const BatchCreate = lazy(() => import("./pages/BatchCreate"));
const BatchDetail = lazy(() => import("./pages/BatchDetail"));
const Feed = lazy(() => import("./pages/Feed"));
const FeedFormulation = lazy(() => import("./pages/FeedFormulation"));
const Health = lazy(() => import("./pages/Health"));
const Eggs = lazy(() => import("./pages/Eggs"));
const Finance = lazy(() => import("./pages/Finance"));
const Stock = lazy(() => import("./pages/Stock"));
const Records = lazy(() => import("./pages/Records"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

import { getHighs } from "@/lib/feed-lp";

function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full gap-4 text-center p-6 animate-fade-in">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/20 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-8 w-8 bg-gradient-to-tr from-primary to-amber-500 animate-spin duration-1000"></span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-semibold text-slate-200 tracking-wide">Loading LampFarms Module</p>
        <p className="text-xs text-slate-400 max-w-[240px]">Preparing secure offline ledger modules & analytics</p>
      </div>
    </div>
  );
}

const queryClient = new QueryClient();

function AppInner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    setupOnlineListener();
    // Non-blocking eager preloading of solver WASM
    getHighs().catch(err => console.error("Error preloading HiGHS WASM solver:", err));

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("User accepted PWA installation");
    }
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route element={<LandingLayout />}>
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/platform" element={<Platform />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/impact" element={<Impact />} />
            <Route path="/resources" element={<Resources />} />
          </Route>
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
      </Suspense>

      {/* Floating Installation Prompt */}
      {showInstallBtn && (
        <div className="fixed bottom-20 left-4 right-4 md:bottom-6 md:left-auto md:right-6 z-50 bg-slate-950/95 border border-slate-800 text-slate-100 p-3.5 rounded-xl shadow-2xl flex items-center justify-between gap-3 animate-bounce backdrop-blur-md max-w-sm">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold">Install LampFarms App</span>
            <span className="text-xxs text-slate-400">Access offline ledger and rapid mobile metrics</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowInstallBtn(false)}
              className="text-xxs font-semibold text-slate-400 hover:text-slate-200 px-2 py-1 rounded"
            >
              Dismiss
            </button>
            <button
              onClick={handleInstallClick}
              className="text-xxs font-bold bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-lg shadow-sm transition-all"
            >
              Install
            </button>
          </div>
        </div>
      )}

      {/* Toast-style Offline Banner */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 right-4 md:bottom-6 md:left-auto md:right-6 z-50 bg-red-950/95 border border-red-500/20 text-red-200 px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in backdrop-blur-md max-w-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-xs font-semibold">Running offline — changes will sync when online.</span>
        </div>
      )}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AppInner />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
