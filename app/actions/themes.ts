"use server";

import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/admin";
import { revalidatePath } from "next/cache";

export interface Theme {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    thumbnail_url: string | null;
    colors: {
        primary: string;
        accent: string;
        background: string;
        text: string;
    };
    is_system: boolean;
}

export async function getThemes(): Promise<Theme[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('themes')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error fetching themes:", error);
        return [];
    }

    return data as Theme[];
}

export async function getThemeById(id: string): Promise<Theme | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('themes')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error("Error fetching theme:", error);
        return null;
    }

    return data as Theme;
}

export async function updateTheme(id: string, themeData: Partial<Theme>) {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
        .from('themes')
        .update({
            ...themeData,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) {
        console.error("Error updating theme:", error);
        return { success: false, error: error.message };
    }

    revalidatePath('/super-admin/settings/themes');
    return { success: true };
}
