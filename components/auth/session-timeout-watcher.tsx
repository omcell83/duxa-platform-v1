"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { SecuritySettings } from "@/app/actions/system-settings";

interface SessionTimeoutWatcherProps {
    role: string;
    settings: SecuritySettings;
}

export function SessionTimeoutWatcher({ role, settings }: SessionTimeoutWatcherProps) {
    const router = useRouter();
    const supabase = createClient();
    const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

    // Get timeout for this specific role, fallback to 60 minutes
    const timeoutMinutes = settings.session_timeouts?.[role as keyof typeof settings.session_timeouts] || 60;
    const timeoutMs = timeoutMinutes * 60 * 1000;

    const handleLogout = useCallback(async () => {
        console.log(`[SESSION] Timeout reached for role: ${role}. Logging out...`);
        await supabase.auth.signOut();
        router.push("/login?error=session_timeout");
    }, [supabase, router, role]);

    const resetTimer = useCallback(() => {
        if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = setTimeout(handleLogout, timeoutMs);
    }, [handleLogout, timeoutMs]);

    useEffect(() => {
        // Initial start
        resetTimer();

        // Activity listeners
        const activityEvents = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];

        activityEvents.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        return () => {
            if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
            activityEvents.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [resetTimer]);

    return null;
}
