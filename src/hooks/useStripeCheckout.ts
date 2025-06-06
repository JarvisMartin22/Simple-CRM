import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase';
import { STRIPE_CONFIG } from '@/config/stripe';
import { useToast } from '@/hooks/use-toast';
import { invokeEdgeFunction } from '@/lib/edgeFunctions';

const stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);

export const useStripeCheckout = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createCheckoutSession = async (priceId: string) => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Error',
          description: 'You must be logged in to subscribe',
          variant: 'destructive',
        });
        return;
      }

      // Check if we're in development mode and edge functions aren't available
      const isDevelopment = window.location.hostname === 'localhost';
      
      if (isDevelopment) {
        // For development: Show a demo toast and redirect to settings
        toast({
          title: 'Development Mode',
          description: `Demo: Selected plan with price ID: ${priceId}. In production, this would redirect to Stripe checkout.`,
          variant: 'default',
        });
        
        // Simulate successful checkout redirect
        window.location.href = `/app/settings?tab=billing&success=true&demo=true`;
        return;
      }

      // Call edge function to create checkout session (production)
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          priceId,
          successUrl: `${window.location.origin}/app/settings?tab=billing&success=true`,
          cancelUrl: `${window.location.origin}/app/settings?tab=billing`,
        },
      });

      if (error) throw error;

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (stripeError) throw stripeError;
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create checkout session',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Error',
          description: 'You must be logged in to manage billing',
          variant: 'destructive',
        });
        return;
      }

      // Check if we're in development mode
      const isDevelopment = window.location.hostname === 'localhost';
      
      if (isDevelopment) {
        // For development: Show a demo message
        toast({
          title: 'Development Mode',
          description: 'Demo: In production, this would open the Stripe Customer Portal for managing your subscription.',
          variant: 'default',
        });
        return;
      }

      // Call edge function to create portal session (production)
      const { data, error } = await supabase.functions.invoke('stripe-portal', {
        body: {
          returnUrl: `${window.location.origin}/app/settings?tab=billing`,
        },
      });

      if (error) throw error;

      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } catch (error) {
      console.error('Portal error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to open billing portal',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    createCheckoutSession,
    openCustomerPortal,
    loading,
  };
};