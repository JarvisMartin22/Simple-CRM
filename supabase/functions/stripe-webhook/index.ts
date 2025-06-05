import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.customer && session.subscription && session.metadata?.tenant_id) {
          // Update tenant with Stripe info
          const { error } = await supabase
            .from('tenants')
            .update({
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              updated_at: new Date().toISOString(),
            })
            .eq('id', session.metadata.tenant_id)

          if (error) {
            console.error('Error updating tenant:', error)
            return new Response('Error updating tenant', { status: 500 })
          }
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const priceId = subscription.items.data[0]?.price.id

        // Map price IDs to plan types (supporting both monthly and annual)
        const planMap: Record<string, any> = {
          // Essential plan
          [Deno.env.get('STRIPE_PRICE_ESSENTIAL_MONTHLY') ?? '']: {
            plan_type: 'essential',
            contact_cap: 500,
            email_cap: 0,
            can_use_campaigns: false,
            can_invite_users: false,
            api_access: false,
          },
          [Deno.env.get('STRIPE_PRICE_ESSENTIAL_ANNUAL') ?? '']: {
            plan_type: 'essential',
            contact_cap: 500,
            email_cap: 0,
            can_use_campaigns: false,
            can_invite_users: false,
            api_access: false,
          },
          // Advanced plan
          [Deno.env.get('STRIPE_PRICE_ADVANCED_MONTHLY') ?? '']: {
            plan_type: 'advanced',
            contact_cap: 2500,
            email_cap: 1200,
            can_use_campaigns: true,
            can_invite_users: false,
            api_access: false,
          },
          [Deno.env.get('STRIPE_PRICE_ADVANCED_ANNUAL') ?? '']: {
            plan_type: 'advanced',
            contact_cap: 2500,
            email_cap: 1200,
            can_use_campaigns: true,
            can_invite_users: false,
            api_access: false,
          },
          // Expert plan
          [Deno.env.get('STRIPE_PRICE_EXPERT_MONTHLY') ?? '']: {
            plan_type: 'expert',
            contact_cap: -1, // unlimited
            email_cap: 5000,
            can_use_campaigns: true,
            can_invite_users: true,
            api_access: true,
          },
          [Deno.env.get('STRIPE_PRICE_EXPERT_ANNUAL') ?? '']: {
            plan_type: 'expert',
            contact_cap: -1, // unlimited
            email_cap: 5000,
            can_use_campaigns: true,
            can_invite_users: true,
            api_access: true,
          },
        }

        const planDetails = planMap[priceId]
        if (planDetails) {
          const { error } = await supabase
            .from('tenants')
            .update({
              ...planDetails,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id)

          if (error) {
            console.error('Error updating tenant plan:', error)
            return new Response('Error updating tenant plan', { status: 500 })
          }

          // Reset monthly usage if needed
          if (event.type === 'customer.subscription.updated' && 
              subscription.status === 'active') {
            const { data: tenant } = await supabase
              .from('tenants')
              .select('id')
              .eq('stripe_subscription_id', subscription.id)
              .single()

            if (tenant) {
              await supabase.rpc('reset_monthly_usage', { p_tenant_id: tenant.id })
            }
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Downgrade to essential plan
        const { error } = await supabase
          .from('tenants')
          .update({
            plan_type: 'essential',
            contact_cap: 500,
            email_cap: 0,
            can_use_campaigns: false,
            can_invite_users: false,
            api_access: false,
            current_period_end: null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('Error downgrading tenant:', error)
          return new Response('Error downgrading tenant', { status: 500 })
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription) {
          // Reset monthly email usage on successful payment
          const { data: tenant } = await supabase
            .from('tenants')
            .select('id')
            .eq('stripe_subscription_id', invoice.subscription)
            .single()

          if (tenant) {
            await supabase.rpc('reset_monthly_usage', { p_tenant_id: tenant.id })
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        // Could send notification email or update tenant status
        console.log('Payment failed for invoice:', invoice.id)
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})