'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export interface MeetingTask {
    id: string;
    title: string;
    description: string | null;
    responsible_person_id: string | null;
    link: string | null;
    status: 'active' | 'completed' | 'important' | 'postponed';
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
 * Taskları getir
 * listType 'active': Aktif, önemli, ertelenmiş VE son 2 dakika içinde tamamlanmışları döndürür.
 * listType 'completed': 2 dakikadan önce tamamlanmışları döndürür.
 */
export async function getMeetingTasks(listType: 'active' | 'completed'): Promise<{
    success: boolean;
    data?: MeetingTask[];
    error?: string;
}> {
    try {
        const supabase = await createClient();

        // 2 dakika öncesinin zaman damgası
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

        let query = supabase
            .from('meeting_tasks')
            .select(`
                *,
                responsible_person:profiles!responsible_person_id(
                    id,
                    full_name,
                    email
                )
            `)
            .order('order_index', { ascending: false });

        if (listType === 'active') {
            // Aktifler + Henüz listeye düşmemiş taze tamamlananlar
            // status IN ('active', 'important', 'postponed') OR (status = 'completed' AND completed_at > twoMinutesAgo)
            query = query.or(`status.in.(active,important,postponed),and(status.eq.completed,completed_at.gt.${twoMinutesAgo})`);
        } else {
            // Tamamen arşivlenmiş tamamlananlar
            query = query.eq('status', 'completed').lte('completed_at', twoMinutesAgo);
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
    description?: string | null;
    responsible_person_id?: string | null;
    link?: string | null;
}): Promise<{
    success: boolean;
    data?: MeetingTask;
    error?: string;
}> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Oturum bulunamadı' };
        }

        const { data: maxOrderData } = await supabase
            .from('meeting_tasks')
            .select('order_index')
            .order('order_index', { ascending: false })
            .limit(1)
            .single();

        const newOrderIndex = (maxOrderData?.order_index ?? -1) + 1;

        // Başlangıçta title veya description doluysa started_at'i set et
        const hasContent = (data.title && data.title.trim() !== '') || (data.description && data.description.trim() !== '');
        const started_at = hasContent ? new Date().toISOString() : null;

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
                responsible_person:profiles!responsible_person_id(
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
        description?: string | null;
        responsible_person_id?: string | null;
        link?: string | null;
        status?: 'active' | 'completed' | 'important' | 'postponed';
    }
): Promise<{
    success: boolean;
    data?: MeetingTask;
    error?: string;
}> {
    try {
        const supabase = await createClient();

        const { data: existingTask } = await supabase
            .from('meeting_tasks')
            .select('started_at, title, description, status')
            .eq('id', id)
            .single();

        if (!existingTask) {
            return { success: false, error: 'Görev bulunamadı' };
        }

        const updateData: Record<string, unknown> = { ...data };

        // started_at mantığı: Eğer henüz set edilmemişse ve anlamlı bir içerik girişi varsa set et.
        // Hem title hem description kontrol edilir.
        if (!existingTask.started_at) {
            const newTitle = data.title !== undefined ? data.title : existingTask.title;
            const newDesc = data.description !== undefined ? data.description : existingTask.description;

            // Eğer title veya description doluysa started_at'i başlat
            if ((newTitle && newTitle.trim() !== '') || (newDesc && newDesc.trim() !== '')) {
                updateData.started_at = new Date().toISOString();
            }
        }

        // Eğer statüs completed oluyorsa completed_at'i de set et, yoksa null yap (geri alma durumu için)
        if (data.status === 'completed') {
            updateData.completed_at = new Date().toISOString();
        } else if (data.status) {
            updateData.completed_at = null;
        }

        const { data: updatedTask, error } = await supabase
            .from('meeting_tasks')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                responsible_person:profiles!responsible_person_id(
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
 * Task'ı sil
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
        return { success: false, error: 'Silme hatası' };
    }
}

/**
 * Kullanıcıları getir
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
            return { success: false, error: error.message };
        }
        return { success: true, data: data || [] };
    } catch (error) {
        return { success: false, error: 'Kullanıcı hatası' };
    }
}

/**
 * Cron job benzeri "tamamen tamamla" fonksiyonuna artık gerek kalmadı çünkü sorgu tabanlı çalışıyoruz.
 * Ancak geriye dönük uyumluluk veya manuel tetikleme için boş bir fonksiyon bırakabilir veya silebiliriz.
 * Kullanıcı isteği: "2 dakika daha aktif alanda kalacak" -> bu sorgu ile halloldu.
 * Yine de markTaskAsCompleted eski kodda çağrılıyorsa hatayı önlemek için boş bir implementasyon bırakıyorum veya siliyorum.
 * Silmek en iyisi, ama page.tsx'den de sileceğim.
 */
