
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { Toaster } from './components/ui/toaster';
import { ContactsProvider } from './contexts/ContactsContext';

// Import pages
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Pipelines from './pages/Pipelines';
import Campaigns from './pages/Campaigns';
import Calendar from './pages/Calendar';
import Integrations from './pages/Integrations';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/" element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="contacts" element={
            <ContactsProvider>
              <Contacts />
            </ContactsProvider>
          } />
          <Route path="pipelines" element={<Pipelines />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
