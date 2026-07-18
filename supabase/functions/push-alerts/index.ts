import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webpush from "https://esm.sh/web-push@3.6.7"

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse the Webhook payload
    const body = await req.json()
    console.log('[Webhook] Received payload:', JSON.stringify(body))

    const { type, table, record } = body

    if (type !== 'INSERT' || table !== 'mortality_records') {
      return new Response(JSON.stringify({ success: true, message: 'Ignored non-INSERT or non-mortality webhook' }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 200,
      })
    }

    const { batch_id, count, cause } = record
    if (!batch_id || !count) {
      return new Response(JSON.stringify({ success: false, error: 'Missing batch_id or count in mortality record' }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 400,
      })
    }

    // 1. Query Batch info
    const { data: batch, error: batchErr } = await supabase
      .from('batches')
      .select('name, initial_quantity, farm_id')
      .eq('id', batch_id)
      .single()

    if (batchErr || !batch) {
      throw new Error(`Failed to find batch: ${batchErr?.message || 'Not found'}`)
    }

    const initialQuantity = batch.initial_quantity || 1
    const mortalityRate = count / initialQuantity

    console.log(`[Alert] Batch: ${batch.name}, Count: ${count}, Initial: ${initialQuantity}, Rate: ${(mortalityRate * 100).toFixed(2)}%`)

    // Threshold check (2%)
    if (mortalityRate < 0.02) {
      return new Response(JSON.stringify({ success: true, message: `Mortality rate (${(mortalityRate * 100).toFixed(2)}%) is below the 2% alert threshold.` }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 200,
      })
    }

    // 2. Query Farm owner (user_id)
    const { data: farm, error: farmErr } = await supabase
      .from('farms')
      .select('user_id, name')
      .eq('id', batch.farm_id)
      .single()

    if (farmErr || !farm) {
      throw new Error(`Failed to find farm owner: ${farmErr?.message || 'Not found'}`)
    }

    // 3. Query Push Subscription for owner
    const { data: sub, error: subErr } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', farm.user_id)
      .single()

    if (subErr || !sub) {
      console.log(`[Alert] No push subscription found for user ${farm.user_id}`)
      return new Response(JSON.stringify({ success: true, message: 'Mortality spike detected, but no push subscription exists for user.' }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 200,
      })
    }

    // 4. Send Web Push using VAPID keys from env
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:support@lampfarms.com'

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('[Alert] VAPID keys not configured in environment variables. Skipping push.')
      return new Response(JSON.stringify({ success: false, error: 'VAPID keys not configured in server secrets' }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 500,
      })
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        auth: sub.auth,
        p256dh: sub.p256dh
      }
    }

    const payload = JSON.stringify({
      title: "Mortality Spike Alert! 🚨",
      body: `${count} deaths recorded in "${batch.name}" (${(mortalityRate * 100).toFixed(1)}% of batch). Cause: ${cause || 'Not specified'}.`,
      url: `/batches/${batch_id}`
    })

    await webpush.sendNotification(pushSubscription, payload)
    console.log('[Alert] Web push alert successfully sent to user:', farm.user_id)

    return new Response(JSON.stringify({ success: true, message: 'Mortality alert push sent successfully!' }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      status: 200,
    })

  } catch (error: any) {
    console.error('[Error] Push alerts failed:', error.message)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      status: 500,
    })
  }
})
