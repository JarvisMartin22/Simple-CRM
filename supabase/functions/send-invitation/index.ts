import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { email, role = 'member' } = await req.json()

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get user's tenant
    const { data: userTenant, error: tenantError } = await supabase
      .from('user_tenants')
      .select('tenant_id, name')
      .eq('user_id', user.id)
      .single()

    if (tenantError || !userTenant) {
      return new Response(JSON.stringify({ error: 'Tenant not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create invitation using database function
    const { data: invitation, error: invitationError } = await supabase
      .rpc('create_invitation', {
        p_tenant_id: userTenant.tenant_id,
        p_email: email,
        p_role: role,
      })

    if (invitationError || !invitation.success) {
      return new Response(JSON.stringify({ 
        error: invitation?.error || invitationError?.message || 'Failed to create invitation' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Here you would typically send an email
    // For now, we'll just return the invitation details
    // In production, integrate with your email service (SendGrid, AWS SES, etc.)
    
    const inviteUrl = `${req.headers.get('origin')}/auth/accept-invitation?token=${invitation.token}`
    
    console.log(`Invitation created for ${email}: ${inviteUrl}`)
    
    // TODO: Send actual email here
    // await sendInvitationEmail({
    //   to: email,
    //   inviterName: user.email,
    //   companyName: userTenant.name,
    //   inviteUrl,
    //   role
    // })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation sent successfully',
        inviteUrl // Return this for testing purposes
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Invitation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})