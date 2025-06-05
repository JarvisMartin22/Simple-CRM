import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, Crown, Loader2, TrendingUp, Users, Mail, Zap, Shield, AlertCircle } from 'lucide-react';
import { useBilling } from '@/contexts/BillingContext';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { STRIPE_CONFIG } from '@/config/stripe';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const BillingTab: React.FC = () => {
  const { tenant, usage, loading: billingLoading, error, refreshBilling } = useBilling();
  const { createCheckoutSession, openCustomerPortal, loading: stripeLoading } = useStripeCheckout();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [isAnnual, setIsAnnual] = useState(false);

  // Check for success parameter from Stripe redirect
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      const isDemo = searchParams.get('demo') === 'true';
      toast({
        title: isDemo ? 'Demo Mode Success!' : 'Success!',
        description: isDemo 
          ? 'Demo: Your subscription would be updated successfully in production.'
          : 'Your subscription has been updated successfully.',
      });
      // Remove success parameter from URL
      searchParams.delete('success');
      searchParams.delete('demo');
      setSearchParams(searchParams);
      // Refresh billing data
      refreshBilling();
    }
  }, [searchParams]);

  if (billingLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>Error loading billing information: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPlan = tenant?.plan_type || 'essential';
  const currentPlanConfig = STRIPE_CONFIG.plans[currentPlan];
  const billingInterval = isAnnual ? 'annual' : 'monthly';

  // Calculate usage percentages
  const contactUsagePercent = usage && tenant ? 
    (usage.contact_count / tenant.contact_cap) * 100 : 0;
  const emailUsagePercent = usage && tenant && tenant.email_cap > 0 ? 
    (usage.email_send_count / tenant.email_cap) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Manage your subscription and billing</CardDescription>
            </div>
            {tenant?.stripe_subscription_id && (
              <Button 
                variant="outline" 
                onClick={openCustomerPortal}
                disabled={stripeLoading}
              >
                {stripeLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Manage Billing
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary rounded-lg">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg capitalize">{currentPlan} Plan</h3>
                <p className="text-gray-500">
                  ${currentPlanConfig.pricing.monthly.price}/{currentPlanConfig.pricing.monthly.interval}
                </p>
              </div>
            </div>
            <Badge className="text-sm" variant={currentPlan === 'expert' ? 'default' : 'secondary'}>
              {currentPlan === 'expert' ? 'Premium' : 'Active'}
            </Badge>
          </div>

          {tenant?.current_period_end && (
            <div className="text-sm text-gray-500">
              Next billing date: {format(new Date(tenant.current_period_end), 'MMMM d, yyyy')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Overview */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Usage Overview</CardTitle>
          <CardDescription>Track your resource usage this billing period</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Contacts Usage */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Contacts</span>
              <span className="text-gray-500">
                {usage?.contact_count || 0} / {tenant?.contact_cap === -1 ? 'Unlimited' : tenant?.contact_cap || 0}
              </span>
            </div>
            {tenant?.contact_cap !== -1 && (
              <Progress value={contactUsagePercent} className="h-2" />
            )}
          </div>

          {/* Email Usage */}
          {tenant?.email_cap && tenant.email_cap > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Emails Sent (This Month)</span>
                <span className="text-gray-500">
                  {usage?.email_send_count || 0} / {tenant.email_cap}
                </span>
              </div>
              <Progress value={emailUsagePercent} className="h-2" />
            </div>
          )}

          {/* Feature Access */}
          <Separator className="my-4" />
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Features</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center">
                {tenant?.can_use_campaigns ? (
                  <Check className="h-4 w-4 text-green-600 mr-2" />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-gray-300 mr-2" />
                )}
                <span className={tenant?.can_use_campaigns ? '' : 'text-gray-400'}>
                  Email Campaigns
                </span>
              </div>
              <div className="flex items-center">
                {tenant?.api_access ? (
                  <Check className="h-4 w-4 text-green-600 mr-2" />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-gray-300 mr-2" />
                )}
                <span className={tenant?.api_access ? '' : 'text-gray-400'}>
                  API Access
                </span>
              </div>
              <div className="flex items-center">
                {tenant?.can_invite_users ? (
                  <Check className="h-4 w-4 text-green-600 mr-2" />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-gray-300 mr-2" />
                )}
                <span className={tenant?.can_invite_users ? '' : 'text-gray-400'}>
                  Multi-user Support
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Available Plans</CardTitle>
              <CardDescription>Choose the plan that best fits your needs</CardDescription>
            </div>
            <div className="flex items-center space-x-3">
              <Label htmlFor="billing-toggle" className="text-sm">Monthly</Label>
              <Switch
                id="billing-toggle"
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
              />
              <Label htmlFor="billing-toggle" className="text-sm">
                Annual
                <span className="ml-1 text-xs text-green-600 font-medium">(Save 17%)</span>
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(STRIPE_CONFIG.plans).map(([key, plan]) => {
              const isCurrentPlan = key === currentPlan;
              const isUpgrade = 
                (currentPlan === 'essential' && (key === 'advanced' || key === 'expert')) ||
                (currentPlan === 'advanced' && key === 'expert');

              return (
                <div
                  key={key}
                  className={`relative rounded-lg border p-6 ${
                    isCurrentPlan ? 'border-primary shadow-sm' : 'border-gray-200'
                  }`}
                >
                  {isCurrentPlan && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Current Plan
                    </Badge>
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      <p className="text-gray-500 text-sm mt-1">{plan.description}</p>
                    </div>

                    <div className="text-center py-4">
                      <div className="text-3xl font-bold">
                        ${plan.pricing[billingInterval].price}
                      </div>
                      <div className="text-gray-500 text-sm">
                        per {plan.pricing[billingInterval].interval}
                        {isAnnual && (
                          <div className="text-green-600 text-xs mt-1 font-medium">
                            {plan.pricing.annual.savings}
                          </div>
                        )}
                      </div>
                    </div>

                    <ul className="space-y-2 text-sm">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-4">
                      {isCurrentPlan ? (
                        <Button className="w-full" disabled variant="outline">
                          Current Plan
                        </Button>
                      ) : (
                        <Button
                          className="w-full"
                          variant={isUpgrade ? 'default' : 'outline'}
                          onClick={() => {
                            const priceId = STRIPE_CONFIG.prices[key as keyof typeof STRIPE_CONFIG.prices][billingInterval];
                            createCheckoutSession(priceId);
                          }}
                          disabled={stripeLoading || !STRIPE_CONFIG.prices[key as keyof typeof STRIPE_CONFIG.prices][billingInterval]}
                        >
                          {stripeLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          {isUpgrade ? 'Upgrade' : 'Change Plan'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingTab;