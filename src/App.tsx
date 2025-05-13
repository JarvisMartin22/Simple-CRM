
import React from 'react';
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
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Import pages
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Companies from './pages/Companies';
import Pipelines from './pages/Pipelines';
import Tasks from './pages/Tasks';
import Notes from './pages/Notes';
import Campaigns from './pages/Campaigns';
import Calendar from './pages/Calendar';
import Integrations from './pages/Integrations';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/auth">
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="contacts" element={
              <ContactsProvider>
                <Contacts />
              </ContactsProvider>
            } />
            <Route path="companies" element={
              <CompaniesProvider>
                <Companies />
              </CompaniesProvider>
            } />
            <Route path="pipelines" element={
              <PipelinesProvider>
                <Pipelines />
              </PipelinesProvider>
            } />
            <Route path="tasks" element={
              <TasksProvider>
                <Tasks />
              </TasksProvider>
            } />
            <Route path="notes" element={
              <NotesProvider>
                <Notes />
              </NotesProvider>
            } />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
