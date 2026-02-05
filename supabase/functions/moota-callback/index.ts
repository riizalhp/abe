/**
 * Moota Webhook Callback Handler - Supabase Edge Function
 * 
 * Endpoint: https://YOUR_PROJECT.supabase.co/functions/v1/moota-callback
 * 
 * Setup di Moota Dashboard:
 * 1. Go to app.moota.co → Settings → Webhook
 * 2. Webhook URL: https://YOUR_PROJECT.supabase.co/functions/v1/moota-callback
 * 3. Secret Token: (set di Supabase Secrets MOOTA_SECRET_TOKEN)
 * 4. Enable Robot: 15 menit (0 Poin)
 * 
 * Flow:
 * 1. Customer transfer uang
 * 2. Moota detect mutation (15 min)
 * 3. POST ke edge function ini
 * 4. Verify signature
 * 5. Update payment_orders → PAID
 * 6. Update bookings → CONFIRMED
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("🚀 Moota Callback Function Up!");

// Verify HMAC-SHA256 signature
async function verifySignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );

  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return signature === expectedSignature;
}

// Extract booking code from payment reference
function extractBookingCode(reference: string): string | null {
  // Match BK-timestamp-uuid pattern
  const match = reference.match(/^(BK-\d+-[a-z0-9]+)/i);
  return match ? match[1] : null;
}

serve(async (req) => {
  try {
    console.log("[Webhook] Received request from Moota");

    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const secretToken = Deno.env.get("MOOTA_SECRET_TOKEN");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[Webhook] Missing Supabase credentials");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body
    const rawBody = await req.text();
    const signature = req.headers.get("x-moota-signature") || "";

    console.log("[Webhook] Signature received:", signature);
    console.log("[Webhook] Secret token exists:", !!secretToken);

    // Verify signature if secret token is set
    if (secretToken) {
      const isValid = await verifySignature(rawBody, signature, secretToken);
      if (!isValid) {
        console.error("[Webhook] Invalid signature");
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      console.log("[Webhook] Signature verified ✓");
    }

    // Parse body
    const body = JSON.parse(rawBody);
    console.log("[Webhook] Payload:", JSON.stringify(body, null, 2));

    // Moota sends mutations array
    const mutations = Array.isArray(body)
      ? body
      : body.mutations || [body];

    console.log("[Webhook] Processing mutations:", mutations.length);

    let processed = 0;

    // Process each mutation
    for (const mutation of mutations) {
      console.log("[Webhook] Processing mutation:", mutation.mutation_id);
      console.log("[Webhook] Type:", mutation.type);
      console.log("[Webhook] Amount:", mutation.amount);
      console.log("[Webhook] Description:", mutation.description);

      // Only process incoming transfers
      if (mutation.type !== "CR" && mutation.type !== "in") {
        console.log("[Webhook] Skipping non-credit mutation");
        continue;
      }

      // Extract booking code from description/reference
      const bookingCode = extractBookingCode(
        mutation.description || mutation.reference || ""
      );

      if (!bookingCode) {
        console.log("[Webhook] Could not extract booking code");
        continue;
      }

      console.log("[Webhook] Extracted booking code:", bookingCode);

      // Find payment order by booking code and amount
      const { data: paymentOrders, error: findError } = await supabase
        .from("payment_orders")
        .select("*")
        .eq("order_id", bookingCode)
        .eq("total_amount", mutation.amount)
        .eq("status", "CHECKING")
        .limit(1);

      if (findError) {
        console.error("[Webhook] Error finding payment order:", findError);
        continue;
      }

      if (!paymentOrders || paymentOrders.length === 0) {
        console.log("[Webhook] Payment order not found:", bookingCode, mutation.amount);
        continue;
      }

      const paymentOrder = paymentOrders[0];
      console.log("[Webhook] Found payment order:", paymentOrder.id);

      // Update payment order to PAID
      const { error: updateError } = await supabase
        .from("payment_orders")
        .update({
          status: "PAID",
          mutation_id: mutation.mutation_id || mutation.id,
          paid_at: new Date().toISOString(),
        })
        .eq("id", paymentOrder.id);

      if (updateError) {
        console.error("[Webhook] Error updating payment order:", updateError);
        continue;
      }

      console.log("[Webhook] ✓ Payment order updated to PAID:", paymentOrder.id);

      // Update booking status to CONFIRMED
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({
          status: "CONFIRMED",
          updated_at: new Date().toISOString(),
        })
        .eq("booking_code", bookingCode);

      if (bookingError) {
        console.warn("[Webhook] Could not update booking:", bookingError);
      } else {
        console.log("[Webhook] ✓ Booking updated to CONFIRMED:", bookingCode);
      }

      processed++;
    }

    console.log("[Webhook] ✓ Processed mutations:", processed);

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        message: `Successfully processed ${processed} mutation(s)`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Webhook] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
