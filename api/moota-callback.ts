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

// Disable body parsing untuk akses raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper untuk read raw body
async function getRawBody(req: VercelRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(data);
    });
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[Moota Webhook] Received request');

    // Whitelist IP Moota
    const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    const mootaIp = '103.236.201.178';

    console.log('[Moota Webhook] Client IP:', clientIp);

    // Optional: Uncomment untuk enforce IP whitelist
    // if (clientIp !== mootaIp) {
    //   console.error('[Moota Webhook] Unauthorized IP:', clientIp);
    //   return res.status(403).json({ error: 'Forbidden: Invalid IP address' });
    // }

    // Get raw body untuk signature verification
    const rawBody = await getRawBody(req);
    const body = JSON.parse(rawBody);

    console.log('[Moota Webhook] Headers:', JSON.stringify(req.headers));
    console.log('[Moota Webhook] Raw body length:', rawBody.length);

    // 1. Verify signature dari Moota
    // Moota kirim header "Signature" (kapital S)
    const signature = req.headers['signature'] as string || req.headers['Signature'] as string;
    const secretToken = process.env.MOOTA_SECRET_TOKEN;

    console.log('[Moota Webhook] Signature from header:', signature);
    console.log('[Moota Webhook] Secret token exists:', !!secretToken);

    if (!signature || !secretToken) {
      console.error('[Moota Webhook] Missing signature or secret');
      return res.status(401).json({ error: 'Missing credentials' });
    }

    // Calculate expected signature dari raw body
    const hmac = crypto.createHmac('sha256', secretToken);
    hmac.update(rawBody); // Use raw body, bukan JSON.stringify(body)
    const expectedSignature = hmac.digest('hex');

    console.log('[Moota Webhook] Expected signature:', expectedSignature);
    console.log('[Moota Webhook] Received signature:', signature);

    if (signature !== expectedSignature) {
      console.error('[Moota Webhook] Invalid signature');
      return res.status(401).json({
        error: 'Invalid signature',
        expected: expectedSignature,
        received: signature
      });
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
    const mutations = Array.isArray(body) ? body : [body];
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

        const mutationAmount = parseFloat(mutation.amount);
        const mutationId = mutation.mutation_id || mutation.id;

        // Match strategy:
        // 1. Try to find booking code in description
        // 2. If not found, try to match by exact amount (Unique Code)

        let paymentOrder;

        if (bookingCodeMatch) {
          const bookingCode = bookingCodeMatch[0];
          console.log(`[Moota Webhook] Found booking code in description: ${bookingCode}`);

          const { data, error } = await supabase
            .from('payment_orders')
            .select('*')
            .eq('order_id', bookingCode)
            .in('status', ['PENDING', 'CHECKING']) // Allow PENDING too (Moota might be faster than user clicking 'Check')
            .maybeSingle();

          if (error) console.error(`[Moota Webhook] Error fetching by code:`, error);
          paymentOrder = data;

        } else {
          // Fallback: Match by Amount (Unique Code)
          console.log(`[Moota Webhook] No booking code in description, trying match by Amount: ${mutationAmount}`);

          const { data, error } = await supabase
            .from('payment_orders')
            .select('*')
            .eq('total_amount', mutationAmount)
            .in('status', ['PENDING', 'CHECKING'])
            .order('created_at', { ascending: false }) // Prefer latest if multiple (though unique code should prevent this)
            .limit(1)
            .maybeSingle();

          if (error) console.error(`[Moota Webhook] Error fetching by amount:`, error);
          paymentOrder = data;
        }

        if (!paymentOrder) {
          console.log(`[Moota Webhook] No matching pending order found for mount: ${mutationAmount}`);
          continue;
        }

        const bookingCode = paymentOrder.order_id; // Get code from found order
        console.log(`[Moota Webhook] Matched Payment Order: ${bookingCode}, expected: ${paymentOrder.total_amount}, got: ${mutationAmount}`);

        // 5. Verify amount matches (allow 1 rupiah difference for rounding)
        if (Math.abs(mutationAmount - paymentOrder.total_amount) > 1) {
          console.error(
            `[Moota Webhook] Amount mismatch for ${bookingCode}: ` +
            `expected ${paymentOrder.total_amount}, got ${mutationAmount}`
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
          .eq('id', paymentOrder.id);

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
