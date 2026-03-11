

import { serve } from "npm:@supabase/functions-js@2.1.0";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

serve(async (req) => {
  
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    
    const { action, userId, email } = await req.json();

    let result;
    
    if (action === "get_user") {
      
      if (userId) {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
        
        if (userError) {
          throw userError;
        }
        
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        result = {
          user: userData.user,
          profile: profileData,
          profileError: profileError ? profileError.message : null
        };
      } 
      
      else if (email) {
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers({
          filter: {
            email: email
          }
        });
        
        if (userError) {
          throw userError;
        }
        
        const user = userData.users[0];
        
        if (user) {
          
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          result = {
            user: user,
            profile: profileData,
            profileError: profileError ? profileError.message : null
          };
        } else {
          result = { error: "User not found" };
        }
      } else {
        result = { error: "Missing userId or email parameter" };
      }
    } else if (action === "list_profiles") {
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
        
      result = { profiles, error: error ? error.message : null };
    } else {
      result = { error: "Invalid action" };
    }

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});