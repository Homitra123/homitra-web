import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function normalizePhone(phone: string): string {
  let normalized = phone.replace(/\D/g, "");
  if (normalized.startsWith("91") && normalized.length === 12) {
    normalized = normalized.slice(2);
  }
  return normalized.slice(-10);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { booking_id, user_id } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: booking } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .maybeSingle();

    if (!booking) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user_id)
      .maybeSingle();

    const customerName = profile?.full_name || "Customer";
    const customerEmail = profile?.email || "";
    const customerPhone = profile?.phone ? normalizePhone(profile.phone) : null;
    const bookingDate = formatDate(booking.date);
    const timeSlot = booking.time_slot;
    const serviceName = booking.service_name;
    const price = booking.price;
    const address = booking.address || booking.location || "";
    const bookingRef = booking_id.slice(0, 8).toUpperCase();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FAST2SMS_API_KEY = Deno.env.get("FAST2SMS_API_KEY");
    const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "homitra.services@gmail.com";
    const ADMIN_PHONE = normalizePhone(Deno.env.get("ADMIN_PHONE") || "9008935455");

    const tableRowStyle = `style="border-bottom:1px solid #e5e7eb"`;
    const altRowStyle = `style="border-bottom:1px solid #e5e7eb;background:#f9fafb"`;
    const labelStyle = `style="padding:10px 14px;color:#6b7280;width:42%;font-size:14px"`;
    const valueStyle = `style="padding:10px 14px;font-weight:600;font-size:14px;color:#111827"`;

    if (RESEND_API_KEY) {
      const adminEmailHtml = `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#ffffff">
          <div style="background:#1e40af;padding:24px 28px">
            <h1 style="color:#ffffff;margin:0;font-size:20px">New Booking Received</h1>
            <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px">Booking Ref: #${bookingRef}</p>
          </div>
          <div style="padding:24px 28px">
            <p style="color:#374151;margin:0 0 16px;font-size:14px">You have received a new booking on Homitra.</p>
            <table style="border-collapse:collapse;width:100%">
              <tr ${tableRowStyle}><td ${labelStyle}>Service</td><td ${valueStyle}>${serviceName}</td></tr>
              <tr ${altRowStyle}><td ${labelStyle}>Amount</td><td ${valueStyle}>Rs. ${price}</td></tr>
              <tr ${tableRowStyle}><td ${labelStyle}>Date</td><td ${valueStyle}>${bookingDate}</td></tr>
              <tr ${altRowStyle}><td ${labelStyle}>Time Slot</td><td ${valueStyle}>${timeSlot}</td></tr>
              <tr ${tableRowStyle}><td ${labelStyle}>Address</td><td ${valueStyle}>${address}</td></tr>
              <tr style="border-bottom:1px solid #e5e7eb;background:#f9fafb"><td colspan="2" style="padding:8px 14px;font-size:12px;color:#9ca3af;font-weight:600;letter-spacing:0.05em">CUSTOMER DETAILS</td></tr>
              <tr ${tableRowStyle}><td ${labelStyle}>Name</td><td ${valueStyle}>${customerName}</td></tr>
              <tr ${altRowStyle}><td ${labelStyle}>Phone</td><td ${valueStyle}>${customerPhone || "N/A"}</td></tr>
              <tr ${tableRowStyle}><td ${labelStyle}>Email</td><td ${valueStyle}>${customerEmail}</td></tr>
            </table>
            <p style="margin:20px 0 0;color:#6b7280;font-size:13px">Login to your dashboard to assign a partner.</p>
          </div>
        </div>
      `;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Homitra Bookings <bookings@homitra.co.in>",
          to: [ADMIN_EMAIL],
          subject: `New Booking Received - ${serviceName} | #${bookingRef}`,
          html: adminEmailHtml,
        }),
      }).catch(console.error);

      if (customerEmail) {
        const customerEmailHtml = `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#ffffff">
            <div style="background:#1e40af;padding:24px 28px">
              <h1 style="color:#ffffff;margin:0;font-size:20px">Booking Confirmed!</h1>
              <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px">Ref: #${bookingRef}</p>
            </div>
            <div style="padding:24px 28px">
              <p style="color:#374151;margin:0 0 16px;font-size:14px">Hi ${customerName}, your booking with Homitra is confirmed.</p>
              <table style="border-collapse:collapse;width:100%">
                <tr ${tableRowStyle}><td ${labelStyle}>Service</td><td ${valueStyle}>${serviceName}</td></tr>
                <tr ${altRowStyle}><td ${labelStyle}>Amount</td><td ${valueStyle}>Rs. ${price}</td></tr>
                <tr ${tableRowStyle}><td ${labelStyle}>Date</td><td ${valueStyle}>${bookingDate}</td></tr>
                <tr ${altRowStyle}><td ${labelStyle}>Time Slot</td><td ${valueStyle}>${timeSlot}</td></tr>
                <tr ${tableRowStyle}><td ${labelStyle}>Address</td><td ${valueStyle}>${address}</td></tr>
              </table>
              <p style="margin:20px 0 8px;color:#374151;font-size:14px">Our team will contact you shortly to confirm the details.</p>
              <p style="margin:0;color:#6b7280;font-size:13px">Thank you for choosing Homitra!</p>
            </div>
          </div>
        `;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Homitra Bookings <bookings@homitra.co.in>",
            to: [customerEmail],
            subject: `Booking Confirmed - ${serviceName}`,
            html: customerEmailHtml,
          }),
        }).catch(console.error);
      }
    }

    if (FAST2SMS_API_KEY) {
      const adminSms = `New Booking: ${serviceName} | Rs.${price} | ${bookingDate} ${timeSlot} | ${customerName} ${customerPhone || ""}`.slice(0, 160);

      await fetch(
        `https://www.fast2sms.com/dev/bulkV2?authorization=${FAST2SMS_API_KEY}&route=q&numbers=${ADMIN_PHONE}&message=${encodeURIComponent(adminSms)}&flash=0`,
        { method: "GET" }
      ).catch(console.error);

      if (customerPhone && customerPhone.length === 10) {
        const firstName = customerName.split(" ")[0];
        const customerSms = `Hi ${firstName}, your ${serviceName} booking with Homitra is confirmed for ${bookingDate} at ${timeSlot}. Our team will contact you shortly. - Team Homitra`.slice(0, 160);

        await fetch(
          `https://www.fast2sms.com/dev/bulkV2?authorization=${FAST2SMS_API_KEY}&route=q&numbers=${customerPhone}&message=${encodeURIComponent(customerSms)}&flash=0`,
          { method: "GET" }
        ).catch(console.error);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Notification error:", error);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
