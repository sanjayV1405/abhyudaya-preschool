// Supabase Edge Function – sends enquiry email via Resend
// Deploy: supabase functions deploy send-enquiry-email --no-verify-jwt
// Set secret: supabase secrets set RESEND_API_KEY=re_xxxxx

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const SCHOOL_EMAIL = 'daycare@abhyudaya-school.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { parent_name, phone, child_name, child_age, message, enquiry_type } = await req.json()

    if (!parent_name || !phone) {
      return new Response(
        JSON.stringify({ error: 'Name and phone are required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emailSubject = enquiry_type === 'campus_visit'
      ? `🏡 New Campus Visit Request – ${parent_name}`
      : `📩 New Admission Enquiry – ${parent_name}`

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fdfaff; border: 1px solid #e0d0f8; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #5a3a8a, #7b52b0); padding: 24px 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px;">
            ${enquiry_type === 'campus_visit' ? '🏡 Campus Visit Request' : '📩 New Admission Enquiry'}
          </h1>
          <p style="color: #e0d0f8; margin: 8px 0 0; font-size: 13px;">Abhyudaya Preschool – Website Enquiry</p>
        </div>
        <div style="padding: 28px 32px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 10px 12px; font-weight: bold; color: #5a3a8a; width: 140px; vertical-align: top;">Parent Name</td>
              <td style="padding: 10px 12px; color: #3d2a50;">${parent_name}</td>
            </tr>
            <tr style="background: #f5efff;">
              <td style="padding: 10px 12px; font-weight: bold; color: #5a3a8a; vertical-align: top;">Phone</td>
              <td style="padding: 10px 12px; color: #3d2a50;">
                <a href="tel:${phone}" style="color: #5a3a8a; text-decoration: none; font-weight: bold;">${phone}</a>
              </td>
            </tr>
            ${child_name ? `
            <tr>
              <td style="padding: 10px 12px; font-weight: bold; color: #5a3a8a; vertical-align: top;">Child's Name</td>
              <td style="padding: 10px 12px; color: #3d2a50;">${child_name}</td>
            </tr>` : ''}
            ${child_age ? `
            <tr style="background: #f5efff;">
              <td style="padding: 10px 12px; font-weight: bold; color: #5a3a8a; vertical-align: top;">Program / Age</td>
              <td style="padding: 10px 12px; color: #3d2a50;">${child_age}</td>
            </tr>` : ''}
            ${message ? `
            <tr>
              <td style="padding: 10px 12px; font-weight: bold; color: #5a3a8a; vertical-align: top;">Message</td>
              <td style="padding: 10px 12px; color: #3d2a50; line-height: 1.5;">${message}</td>
            </tr>` : ''}
          </table>
          <div style="margin-top: 24px; padding: 16px; background: #b8f0d8; border-radius: 12px; text-align: center; font-size: 13px; color: #1a6a45;">
            <strong>💡 Quick Action:</strong> 
            <a href="https://wa.me/${phone.replace(/[^0-9]/g, '')}" style="color: #1a6a45; font-weight: bold;">Reply via WhatsApp</a> · 
            <a href="tel:${phone}" style="color: #1a6a45; font-weight: bold;">Call Now</a>
          </div>
        </div>
        <div style="background: #f5efff; padding: 16px 32px; text-align: center; font-size: 11px; color: #8a7a9a;">
          Sent from Abhyudaya Preschool website · ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
        </div>
      </div>
    `

    // Send email via Resend API
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Abhyudaya Preschool <onboarding@resend.dev>',
        to: [SCHOOL_EMAIL],
        subject: emailSubject,
        html: emailHtml,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Resend error:', data)
      return new Response(
        JSON.stringify({ error: 'Email sending failed', details: data }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

