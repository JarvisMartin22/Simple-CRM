import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/layout/Layout';
import { Toaster } from './components/ui/toaster';
import { ContactsProvider } from './contexts/ContactsContext';
import { CompaniesProvider } from './contexts/CompaniesContext';
import { PipelinesProvider } from './contexts/PipelinesContext';
import { TasksProvider } from './contexts/TasksContext';
import { NotesProvider } from './contexts/NotesContext';
import { AuthProvider } from './contexts/AuthContext';
import { EmailProvider } from './contexts/EmailContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Callback from './pages/auth/Callback';
import GmailCallback from './pages/auth/GmailCallback';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useToast } from './components/ui/use-toast';
import TestSupabase from "./pages/auth/TestSupabase";

// Import pages
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Companies from './pages/Companies';
import Pipelines from './pages/Pipelines';
import Tasks from './pages/Tasks';
import Notes from './pages/Notes';
import Campaigns from './pages/Campaigns';
import CampaignCreate from './pages/CampaignCreate';
import CampaignDetails from './pages/CampaignDetails';
import CampaignEdit from './pages/CampaignEdit';
import Templates from './pages/Templates';
import Calendar from './pages/Calendar';
import Integrations from './pages/Integrations';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import LandingPage from './pages/LandingPage';
import TestCampaignCreation from './pages/TestCampaignCreation';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfService from './pages/legal/TermsOfService';

// Create a client
const queryClient = new QueryClient();

const App: React.FC = () => {
  const { toast } = useToast();
  
  // Debug event listener to capture postMessages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only log in development mode
      if (import.meta.env.DEV) {
        console.log('App: Message received from:', event.origin);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <EmailProvider>
          <ContactsProvider>
            <CompaniesProvider>
              <PipelinesProvider>
                <TasksProvider>
                  <NotesProvider>
                    <Routes>
                      {/* Auth routes (public) */}
                      <Route path="/auth/login" element={<Login />} />
                      <Route path="/auth/register" element={<Register />} />
                      <Route path="/auth/callback" element={<Callback />} />
                      <Route path="/auth/callback/gmail" element={<GmailCallback />} />
                      <Route path="/auth/test-supabase" element={<TestSupabase />} />
                      <Route path="/" element={<LandingPage />} />
                      
                      {/* Legal pages (public) */}
                      <Route path="/legal/privacy-policy" element={<PrivacyPolicy />} />
                      <Route path="/legal/terms-of-service" element={<TermsOfService />} />
                      
                      {/* Protected routes */}
                      <Route 
                        path="/app/dashboard" 
                        element={
                          <ProtectedRoute>
                            <Layout>
                              <Dashboard />
                            </Layout>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/app/contacts" 
                        element={
                          <ProtectedRoute>
                            <Layout>
                              <Contacts />
                            </Layout>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/app/companies" 
                        element={
                          <ProtectedRoute>
                            <Layout>
                              <Companies />
                            </Layout>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/app/pipelines" 
                        element={
                          <ProtectedRoute>
                            <Layout>
                              <Pipelines />
                            </Layout>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/app/tasks" 
                        element={
                          <ProtectedRoute>
                            <Layout>
                              <Tasks />
                            </Layout>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/app/notes" 
                        element={
                          <ProtectedRoute>
                            <Layout>
                              <Notes />
                            </Layout>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/app/campaigns" 
                        element={
                          <ProtectedRoute>
                            <Layout>
                              <Campaigns />
                            </Layout>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/app/campaigns/new" 
                        element={
                          <ProtectedRoute>
                            <Layout>
                              <CampaignCreate />
                            </Layout>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/app/campaigns/:id" 
                        element={
                          <ProtectedRoute>
                            <Layout>
                              <CampaignDetails />
                            </Layout>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/app/campaigns/:id/edit" 
                        element={
                          <ProtectedRoute>
                            <Layout>
                              <CampaignEdit />
                            </Layout>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/app/test-campaign" 
                        element={
                          <ProtectedRoute>
                            <Layout>
                              <TestCampaignCreation />
                            </Layout>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/app/templates" 
                        element={
                          <ProtectedRoute>
                            <Layout>
                              <Templates />
                            </Layout>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/app/calendar" 
                        element={
                          <ProtectedRoute>
                            <Layout>
                              <Calendar />
                            </Layout>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/app/integrations" 
                        element={
                          <ProtectedRoute>
                            <Layout>
                              <Integrations />
                            </Layout>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/app/settings" 
                        element={
                          <ProtectedRoute>
                            <Layout>
                              <Settings />
                            </Layout>
                          </ProtectedRoute>
                        } 
                      />
                      
                      {/* Test route */}
                      <Route 
                        path="/app/test-campaign" 
                        element={
                          <ProtectedRoute>
                            <Layout>
                              <TestCampaignCreation />
                            </Layout>
                          </ProtectedRoute>
                        } 
                      />

                      {/* Catch-all route */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    <Toaster />
                  </NotesProvider>
                </TasksProvider>
              </PipelinesProvider>
            </CompaniesProvider>
          </ContactsProvider>
        </EmailProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
