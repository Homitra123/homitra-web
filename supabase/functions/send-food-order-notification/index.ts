import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

async function dbQueryMany(url: string, key: string, table: string, filter: string) {
  const res = await fetch(`${url}/rest/v1/${table}?${filter}`, {
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
  });
  const rows = await res.json();
  return Array.isArray(rows) ? rows : [];
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { order_id, user_id } = await req.json();
    console.log(`[food-notification] order_id=${order_id} user_id=${user_id}`);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "homitra.services@gmail.com";

    if (!RESEND_API_KEY) {
      console.error("[food-notification] RESEND_API_KEY not set");
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const order = await dbQuery(SUPABASE_URL, SERVICE_KEY, "food_orders", `id=eq.${order_id}`);
    if (!order) {
      console.error("[food-notification] order not found:", order_id);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profile = await dbQuery(SUPABASE_URL, SERVICE_KEY, "profiles", `id=eq.${user_id}`);
    const orderItems = await dbQueryMany(SUPABASE_URL, SERVICE_KEY, "food_order_items", `order_id=eq.${order_id}`);

    const customerName = profile?.full_name || "Customer";
    const customerEmail = profile?.email || "";
    const customerPhone = profile?.phone || "N/A";
    const orderRef = order_id.slice(0, 8).toUpperCase();
    const orderTime = formatDateTime(order.created_at);

    const tr = `style="border-bottom:1px solid #e5e7eb"`;
    const trAlt = `style="border-bottom:1px solid #e5e7eb;background:#f9fafb"`;
    const td1 = `style="padding:10px 14px;color:#6b7280;width:42%;font-size:14px"`;
    const td2 = `style="padding:10px 14px;font-weight:600;font-size:14px;color:#111827"`;

    const itemRows = orderItems.map((it: any, i: number) => {
      const alt = i % 2 === 1;
      const dot = it.is_veg
        ? `<span style="display:inline-block;width:8px;height:8px;background:#16a34a;border-radius:50%;margin-right:6px;vertical-align:middle"></span>`
        : `<span style="display:inline-block;width:8px;height:8px;background:#dc2626;border-radius:50%;margin-right:6px;vertical-align:middle"></span>`;
      return `<tr ${alt ? trAlt : tr}><td ${td1}>${dot}${it.item_name} ×${it.quantity}</td><td ${td2}>Rs. ${it.total_price}</td></tr>`;
    }).join("\n");

    const adminHtml = `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#ffffff">
      <div style="background:#1e40af;padding:24px 28px">
        <h1 style="color:#ffffff;margin:0;font-size:20px">New Food Order Received</h1>
        <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px">Order Ref: #${orderRef} &nbsp;·&nbsp; ${orderTime}</p>
      </div>
      <div style="padding:24px 28px">
        <p style="color:#374151;margin:0 0 20px;font-size:14px">A new food order has been placed on Homitra Kitchen.</p>

        <p style="color:#111827;font-weight:600;font-size:13px;margin:0 0 4px;letter-spacing:0.04em">Order Items</p>
        <div style="border-top:2px solid #1e40af;margin-bottom:0"></div>
        <table style="border-collapse:collapse;width:100%;margin-bottom:20px">
          ${itemRows}
          <tr style="border-top:2px solid #1e40af">
            <td style="padding:10px 14px;font-weight:700;font-size:14px;color:#111827">Total (COD)</td>
            <td style="padding:10px 14px;font-weight:700;font-size:16px;color:#1e40af">Rs. ${order.total_amount}</td>
          </tr>
        </table>

        <p style="color:#111827;font-weight:600;font-size:13px;margin:0 0 4px;letter-spacing:0.04em">Delivery Details</p>
        <div style="border-top:2px solid #1e40af;margin-bottom:0"></div>
        <table style="border-collapse:collapse;width:100%;margin-bottom:20px">
          <tr ${tr}><td ${td1}>Area</td><td ${td2}>${order.location}</td></tr>
          <tr ${trAlt}><td ${td1}>Address</td><td ${td2}>${order.address}</td></tr>
          ${order.special_instructions ? `<tr ${tr}><td ${td1}>Instructions</td><td ${td2}>${order.special_instructions}</td></tr>` : ""}
        </table>

        <p style="color:#111827;font-weight:600;font-size:13px;margin:0 0 4px;letter-spacing:0.04em">Customer Details</p>
        <div style="border-top:2px solid #1e40af;margin-bottom:0"></div>
        <table style="border-collapse:collapse;width:100%;margin-bottom:20px">
          <tr ${tr}><td ${td1}>Name</td><td ${td2}>${customerName}</td></tr>
          <tr ${trAlt}><td ${td1}>Phone</td><td ${td2}>${customerPhone}</td></tr>
          <tr ${tr}><td ${td1}>Email</td><td ${td2}>${customerEmail || "N/A"}</td></tr>
        </table>

        <p style="margin:0;color:#6b7280;font-size:13px">Log in to your Supabase dashboard to update order status.</p>
      </div>
    </div>`;

    try {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Homitra Kitchen <orders@homitra.co.in>",
          to: [ADMIN_EMAIL],
          subject: `New Food Order - #${orderRef} | Rs. ${order.total_amount}`,
          html: adminHtml,
        }),
      });
      const body = await emailRes.text();
      console.log(`[food-notification] email status=${emailRes.status} body=${body}`);
    } catch (e) {
      console.error("[food-notification] email error:", e);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[food-notification] unhandled error:", error);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
