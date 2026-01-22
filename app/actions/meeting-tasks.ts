'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export interface MeetingTask {
    id: string;
    title: string;
    description: string | null;
    responsible_person_id: string | null;
    link: string | null;
    status: 'active' | 'completed';
    created_at: string;
    started_at: string | null;
    completed_at: string | null;
    order_index: number;
    created_by: string | null;
    updated_at: string;
    responsible_person?: {
        id: string;
        full_name: string;
        email: string;
    } | null;
}

/**
 * Tüm meeting task'ları getir (aktif ve tamamlanmış)
 */
export async function getMeetingTasks(status?: 'active' | 'completed'): Promise<{
    success: boolean;
    data?: MeetingTask[];
    error?: string;
}> {
    try {
        const supabase = await createClient();

        let query = supabase
            .from('meeting_tasks')
            .select(`
        *,
        responsible_person:profiles!meeting_tasks_responsible_person_id_fkey(
          id,
          full_name,
          email
        )
      `)
            .order('order_index', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Meeting tasks fetch error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data as MeetingTask[] };
    } catch (error) {
        console.error('Meeting tasks fetch exception:', error);
        return { success: false, error: 'Görevler yüklenirken bir hata oluştu' };
    }
}

/**
 * Yeni meeting task oluştur
 */
export async function createMeetingTask(data: {
    title: string;
    description?: string;
    responsible_person_id?: string;
    link?: string;
}): Promise<{
    success: boolean;
    data?: MeetingTask;
    error?: string;
}> {
    try {
        const supabase = await createClient();

        // Kullanıcı bilgisini al
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Oturum bulunamadı' };
        }

        // En yüksek order_index'i bul
        const { data: maxOrderData } = await supabase
            .from('meeting_tasks')
            .select('order_index')
            .order('order_index', { ascending: false })
            .limit(1)
            .single();

        const newOrderIndex = (maxOrderData?.order_index ?? -1) + 1;

        // started_at'ı description varsa set et
        const started_at = data.description && data.description.trim() !== '' ? new Date().toISOString() : null;

        const { data: newTask, error } = await supabase
            .from('meeting_tasks')
            .insert({
                title: data.title,
                description: data.description || null,
                responsible_person_id: data.responsible_person_id || null,
                link: data.link || null,
                status: 'active',
                created_by: user.id,
                order_index: newOrderIndex,
                started_at,
            })
            .select(`
        *,
        responsible_person:profiles!meeting_tasks_responsible_person_id_fkey(
          id,
          full_name,
          email
        )
      `)
            .single();

        if (error) {
            console.error('Meeting task create error:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/super-admin/settings/meeting-tasks');
        return { success: true, data: newTask as MeetingTask };
    } catch (error) {
        console.error('Meeting task create exception:', error);
        return { success: false, error: 'Görev oluşturulurken bir hata oluştu' };
    }
}

/**
 * Meeting task güncelle
 */
export async function updateMeetingTask(
    id: string,
    data: {
        title?: string;
        description?: string;
        responsible_person_id?: string;
        link?: string;
    }
): Promise<{
    success: boolean;
    data?: MeetingTask;
    error?: string;
}> {
    try {
        const supabase = await createClient();

        // Mevcut task'ı al
        const { data: existingTask } = await supabase
            .from('meeting_tasks')
            .select('started_at, description')
            .eq('id', id)
            .single();

        const updateData: Record<string, unknown> = { ...data };

        // Eğer description ilk kez ekleniyor ve started_at yoksa, started_at'ı set et
        if (
            data.description &&
            data.description.trim() !== '' &&
            existingTask &&
            !existingTask.started_at &&
            (!existingTask.description || existingTask.description.trim() === '')
        ) {
            updateData.started_at = new Date().toISOString();
        }

        const { data: updatedTask, error } = await supabase
            .from('meeting_tasks')
            .update(updateData)
            .eq('id', id)
            .select(`
        *,
        responsible_person:profiles!meeting_tasks_responsible_person_id_fkey(
          id,
          full_name,
          email
        )
      `)
            .single();

        if (error) {
            console.error('Meeting task update error:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/super-admin/settings/meeting-tasks');
        return { success: true, data: updatedTask as MeetingTask };
    } catch (error) {
        console.error('Meeting task update exception:', error);
        return { success: false, error: 'Görev güncellenirken bir hata oluştu' };
    }
}

/**
 * Meeting task'ı tamamla (2 dakika sonra completed statüsüne geçecek)
 */
export async function completeMeetingTask(id: string): Promise<{
    success: boolean;
    data?: MeetingTask;
    error?: string;
}> {
    try {
        const supabase = await createClient();

        const { data: updatedTask, error } = await supabase
            .from('meeting_tasks')
            .update({
                completed_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select(`
        *,
        responsible_person:profiles!meeting_tasks_responsible_person_id_fkey(
          id,
          full_name,
          email
        )
      `)
            .single();

        if (error) {
            console.error('Meeting task complete error:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/super-admin/settings/meeting-tasks');
        return { success: true, data: updatedTask as MeetingTask };
    } catch (error) {
        console.error('Meeting task complete exception:', error);
        return { success: false, error: 'Görev tamamlanırken bir hata oluştu' };
    }
}

/**
 * Meeting task'ı completed statüsüne geç (2 dakika sonra otomatik çağrılacak)
 */
export async function markTaskAsCompleted(id: string): Promise<{
    success: boolean;
    data?: MeetingTask;
    error?: string;
}> {
    try {
        const supabase = await createClient();

        const { data: updatedTask, error } = await supabase
            .from('meeting_tasks')
            .update({
                status: 'completed',
            })
            .eq('id', id)
            .select(`
        *,
        responsible_person:profiles!meeting_tasks_responsible_person_id_fkey(
          id,
          full_name,
          email
        )
      `)
            .single();

        if (error) {
            console.error('Meeting task mark completed error:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/super-admin/settings/meeting-tasks');
        return { success: true, data: updatedTask as MeetingTask };
    } catch (error) {
        console.error('Meeting task mark completed exception:', error);
        return { success: false, error: 'Görev durumu güncellenirken bir hata oluştu' };
    }
}

/**
 * Meeting task'ı sil
 */
export async function deleteMeetingTask(id: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const supabase = await createClient();

        const { error } = await supabase.from('meeting_tasks').delete().eq('id', id);

        if (error) {
            console.error('Meeting task delete error:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/super-admin/settings/meeting-tasks');
        return { success: true };
    } catch (error) {
        console.error('Meeting task delete exception:', error);
        return { success: false, error: 'Görev silinirken bir hata oluştu' };
    }
}

/**
 * Tüm super admin, owner, tenant_admin ve manager kullanıcıları getir
 */
export async function getEligibleUsers(): Promise<{
    success: boolean;
    data?: Array<{ id: string; full_name: string; email: string; role: string }>;
    error?: string;
}> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, role')
            .in('role', ['super_admin', 'owner', 'tenant_admin', 'manager'])
            .eq('is_active', true)
            .order('full_name');

        if (error) {
            console.error('Eligible users fetch error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Eligible users fetch exception:', error);
        return { success: false, error: 'Kullanıcılar yüklenirken bir hata oluştu' };
    }
}
