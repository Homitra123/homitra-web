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
    console.log(`[notification] booking_id=${booking_id} user_id=${user_id}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .maybeSingle();

    if (bookingError) console.error("[notification] booking fetch error:", bookingError);

    if (!booking) {
      console.error("[notification] booking not found for id:", booking_id);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user_id)
      .maybeSingle();

    if (profileError) console.error("[notification] profile fetch error:", profileError);

    const customerName = profile?.full_name || "Customer";
    const customerEmail = profile?.email || "";
    const customerPhone = profile?.phone ? normalizePhone(profile.phone) : null;
    const bookingDate = formatDate(booking.date);
    const timeSlot = booking.time_slot;
    const serviceName = booking.service_name;
    const price = booking.price;
    const address = booking.address || booking.location || "";
    const bookingRef = booking_id.slice(0, 8).toUpperCase();

    console.log(`[notification] customer=${customerName} email=${customerEmail} phone=${customerPhone}`);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FAST2SMS_API_KEY = Deno.env.get("FAST2SMS_API_KEY");
    const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "homitra.services@gmail.com";
    const ADMIN_PHONE = normalizePhone(Deno.env.get("ADMIN_PHONE") || "9008935455");

    console.log(`[notification] RESEND_API_KEY present=${!!RESEND_API_KEY} FAST2SMS_API_KEY present=${!!FAST2SMS_API_KEY}`);

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

      try {
        const adminEmailRes = await fetch("https://api.resend.com/emails", {
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
        });
        const adminEmailBody = await adminEmailRes.text();
        console.log(`[notification] admin email status=${adminEmailRes.status} body=${adminEmailBody}`);
      } catch (e) {
        console.error("[notification] admin email error:", e);
      }

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

        try {
          const customerEmailRes = await fetch("https://api.resend.com/emails", {
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
          });
          const customerEmailBody = await customerEmailRes.text();
          console.log(`[notification] customer email status=${customerEmailRes.status} body=${customerEmailBody}`);
        } catch (e) {
          console.error("[notification] customer email error:", e);
        }
      } else {
        console.warn("[notification] no customer email, skipping customer email");
      }
    } else {
      console.error("[notification] RESEND_API_KEY not set");
    }

    if (FAST2SMS_API_KEY) {
      const adminSms = `New Booking: ${serviceName} | Rs.${price} | ${bookingDate} ${timeSlot} | ${customerName} ${customerPhone || ""}`.slice(0, 160);

      try {
        const adminSmsRes = await fetch(
          `https://www.fast2sms.com/dev/bulkV2?authorization=${FAST2SMS_API_KEY}&route=q&numbers=${ADMIN_PHONE}&message=${encodeURIComponent(adminSms)}&flash=0`,
          { method: "GET" }
        );
        const adminSmsBody = await adminSmsRes.text();
        console.log(`[notification] admin SMS status=${adminSmsRes.status} body=${adminSmsBody}`);
      } catch (e) {
        console.error("[notification] admin SMS error:", e);
      }

      if (customerPhone && customerPhone.length === 10) {
        const firstName = customerName.split(" ")[0];
        const customerSms = `Hi ${firstName}, your ${serviceName} booking with Homitra is confirmed for ${bookingDate} at ${timeSlot}. Our team will contact you shortly. - Team Homitra`.slice(0, 160);

        try {
          const customerSmsRes = await fetch(
            `https://www.fast2sms.com/dev/bulkV2?authorization=${FAST2SMS_API_KEY}&route=q&numbers=${customerPhone}&message=${encodeURIComponent(customerSms)}&flash=0`,
            { method: "GET" }
          );
          const customerSmsBody = await customerSmsRes.text();
          console.log(`[notification] customer SMS status=${customerSmsRes.status} body=${customerSmsBody}`);
        } catch (e) {
          console.error("[notification] customer SMS error:", e);
        }
      } else {
        console.warn(`[notification] invalid/missing customer phone: ${customerPhone}, skipping SMS`);
      }
    } else {
      console.error("[notification] FAST2SMS_API_KEY not set");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[notification] unhandled error:", error);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
