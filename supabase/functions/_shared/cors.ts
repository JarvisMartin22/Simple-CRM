export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, range, cache-control, x-supabase-auth, x-auth-token, Authorization, Accept, Origin, Referer, User-Agent",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Expose-Headers": "Content-Length, Content-Range",
};

// Helper function to handle OPTIONS preflight requests
export function handleCors(req: Request) {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204, // No content
      headers: corsHeaders
    });
  }
  
  // Return null for non-OPTIONS requests
  return null;
}
