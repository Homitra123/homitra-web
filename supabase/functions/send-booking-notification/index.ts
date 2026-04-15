import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

async function dbQuery(url: string, key: string, table: string, filter: string) {
  const res = await fetch(`${url}/rest/v1/${table}?${filter}&limit=1`, {
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
  });
  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

function buildCustomizationRows(details: Record<string, unknown>, tr: string, trAlt: string, td1: string, td2: string): string {
  if (!details || typeof details !== "object") return "";

  const rows: string[] = [];
  const plan = details.plan as string;

  const row = (label: string, value: unknown, alt: boolean) => {
    if (!value && value !== 0) return "";
    return `<tr ${alt ? trAlt : tr}><td ${td1}>${label}</td><td ${td2}>${value}</td></tr>`;
  };

  const people = details.people as number;
  if (people) rows.push(row("No. of People", people, false));

  if (plan === "veg") {
    rows.push(row("Roti Type", details.rotiType, true));
    rows.push(row("Vegetable Dish", details.vegetable, false));
    if (details.addExtraVeg) rows.push(row("Extra Veg Dish", details.addExtraVeg, true));
    if ((details.extraRotisCount as number) > 0) rows.push(row("Extra Rotis", details.extraRotisCount, false));
    if (details.specialRequest) rows.push(row("Special Request", details.specialRequest, true));
  }

  if (plan === "nonveg") {
    rows.push(row("Roti Type", details.rotiType, true));
    rows.push(row("Non-Veg Dish", details.nonVegItem, false));
    if (details.addExtraNonVeg) rows.push(row("Extra Non-Veg Dish", details.addExtraNonVeg, true));
    if (details.addDal) rows.push(row("Dal Add-On", details.addDal, false));
    if ((details.extraRotisCount as number) > 0) rows.push(row("Extra Rotis", details.extraRotisCount, true));
    if (details.specialRequest) rows.push(row("Special Request", details.specialRequest, false));
  }

  if (plan === "bites") {
    const dishType = details.dishType as string;
    if (dishType === "custom") {
      rows.push(row("Custom Dish", details.customDish, true));
    } else if (dishType === "curated") {
      rows.push(row("Curated Dish", details.selectedCuratedDish, true));
    } else if (dishType === "streetfood") {
      rows.push(row("Street Food", details.selectedStreetFood, true));
    }
    const extras = [...(details.extraCuratedItems as string[] || []), ...(details.extraStreetFoodItems as string[] || [])];
    if (extras.length > 0) rows.push(row("Extra Items", extras.join(", "), false));
    rows.push(row("Beverage", details.beverage, true));
  }

  if (plan === "monthly") {
    const freqMap: Record<string, string> = {
      "1meal": "1 Meal / Day",
      "2meals": "2 Meals / Day",
      "breakfast2meals": "Breakfast + 2 Meals",
    };
    rows.push(row("Meal Frequency", freqMap[details.mealFrequency as string] || details.mealFrequency, true));
    rows.push(row("Months Subscribed", details.upfrontMonths, false));
    if (details.addNonVeg) rows.push(row("Non-Veg Add-On", details.nonVegFrequency || "Yes", true));
  }

  const filtered = rows.filter(Boolean);
  if (filtered.length === 0) return "";

  return `
    <p style="color:#111827;font-weight:600;font-size:13px;margin:20px 0 4px;letter-spacing:0.04em">Meal Customisation</p>
    <div style="border-top:2px solid #1e40af;margin-bottom:0"></div>
    <table style="border-collapse:collapse;width:100%;margin-bottom:20px">
      ${filtered.join("\n")}
    </table>
  `;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { booking_id, user_id } = await req.json();
    console.log(`[notification] booking_id=${booking_id} user_id=${user_id}`);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const booking = await dbQuery(SUPABASE_URL, SERVICE_KEY, "bookings", `id=eq.${booking_id}`);
    if (!booking) {
      console.error("[notification] booking not found for id:", booking_id);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profile = await dbQuery(SUPABASE_URL, SERVICE_KEY, "profiles", `id=eq.${user_id}`);

    const customerName = profile?.full_name || "Customer";
    const customerEmail = profile?.email || "";
    const customerPhone = profile?.phone ? normalizePhone(profile.phone) : null;
    const bookingDate = formatDate(booking.date);
    const timeSlot = booking.time_slot;
    const serviceName = booking.service_name;
    const price = booking.price;
    const address = booking.address || booking.location || "";
    const bookingRef = booking_id.slice(0, 8).toUpperCase();
    const customizationDetails = booking.customization_details || null;

    console.log(`[notification] customer=${customerName} email=${customerEmail} phone=${customerPhone}`);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FAST2SMS_API_KEY = Deno.env.get("FAST2SMS_API_KEY");
    const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "homitra.services@gmail.com";
    const ADMIN_PHONE = normalizePhone(Deno.env.get("ADMIN_PHONE") || "9008935455");

    console.log(`[notification] RESEND_API_KEY present=${!!RESEND_API_KEY} FAST2SMS_API_KEY present=${!!FAST2SMS_API_KEY}`);

    if (RESEND_API_KEY) {
      const tr = `style="border-bottom:1px solid #e5e7eb"`;
      const trAlt = `style="border-bottom:1px solid #e5e7eb;background:#f9fafb"`;
      const td1 = `style="padding:10px 14px;color:#6b7280;width:42%;font-size:14px"`;
      const td2 = `style="padding:10px 14px;font-weight:600;font-size:14px;color:#111827"`;

      const customizationHtml = customizationDetails
        ? buildCustomizationRows(customizationDetails, tr, trAlt, td1, td2)
        : "";

      const adminHtml = `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#ffffff">
        <div style="background:#1e40af;padding:24px 28px">
          <h1 style="color:#ffffff;margin:0;font-size:20px">New Booking Received</h1>
          <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px">Booking Ref: #${bookingRef}</p>
        </div>
        <div style="padding:24px 28px">
          <p style="color:#374151;margin:0 0 20px;font-size:14px">You have received a new booking on Homitra.</p>
          <p style="color:#111827;font-weight:600;font-size:13px;margin:0 0 4px;letter-spacing:0.04em">Booking Summary</p>
          <div style="border-top:2px solid #1e40af;margin-bottom:0"></div>
          <table style="border-collapse:collapse;width:100%;margin-bottom:20px">
            <tr ${tr}><td ${td1}>Service</td><td ${td2}>${serviceName}</td></tr>
            <tr ${trAlt}><td ${td1}>Amount</td><td ${td2}>Rs. ${price}</td></tr>
            <tr ${tr}><td ${td1}>Date</td><td ${td2}>${bookingDate}</td></tr>
            <tr ${trAlt}><td ${td1}>Time Slot</td><td ${td2}>${timeSlot}</td></tr>
            <tr ${tr}><td ${td1}>Address</td><td ${td2}>${address}</td></tr>
          </table>
          ${customizationHtml}
          <p style="color:#111827;font-weight:600;font-size:13px;margin:0 0 4px;letter-spacing:0.04em">Customer Details</p>
          <div style="border-top:2px solid #1e40af;margin-bottom:0"></div>
          <table style="border-collapse:collapse;width:100%;margin-bottom:20px">
            <tr ${tr}><td ${td1}>Name</td><td ${td2}>${customerName}</td></tr>
            <tr ${trAlt}><td ${td1}>Phone</td><td ${td2}>${customerPhone || "N/A"}</td></tr>
            <tr ${tr}><td ${td1}>Email</td><td ${td2}>${customerEmail || "N/A"}</td></tr>
          </table>
          <p style="margin:0;color:#6b7280;font-size:13px">Login to your dashboard to assign a partner.</p>
        </div>
      </div>`;

      try {
        const adminEmailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Homitra Bookings <bookings@homitra.co.in>",
            to: [ADMIN_EMAIL],
            subject: `New Booking Received - ${serviceName} | #${bookingRef}`,
            html: adminHtml,
          }),
        });
        const adminEmailBody = await adminEmailRes.text();
        console.log(`[notification] admin email status=${adminEmailRes.status} body=${adminEmailBody}`);
      } catch (e) {
        console.error("[notification] admin email error:", e);
      }
    } else {
      console.error("[notification] RESEND_API_KEY not set");
    }

    if (FAST2SMS_API_KEY) {
      if (customerPhone && customerPhone.length === 10) {
        const firstName = customerName.split(" ")[0];
        const customerSms = `Hi ${firstName}, your ${serviceName} booking with Homitra is received for ${bookingDate} at ${timeSlot}. Our team will confirm your booking shortly.`.slice(0, 160);

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
        console.warn(`[notification] invalid/missing customer phone: ${customerPhone}, skipping customer SMS`);
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
