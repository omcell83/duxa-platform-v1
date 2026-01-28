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
        secondary_text: string;
        border: string;
        card_background: string;
        success: string;
        warning: string;
        error: string;
    };
    typography: {
        font_family: string;
        base_font_size: number;
        heading_font_size: number;
        secondary_font_size: number;
        font_weight_bold: number;
        font_weight_medium: number;
    };
    layout: {
        border_radius: number;
        card_padding: number;
        container_gap: number;
        kiosk_header_height: number;
    };
    components: {
        button_style: 'flat' | 'rounded' | 'glass';
        card_shadow: 'none' | 'sm' | 'md' | 'lg';
        show_icons: boolean;
        category_scroll: 'horizontal' | 'vertical';
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

    // Ensure nested objects are handled correctly for the update
    const updatePayload: any = {
        updated_at: new Date().toISOString()
    };

    if (themeData.name) updatePayload.name = themeData.name;
    if (themeData.description !== undefined) updatePayload.description = themeData.description;
    if (themeData.colors) updatePayload.colors = themeData.colors;
    if (themeData.typography) updatePayload.typography = themeData.typography;
    if (themeData.layout) updatePayload.layout = themeData.layout;
    if (themeData.components) updatePayload.components = themeData.components;

    const { error } = await supabaseAdmin
        .from('themes')
        .update(updatePayload)
        .eq('id', id);

    if (error) {
        console.error("Error updating theme:", error);
        return { success: false, error: error.message };
    }

    revalidatePath('/super-admin/settings/themes');
    return { success: true };
}
