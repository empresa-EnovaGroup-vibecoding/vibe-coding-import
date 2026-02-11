import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-04-10",
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response("No signature", { status: 400 });
    }

    // Verificar firma del webhook (anti-spoofing)
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      // Pago exitoso - activar suscripcion
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const tenantId = session.metadata?.tenant_id;

        if (tenantId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          await supabase
            .from("tenants")
            .update({
              subscription_status: "active",
              stripe_subscription_id: subscription.id,
              plan_type: subscription.items.data[0]?.plan?.interval === "year" ? "annual" : "monthly",
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq("id", tenantId);

          console.log(`Tenant ${tenantId} activated via checkout`);
        }
        break;
      }

      // Renovacion exitosa
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const tenantId = subscription.metadata?.tenant_id;

          if (tenantId) {
            await supabase
              .from("tenants")
              .update({
                subscription_status: "active",
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              })
              .eq("id", tenantId);

            console.log(`Tenant ${tenantId} renewed`);
          }
        }
        break;
      }

      // Pago fallido
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const tenantId = subscription.metadata?.tenant_id;

          if (tenantId) {
            await supabase
              .from("tenants")
              .update({ subscription_status: "past_due" })
              .eq("id", tenantId);

            console.log(`Tenant ${tenantId} payment failed`);
          }
        }
        break;
      }

      // Suscripcion cancelada
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const tenantId = subscription.metadata?.tenant_id;

        if (tenantId) {
          await supabase
            .from("tenants")
            .update({
              subscription_status: "cancelled",
              stripe_subscription_id: null,
            })
            .eq("id", tenantId);

          console.log(`Tenant ${tenantId} cancelled`);
        }
        break;
      }

      // Suscripcion actualizada (cambio de plan, etc.)
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const tenantId = subscription.metadata?.tenant_id;

        if (tenantId) {
          const status = subscription.status === "active" ? "active"
            : subscription.status === "past_due" ? "past_due"
            : subscription.status === "canceled" ? "cancelled"
            : "active";

          await supabase
            .from("tenants")
            .update({
              subscription_status: status,
              plan_type: subscription.items.data[0]?.plan?.interval === "year" ? "annual" : "monthly",
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq("id", tenantId);

          console.log(`Tenant ${tenantId} subscription updated to ${status}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
