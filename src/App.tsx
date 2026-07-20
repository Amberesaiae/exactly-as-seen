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
        <span className="relative inline-flex rounded-full h-8 w-8 bg-gradient-to-tr from-primary to-warning animate-spin duration-1000"></span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-semibold text-foreground tracking-wide">Loading LampFarms Module</p>
        <p className="text-xs text-muted-foreground max-w-[240px]">Preparing secure offline ledger modules & analytics</p>
      </div>
    </div>
  );
}

const queryClient = new QueryClient();

function AppInner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);

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

  useEffect(() => {
    if (!showInstallBtn) return;
    const timer = setTimeout(() => setShowInstallBtn(false), 8000);
    return () => clearTimeout(timer);
  }, [showInstallBtn]);

  const dismissInstall = () => {
    setShowInstallBtn(false);
    setInstallDismissed(true);
  };

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
          <Route path="/farm-setup" element={<ProtectedRoute requireSetupComplete={false}><FarmSetup /></ProtectedRoute>} />

          {/* App shell routes — require farm setup complete */}
          <Route element={<ProtectedRoute requireSetupComplete><AppLayout /></ProtectedRoute>}>
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

      {/* Floating Installation Prompt — toast-style at top on mobile, bottom-right on desktop */}
      {showInstallBtn && !installDismissed && (
        <div className="fixed top-16 left-4 right-4 md:top-auto md:bottom-6 md:left-auto md:right-6 z-40 bg-card border border-border text-card-foreground p-3.5 rounded-xl shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-top-2 fade-in duration-300 backdrop-blur-md max-w-sm">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold">Install LampFarms App</span>
            <span className="text-xs text-muted-foreground">Access offline ledger and rapid mobile metrics</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={dismissInstall}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
              aria-label="Dismiss install prompt"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <button
              onClick={handleInstallClick}
              className="text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-lg shadow-sm transition-all"
            >
              Install
            </button>
          </div>
        </div>
      )}

      {/* Toast-style Offline Banner */}
      {!isOnline && (
        <div className="fixed bottom-16 left-4 right-4 md:bottom-6 md:left-auto md:right-6 z-40 bg-destructive/90 border border-destructive/30 text-destructive-foreground px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300 backdrop-blur-md max-w-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive-foreground opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive-foreground"></span>
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
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppInner />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
