-- Create user invitations table for multi-user tenant support
CREATE TABLE public.user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  token text NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(tenant_id, email)
);

-- Add indexes
CREATE INDEX idx_user_invitations_tenant_id ON public.user_invitations(tenant_id);
CREATE INDEX idx_user_invitations_email ON public.user_invitations(email);
CREATE INDEX idx_user_invitations_token ON public.user_invitations(token);
CREATE INDEX idx_user_invitations_status ON public.user_invitations(status);

-- Enable RLS
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view invitations for their tenant" ON public.user_invitations
  FOR SELECT USING (
    tenant_id IN (
      SELECT (raw_user_meta_data->>'tenant_id')::uuid 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create invitations for their tenant" ON public.user_invitations
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT (raw_user_meta_data->>'tenant_id')::uuid 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update invitations for their tenant" ON public.user_invitations
  FOR UPDATE USING (
    tenant_id IN (
      SELECT (raw_user_meta_data->>'tenant_id')::uuid 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  );

-- Add updated_at trigger
CREATE TRIGGER set_user_invitations_updated_at
  BEFORE UPDATE ON public.user_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle invitation acceptance
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token text)
RETURNS json AS $$
DECLARE
  invitation_record record;
  result json;
BEGIN
  -- Get the invitation
  SELECT * INTO invitation_record
  FROM public.user_invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = invitation_record.email) THEN
    -- User exists, update their tenant_id
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{tenant_id}',
      to_jsonb(invitation_record.tenant_id)
    )
    WHERE email = invitation_record.email;
  END IF;

  -- Mark invitation as accepted
  UPDATE public.user_invitations
  SET status = 'accepted',
      updated_at = now()
  WHERE id = invitation_record.id;

  result := json_build_object(
    'success', true,
    'tenant_id', invitation_record.tenant_id,
    'role', invitation_record.role
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to send invitation (this would be called from edge function)
CREATE OR REPLACE FUNCTION public.create_invitation(
  p_tenant_id uuid,
  p_email text,
  p_role text DEFAULT 'member'
)
RETURNS json AS $$
DECLARE
  invitation_record record;
  tenant_record record;
  result json;
BEGIN
  -- Check if tenant can invite users
  SELECT * INTO tenant_record FROM public.tenants WHERE id = p_tenant_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Tenant not found');
  END IF;

  IF NOT tenant_record.can_invite_users THEN
    RETURN json_build_object('success', false, 'error', 'Your plan does not support multi-user access');
  END IF;

  -- Check if invitation already exists
  IF EXISTS (
    SELECT 1 FROM public.user_invitations 
    WHERE tenant_id = p_tenant_id 
    AND email = p_email 
    AND status = 'pending'
    AND expires_at > now()
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Invitation already sent to this email');
  END IF;

  -- Create the invitation
  INSERT INTO public.user_invitations (tenant_id, email, role, invited_by)
  VALUES (p_tenant_id, p_email, p_role, auth.uid())
  RETURNING * INTO invitation_record;

  result := json_build_object(
    'success', true,
    'invitation_id', invitation_record.id,
    'token', invitation_record.token,
    'email', invitation_record.email,
    'expires_at', invitation_record.expires_at
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;