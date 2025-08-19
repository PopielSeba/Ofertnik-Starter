import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Equipment from "@/pages/equipment";
import Quotes from "@/pages/quotes";
import QuoteDetail from "@/pages/quote-detail";
import CreateQuote from "@/pages/create-quote";
import EditQuote from "@/pages/edit-quote";
import Admin from "@/pages/admin";
import AdminRoom from "@/pages/admin-room";
import AdminNeedsAssessment from "@/pages/admin-needs-assessment";
import AdminApiKeys from "@/pages/admin-api-keys";
import AdminEquipmentCategories from "@/pages/admin-equipment-categories";
import AdminEquipmentManagement from "@/pages/admin-equipment-management";
import NeedsAssessment from "@/pages/needs-assessment";
import NeedsAssessmentList from "@/pages/needs-assessment-list";
import NeedsAssessmentPrint from "@/pages/needs-assessment-print";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import GuestQuote from "@/pages/guest-quote";
import PendingApproval from "@/pages/pending-approval";
import Navbar from "@/components/navbar";

function Router() {
  const { isAuthenticated, isLoading, user, needsApproval } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Switch>
          <Route path="/" component={Landing} />
          <Route component={() => <Landing />} />
        </Switch>
      </div>
    );
  }

  // Check if user needs approval (authenticated but not approved)
  if (needsApproval) {
    return (
      <div className="min-h-screen bg-background">
        <PendingApproval />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/equipment" component={Equipment} />
        <Route path="/quotes" component={Quotes} />
        <Route path="/quotes/:id" component={QuoteDetail} />
        <Route path="/quotes/:id/edit" component={EditQuote} />
        <Route path="/create-quote" component={() => <CreateQuote />} />
        <Route path="/needs-assessment" component={NeedsAssessment} />
        <Route path="/needs-assessment-list" component={NeedsAssessmentList} />
        <Route path="/needs-assessment/:id/print">
          {(params) => <NeedsAssessmentPrint id={params.id} />}
        </Route>
        <Route path="/admin" component={Admin} />
        <Route path="/admin-room" component={AdminRoom} />
        <Route path="/admin/needs-assessment" component={AdminNeedsAssessment} />
        <Route path="/admin/api-keys" component={AdminApiKeys} />
        <Route path="/admin/equipment-categories" component={AdminEquipmentCategories} />
        <Route path="/admin/equipment-management" component={AdminEquipmentManagement} />
        <Route path="/profile" component={Profile} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="sebastian-popiel-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
