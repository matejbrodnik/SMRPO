// supabase functions deploy deleteUser

import { decode } from 'https://deno.land/x/djwt/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = (await Deno.env.get('SUPABASE_URL')) ?? '';
  const supabaseServiceRoleKey = (await Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) ?? '';
  console.log('supabaseUrl', supabaseUrl);
  console.log('supabaseServiceRoleKey', supabaseServiceRoleKey);

  const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { user_id } = await req.json();

  console.log('user_id', user_id);

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.split(' ')[1]; // The token is after the 'Bearer' part

  const payload = decode(token);
  console.log(payload);
  console.log('decodedToken', payload);

  const role = payload[1]?.user_role;

  if (role !== 'admin') {
    return new Response(JSON.stringify({ error: 'You must be an admin to delete a user.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } else {
    const { data, error } = await supabaseClient.auth.admin.deleteUser(user_id);
    console.log('data', data);
    console.log('error', error);
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/deleteUser' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
