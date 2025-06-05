-- Add tenant_id to auth.users metadata
-- Note: We cannot directly alter auth.users table, so we'll use user metadata

-- Create a function to ensure users have a tenant on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id uuid;
BEGIN
  -- Create a new tenant for the user
  INSERT INTO public.tenants (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', NEW.email))
  RETURNING id INTO new_tenant_id;

  -- Update user metadata with tenant_id
  NEW.raw_user_meta_data = jsonb_set(
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
    '{tenant_id}',
    to_jsonb(new_tenant_id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create a view to easily access user's tenant_id
CREATE OR REPLACE VIEW public.user_tenants AS
SELECT 
  au.id as user_id,
  au.email,
  (au.raw_user_meta_data->>'tenant_id')::uuid as tenant_id,
  t.*
FROM auth.users au
LEFT JOIN public.tenants t ON t.id = (au.raw_user_meta_data->>'tenant_id')::uuid;

-- Grant access to the view
GRANT SELECT ON public.user_tenants TO authenticated;