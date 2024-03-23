// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

/* Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  const { name } = await req.json();
  const data = {
    message: `Hello ${name}!`,
  };

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}); */

/* import { createClient } from '@supabase/supabase-js'; */

/* const supabaseUrl = 'your-supabase-url';
const supabaseServiceRoleKey = 'your-supabase-service-role-key';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey); */

/* Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { email, password, name } = await req.json();
  console.log(email, password, name);

  // Get the Authorization header
  var jwt = require('jsonwebtoken');
  const authHeader = req.headers.get('Authorization');
  console.log(authHeader);
  // Check if the Authorization header is present
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Extract the JWT token
  const token = authHeader.substring('Bearer '.length);
  console.log(token);

  // Get the JWT secret
  const jwtSecret = Deno.env.get('JWT_SECRET');
  console.log(jwtSecret);

  var decoded = jwt.verify(token, jwtSecret);
  console.log(decoded) // bar

  // If the token is valid, decode it
  if (decoded) {
    const [header, payload, signature] = decode(token);
    // Now you can use the header, payload, and signature
    console.log(header, payload, signature);
  } else {
    return new Response(JSON.stringify({ error: 'Invalid token.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Check if the user is an admin
  if (decoded.user_role !== 'admin') {
    return new Response(JSON.stringify({ error: 'You must be an admin to create a user.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } else {
    return new Response(JSON.stringify({ error: 'You can create a new account.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } */

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

  const { email, password, name, surname, organization_ids,  } = await req.json();
  console.log(email, password, name, surname, organization_ids);

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.split(' ')[1]; // The token is after the 'Bearer' part

  const payload = decode(token);
  console.log(payload);
  console.log('decodedToken', payload);

  const role = payload[1]?.user_role;

  if (role !== 'admin') {
    return new Response(JSON.stringify({ error: 'You must be an admin to create a user.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } else {
    const { data, error } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, surname, email, role, organization_ids },
      email_confirm: true, // Confirm the user's email address
    });

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/* const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { name },
    email_confirm: true, // Confirm the user's email address
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  }); */
