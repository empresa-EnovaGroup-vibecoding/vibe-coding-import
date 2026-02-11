import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-04-10",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req: Request) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Verificar autenticacion
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const { tenant_id, plan_type, success_url, cancel_url } = await req.json();

    if (!tenant_id || !plan_type) {
      return new Response(JSON.stringify({ error: "tenant_id and plan_type required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Verificar que el usuario es owner del tenant
    const { data: member } = await supabase
      .from("tenant_members")
      .select("role")
      .eq("tenant_id", tenant_id)
      .eq("user_id", user.id)
      .single();

    if (!member || member.role !== "owner") {
      return new Response(JSON.stringify({ error: "Only tenant owners can subscribe" }), {
        status: 403,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Obtener o crear customer de Stripe
    const { data: tenant } = await supabase
      .from("tenants")
      .select("stripe_customer_id, name")
      .eq("id", tenant_id)
      .single();

    let customerId = tenant?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: tenant?.name,
        metadata: { tenant_id, user_id: user.id },
      });
      customerId = customer.id;

      await supabase
        .from("tenants")
        .update({ stripe_customer_id: customerId })
        .eq("id", tenant_id);
    }

    // Obtener el price_id segun el plan
    const priceId = plan_type === "annual"
      ? Deno.env.get("STRIPE_ANNUAL_PRICE_ID")!
      : Deno.env.get("STRIPE_MONTHLY_PRICE_ID")!;

    // Crear sesion de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: success_url || `${req.headers.get("origin")}/membership?success=true`,
      cancel_url: cancel_url || `${req.headers.get("origin")}/membership?cancelled=true`,
      metadata: { tenant_id },
      subscription_data: {
        metadata: { tenant_id },
        trial_period_days: undefined, // Ya tuvieron trial gratis
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    console.error("Checkout error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
