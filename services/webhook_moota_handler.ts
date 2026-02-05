/**
 * Moota Webhook Handler
 * 
 * Handle incoming webhook from Moota when new mutations are detected.
 * 
 * Setup di Moota:
 * 1. Go to app.moota.co → Bank Account Settings
 * 2. Set Webhook URL: https://yourdomain.com/api/webhook/moota
 * 3. Set Secret Token: (copy dari .env MOOTA_SECRET_TOKEN)
 * 4. Set Interval Robot: 15 menit sekali - 0 Poin
 * 
 * Flow:
 * 1. Customer transfer money
 * 2. Moota detect mutation setiap 15 menit
 * 3. Moota POST data ke webhook URL
 * 4. Sistem kita verify signature
 * 5. Auto-update payment_orders status ke PAID
 * 6. Customer polling detect PAID → auto-redirect
 */

import crypto from 'crypto';
import { supabase } from '../lib/supabase';

interface MootaMutation {
  mutation_id: string;
  reference: string;
  amount: number;
  description: string;
  type: 'in' | 'out';
  created_at: string;
  bank_id: string;
  account_id: string;
}

interface MootaWebhookPayload {
  bank_id: string;
  account_id: string;
  mutations: MootaMutation[];
  timestamp: string;
}

/**
 * Verify webhook signature from Moota
 * Uses HMAC-SHA256 with secret token
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secretToken: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secretToken)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}

/**
 * Extract booking code from payment reference
 * Expected format: "BK-XXXXX-XXXXX unique-code"
 */
function extractBookingCode(reference: string): string | null {
  // Match BK-timestamp-uuid pattern
  const match = reference.match(/^(BK-\d+-[a-z0-9]+)/i);
  return match ? match[1] : null;
}

/**
 * Find payment order by booking code and amount
 */
async function findPaymentOrder(
  bookingCode: string,
  amount: number,
  bankAccountId: string
) {
  try {
    const { data, error } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('order_id', bookingCode)
      .eq('total_amount', amount)
      .eq('bank_account_id', bankAccountId)
      .eq('status', 'CHECKING') // Only process CHECKING orders
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found, which is fine
      console.error('[Webhook] Error querying payment_orders:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[Webhook] Error in findPaymentOrder:', error);
    return null;
  }
}

/**
 * Update payment order status to PAID
 */
async function updatePaymentOrderToPaid(
  paymentOrderId: string,
  mutationId: string
) {
  try {
    const { data, error } = await supabase
      .from('payment_orders')
      .update({
        status: 'PAID',
        mutation_id: mutationId,
        paid_at: new Date().toISOString()
      })
      .eq('id', paymentOrderId)
      .select();

    if (error) {
      console.error('[Webhook] Error updating payment_orders:', error);
      return false;
    }

    console.log('[Webhook] Payment order updated to PAID:', paymentOrderId, data);

    // Also update corresponding booking to CONFIRMED
    if (data && data.length > 0) {
      const paymentOrder = data[0];
      await updateBookingToConfirmed(paymentOrder.order_id);
    }

    return true;
  } catch (error) {
    console.error('[Webhook] Error in updatePaymentOrderToPaid:', error);
    return false;
  }
}

/**
 * Update booking status to CONFIRMED
 */
async function updateBookingToConfirmed(bookingCode: string) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({
        status: 'CONFIRMED',
        updated_at: new Date().toISOString()
      })
      .eq('booking_code', bookingCode)
      .select();

    if (error) {
      console.error('[Webhook] Error updating booking:', error);
      return false;
    }

    console.log('[Webhook] Booking updated to CONFIRMED:', bookingCode);
    return true;
  } catch (error) {
    console.error('[Webhook] Error in updateBookingToConfirmed:', error);
    return false;
  }
}

/**
 * Main webhook handler
 * 
 * Usage in Express:
 * app.post('/api/webhook/moota', webhookHandler);
 */
export async function webhookHandler(
  req: any,
  res: any
) {
  try {
    const secretToken = process.env.MOOTA_SECRET_TOKEN;
    const signature = req.headers['x-moota-signature'];
    const rawBody = JSON.stringify(req.body);

    console.log('[Webhook] Received webhook from Moota');
    console.log('[Webhook] Signature:', signature);
    console.log('[Webhook] Secret token exists:', !!secretToken);

    // Verify signature
    if (!secretToken || !verifyWebhookSignature(rawBody, signature, secretToken)) {
      console.error('[Webhook] Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const payload: MootaWebhookPayload = req.body;

    console.log('[Webhook] Verified signature. Processing mutations...');
    console.log('[Webhook] Mutations count:', payload.mutations?.length || 0);

    if (!payload.mutations || payload.mutations.length === 0) {
      console.log('[Webhook] No mutations to process');
      return res.status(200).json({ success: true, processed: 0 });
    }

    let processed = 0;

    // Process each mutation
    for (const mutation of payload.mutations) {
      console.log('[Webhook] Processing mutation:', mutation.mutation_id);
      console.log('[Webhook] Reference:', mutation.reference);
      console.log('[Webhook] Amount:', mutation.amount);
      console.log('[Webhook] Type:', mutation.type);

      // Only process incoming transfers
      if (mutation.type !== 'in') {
        console.log('[Webhook] Skipping outgoing mutation');
        continue;
      }

      // Extract booking code from reference
      const bookingCode = extractBookingCode(mutation.reference);
      if (!bookingCode) {
        console.log('[Webhook] Could not extract booking code from reference');
        continue;
      }

      console.log('[Webhook] Extracted booking code:', bookingCode);

      // Find payment order
      const paymentOrder = await findPaymentOrder(
        bookingCode,
        mutation.amount,
        mutation.bank_id
      );

      if (!paymentOrder) {
        console.log('[Webhook] Payment order not found:', bookingCode, mutation.amount);
        continue;
      }

      console.log('[Webhook] Found payment order:', paymentOrder.id);

      // Update to PAID
      const updated = await updatePaymentOrderToPaid(
        paymentOrder.id,
        mutation.mutation_id
      );

      if (updated) {
        processed++;
      }
    }

    console.log('[Webhook] Processed mutations:', processed);
    return res.status(200).json({ 
      success: true, 
      processed,
      message: `Successfully processed ${processed} mutation(s)`
    });

  } catch (error) {
    console.error('[Webhook] Error in webhook handler:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Test webhook handler (for development)
 * 
 * Usage:
 * POST /api/webhook/moota/test
 * Body: {
 *   "bookingCode": "BK-1770272876477-dw3re8t6i",
 *   "amount": 10027
 * }
 */
export async function testWebhookHandler(
  req: any,
  res: any
) {
  try {
    const { bookingCode, amount } = req.body;

    if (!bookingCode || !amount) {
      return res.status(400).json({ error: 'Missing bookingCode or amount' });
    }

    console.log('[Webhook Test] Testing with:', { bookingCode, amount });

    const paymentOrder = await findPaymentOrder(bookingCode, amount, 'test');

    if (!paymentOrder) {
      return res.status(404).json({ 
        error: 'Payment order not found',
        searched: { bookingCode, amount }
      });
    }

    const updated = await updatePaymentOrderToPaid(
      paymentOrder.id,
      'test-mutation-' + Date.now()
    );

    if (updated) {
      return res.status(200).json({ 
        success: true, 
        message: 'Test webhook processed',
        paymentOrderId: paymentOrder.id
      });
    } else {
      return res.status(500).json({ error: 'Failed to update payment order' });
    }

  } catch (error) {
    console.error('[Webhook Test] Error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
