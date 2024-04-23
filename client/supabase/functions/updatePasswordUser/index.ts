import { decode } from 'https://deno.land/x/djwt/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = (await Deno.env.get('SUPABASE_URL')) ?? '';
  const supabaseServiceRoleKey = (await Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) ?? '';

  const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { user_id, password } = await req.json();

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.split(' ')[1]; // The token is after the 'Bearer' part

  const payload = decode(token);

  const role = payload[1]?.user_role;

  if (role !== 'admin') {
    return new Response(
      JSON.stringify({ error: 'You must be an admin to update a user password.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } else {
    console.log('updating user password', user_id, password);
    const { data, error } = await supabaseClient.auth.admin.updateUserById(user_id, {
      password: password,
    });
    console.log('data', data);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
});
