import { createAdminClient } from "@/lib/admin";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const headersList = await headers();

        let ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
        if (ip.includes(",")) ip = ip.split(",")[0].trim();
        const ua = headersList.get("user-agent") || "unknown";

        const { event_type, severity, message, user_id, metadata, personnel_id, tenant_id } = body;

        const supabaseAdmin = createAdminClient();

        const { error } = await supabaseAdmin.from("system_logs").insert({
            event_type,
            severity,
            message,
            user_id: user_id || null,
            personnel_id: personnel_id || null,
            tenant_id: tenant_id || null,
            ip_address: ip,
            user_agent: ua,
            metadata: metadata || {}
        });

        if (error) {
            console.error("[API-LOGS] DB Error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("[API-LOGS] Critical Error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
