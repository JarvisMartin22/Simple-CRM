import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Tenant, TenantUsage, BillingState } from '@/types/billing';
import { useAuth } from './AuthContext';

interface BillingContextType extends BillingState {
  checkUsageLimit: (usageType: 'contacts' | 'emails', increment?: number) => Promise<boolean>;
  refreshBilling: () => Promise<void>;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
};

interface BillingProviderProps {
  children: ReactNode;
}

export const BillingProvider: React.FC<BillingProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<BillingState>({
    tenant: null,
    usage: null,
    loading: true,
    error: null,
  });

  const fetchBillingData = async () => {
    if (!user) {
      setState({
        tenant: null,
        usage: null,
        loading: false,
        error: null,
      });
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Fetch tenant data
      const { data: tenantData, error: tenantError } = await supabase
        .from('user_tenants')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (tenantError) throw tenantError;

      // Fetch usage data
      const { data: usageData, error: usageError } = await supabase
        .from('tenant_usage')
        .select('*')
        .eq('tenant_id', tenantData.tenant_id)
        .single();

      if (usageError && usageError.code !== 'PGRST116') throw usageError;

      setState({
        tenant: tenantData as Tenant,
        usage: usageData as TenantUsage | null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching billing data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch billing data',
      }));
    }
  };

  const checkUsageLimit = async (usageType: 'contacts' | 'emails', increment = 1): Promise<boolean> => {
    if (!state.tenant) return false;

    try {
      const { data, error } = await supabase.rpc('check_usage_limit', {
        p_tenant_id: state.tenant.id,
        p_usage_type: usageType,
        p_increment: increment,
      });

      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return false;
    }
  };

  const refreshBilling = async () => {
    await fetchBillingData();
  };

  // Set up real-time subscription for billing updates
  useEffect(() => {
    if (!user || !state.tenant) return;

    const channel = supabase
      .channel('billing-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tenants',
          filter: `id=eq.${state.tenant.id}`,
        },
        () => {
          fetchBillingData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tenant_usage',
          filter: `tenant_id=eq.${state.tenant.id}`,
        },
        () => {
          fetchBillingData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, state.tenant?.id]);

  useEffect(() => {
    fetchBillingData();
  }, [user]);

  return (
    <BillingContext.Provider
      value={{
        ...state,
        checkUsageLimit,
        refreshBilling,
      }}
    >
      {children}
    </BillingContext.Provider>
  );
};

export default BillingProvider;