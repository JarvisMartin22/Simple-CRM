'use client'

import { GmailIntegration } from '@/components/integrations/GmailIntegration'

export default function IntegrationsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Integrations</h1>
      <div className="space-y-8">
        <GmailIntegration />
        {/* Add other integrations here */}
      </div>
    </div>
  )
} 