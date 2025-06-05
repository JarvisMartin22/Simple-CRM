export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  // Product/Price IDs for monthly and annual billing
  prices: {
    essential: {
      monthly: import.meta.env.VITE_STRIPE_PRICE_ESSENTIAL_MONTHLY || '',
      annual: import.meta.env.VITE_STRIPE_PRICE_ESSENTIAL_ANNUAL || '',
    },
    advanced: {
      monthly: import.meta.env.VITE_STRIPE_PRICE_ADVANCED_MONTHLY || '',
      annual: import.meta.env.VITE_STRIPE_PRICE_ADVANCED_ANNUAL || '',
    },
    expert: {
      monthly: import.meta.env.VITE_STRIPE_PRICE_EXPERT_MONTHLY || '',
      annual: import.meta.env.VITE_STRIPE_PRICE_EXPERT_ANNUAL || '',
    },
  },
  plans: {
    essential: {
      name: 'Essential',
      description: 'Perfect for individuals and small teams just getting started',
      pricing: {
        monthly: { price: 4.99, interval: 'month' },
        annual: { price: 47.88, interval: 'year', savings: 'Save 20%' },
      },
      currency: 'usd',
      features: [
        '1 user',
        '500 contacts',
        'Basic CRM features',
        'Email support',
      ],
      limits: {
        users: 1,
        contacts: 500,
        emailsPerMonth: 0,
        campaigns: false,
        apiAccess: false,
      },
    },
    advanced: {
      name: 'Advanced',
      description: 'Great for growing teams that need email campaigns',
      pricing: {
        monthly: { price: 14.99, interval: 'month' },
        annual: { price: 143.88, interval: 'year', savings: 'Save 20%' },
      },
      currency: 'usd',
      features: [
        'Up to 5 users',
        '2,500 contacts',
        '1,200 emails/month',
        'Email campaigns',
        'Advanced analytics',
        'Priority support',
      ],
      limits: {
        users: 5,
        contacts: 2500,
        emailsPerMonth: 1200,
        campaigns: true,
        apiAccess: false,
      },
    },
    expert: {
      name: 'Expert',
      description: 'For larger teams that need full access and API',
      pricing: {
        monthly: { price: 24.99, interval: 'month' },
        annual: { price: 239.88, interval: 'year', savings: 'Save 20%' },
      },
      currency: 'usd',
      features: [
        'Unlimited users',
        'Unlimited contacts',
        '5,000 emails/month',
        'Email campaigns',
        'API access',
        'Advanced analytics',
        'Dedicated support',
        'Custom integrations',
      ],
      limits: {
        users: -1, // unlimited
        contacts: -1, // unlimited
        emailsPerMonth: 5000,
        campaigns: true,
        apiAccess: true,
      },
    },
  },
} as const;

export type PlanType = keyof typeof STRIPE_CONFIG.plans;
export type PlanLimits = typeof STRIPE_CONFIG.plans[PlanType]['limits'];