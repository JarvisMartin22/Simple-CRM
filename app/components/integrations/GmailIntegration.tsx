import { useState, useEffect } from 'react'
import { useSupabase } from '@/lib/supabase/supabase-provider'

export function GmailIntegration() {
  const { supabase } = useSupabase()
  const [integration, setIntegration] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchIntegration()
  }, [])

  const fetchIntegration = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('provider', 'gmail')
        .single()

      if (error) throw error
      setIntegration(data)
    } catch (error) {
      console.error('Error fetching integration:', error)
      setError('Failed to fetch integration status')
    } finally {
      setLoading(false)
    }
  }

  const initiateGmailAuth = async () => {
    try {
      setConnecting(true)
      setError(null)
      
      console.log('Requesting OAuth URL')
      const { data, error } = await supabase.functions.invoke('gmail-auth', {
        body: { test: true }
      })

      if (error) throw error
      
      if (!data || !data.url) {
        throw new Error('Failed to get authorization URL')
      }
      
      console.log('Redirecting to OAuth URL')
      
      // Generate a random state parameter for CSRF protection
      const state = Math.random().toString(36).substring(2, 15)
      
      // Store state in localStorage to verify on return
      localStorage.setItem('gmail_auth_state', state)
      
      // Add state parameter to URL
      const authUrl = new URL(data.url)
      authUrl.searchParams.append('state', state)
      
      // Navigate directly to the OAuth URL
      window.location.href = authUrl.toString()
    } catch (error) {
      console.error('Error initiating Gmail auth:', error)
      setError('Failed to initiate Gmail authentication')
      setConnecting(false)
    }
  }

  const disconnectGmail = async () => {
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase
        .from('user_integrations')
        .delete()
        .eq('provider', 'gmail')

      if (error) throw error

      setIntegration(null)
    } catch (error) {
      console.error('Error disconnecting Gmail:', error)
      setError('Failed to disconnect Gmail integration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Gmail Integration</h2>
        <p className="text-gray-600">Connect your Gmail account to send emails and track responses</p>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-600">Loading...</div>
      ) : integration ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Connected Account</p>
              <p className="text-gray-600">{integration.email}</p>
            </div>
            <button
              onClick={disconnectGmail}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Disconnect
            </button>
          </div>
          <div className="text-sm text-gray-500">
            <p>Last updated: {new Date(integration.updated_at).toLocaleDateString()}</p>
          </div>
        </div>
      ) : (
        <button
          onClick={initiateGmailAuth}
          disabled={connecting || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          {connecting ? (
            <>
              <span className="mr-2">Connecting...</span>
              <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
            </>
          ) : (
            'Connect Gmail'
          )}
        </button>
      )}
    </div>
  )
} 