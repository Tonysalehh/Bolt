import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { task_id, user_id, type } = await req.json();

    // Get task and user details
    const { data: task } = await supabase
      .from("tasks")
      .select("*, profiles(email)")
      .eq("id", task_id)
      .single();

    const { data: user } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user_id)
      .single();

    if (!task || !user) {
      return new Response(
        JSON.stringify({ error: "Task or user not found" }),
        { 
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Create notification record
    await supabase.from("task_notifications").insert({
      task_id,
      user_id,
      type,
      message: `Reminder for task: ${task.title}`,
    });

    // Send email using your preferred email service
    // For this example, we'll just log it
    console.log(`Email sent to ${user.email} about task ${task.title}`);

    return new Response(
      JSON.stringify({ message: "Notification sent successfully" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});