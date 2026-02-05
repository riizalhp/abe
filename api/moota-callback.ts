/**
 * Moota Webhook Handler - Vercel Serverless Function
 * Deploy via GitHub + Vercel Dashboard (NO CLI!)
 * 
 * Flow FULL OTOMATIS:
 * 1. Customer transfer
 * 2. Moota robot detect (15 min)
 * 3. Moota POST webhook ke URL ini
 * 4. Function ini auto-update database
 * 5. Customer auto-redirect
 * 
 * ZERO admin intervention needed!
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[Moota Webhook] Received request');
    
    // 1. Verify signature dari Moota
    const payload = JSON.stringify(req.body);
    const signature = req.headers['signature'] as string;
    const secretToken = process.env.MOOTA_SECRET_TOKEN;

    if (!signature || !secretToken) {
      console.error('[Moota Webhook] Missing signature or secret');
      return res.status(401).json({ error: 'Missing credentials' });
    }

    const hmac = crypto.createHmac('sha256', secretToken);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    if (signature !== expectedSignature) {
      console.error('[Moota Webhook] Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    console.log('[Moota Webhook] Signature verified');

    // 2. Initialize Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Moota Webhook] Missing Supabase credentials');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Process mutations
    const mutations = Array.isArray(req.body) ? req.body : [req.body];
    console.log(`[Moota Webhook] Processing ${mutations.length} mutations`);

    let processed = 0;
    let errors = 0;

    for (const mutation of mutations) {
      try {
        // Only process credit transactions (incoming money)
        if (mutation.type !== 'CR' && mutation.type !== 'in') {
          console.log(`[Moota Webhook] Skipping non-credit mutation: ${mutation.type}`);
          continue;
        }

        // Extract booking code from description
        const description = mutation.description || mutation.note || '';
        const bookingCodeMatch = description.match(/BK-\d+-[a-z0-9]+/i);

        if (!bookingCodeMatch) {
          console.log(`[Moota Webhook] No booking code found in: ${description}`);
          continue;
        }

        const bookingCode = bookingCodeMatch[0];
        const mutationAmount = parseFloat(mutation.amount);
        const mutationId = mutation.mutation_id || mutation.id;

        console.log(`[Moota Webhook] Found booking code: ${bookingCode}, amount: ${mutationAmount}`);

        // 4. Find matching payment order
        const { data: paymentOrders, error: fetchError } = await supabase
          .from('payment_orders')
          .select('*')
          .eq('order_id', bookingCode)
          .eq('status', 'CHECKING')
          .maybeSingle();

        if (fetchError) {
          console.error(`[Moota Webhook] Error fetching payment order:`, fetchError);
          errors++;
          continue;
        }

        if (!paymentOrders) {
          console.log(`[Moota Webhook] No pending payment found for: ${bookingCode}`);
          continue;
        }

        // 5. Verify amount matches (allow 1 rupiah difference for rounding)
        if (Math.abs(mutationAmount - paymentOrders.total_amount) > 1) {
          console.error(
            `[Moota Webhook] Amount mismatch for ${bookingCode}: ` +
            `expected ${paymentOrders.total_amount}, got ${mutationAmount}`
          );
          continue;
        }

        console.log(`[Moota Webhook] Amount verified for ${bookingCode}`);

        // 6. Update payment order to PAID
        const { error: updatePaymentError } = await supabase
          .from('payment_orders')
          .update({
            status: 'PAID',
            mutation_id: mutationId,
            paid_at: new Date().toISOString(),
          })
          .eq('id', paymentOrders.id);

        if (updatePaymentError) {
          console.error(`[Moota Webhook] Error updating payment:`, updatePaymentError);
          errors++;
          continue;
        }

        console.log(`[Moota Webhook] Payment ${bookingCode} marked as PAID`);

        // 7. Update booking to CONFIRMED
        const { error: updateBookingError } = await supabase
          .from('bookings')
          .update({ 
            status: 'CONFIRMED',
            updated_at: new Date().toISOString(),
          })
          .eq('booking_code', bookingCode);

        if (updateBookingError) {
          console.error(`[Moota Webhook] Error updating booking:`, updateBookingError);
          errors++;
          continue;
        }

        console.log(`[Moota Webhook] Booking ${bookingCode} confirmed! ✅`);
        processed++;

      } catch (mutationError) {
        console.error(`[Moota Webhook] Error processing mutation:`, mutationError);
        errors++;
      }
    }

    // 8. Return response
    console.log(`[Moota Webhook] Completed: ${processed} processed, ${errors} errors`);
    
    return res.status(200).json({
      success: true,
      processed,
      errors,
      message: `Processed ${processed} payments successfully`,
    });

  } catch (error) {
    console.error('[Moota Webhook] Fatal error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
