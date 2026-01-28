'use server';

import { createAdminClient } from '@/lib/admin';
import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Zod Schemas
const createUserSchema = z.object({
    fullName: z.string().min(2, 'Ad Soyad en az 2 karakter olmalıdır.'),
    email: z.string().email('Geçerli bir email adresi giriniz.'),
    phone: z.string().optional(),
    role: z.enum(['super_admin', 'owner', 'tenant_admin', 'manager']),
    password: z.string().min(6, 'Parola en az 6 karakter olmalıdır.'),
});

const updateUserSchema = z.object({
    userId: z.string(),
    fullName: z.string().min(2, 'Ad Soyad en az 2 karakter olmalıdır.'),
    email: z.string().email('Geçerli bir email adresi giriniz.'),
    phone: z.string().optional(),
    role: z.enum(['super_admin', 'owner', 'tenant_admin', 'manager']),
});

export async function getUsers() {
    const supabase = await createClient();

    // RLS will handle tenant isolation, but for super admin we want to see specific roles
    // We filter by roles
    const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['super_admin', 'owner', 'tenant_admin', 'manager'])
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching users:', error);
        throw new Error('Kullanıcılar getirilirken bir hata oluştu.');
    }

    return users;
}

export async function createUser(prevState: any, formData: FormData) {
    const supabaseAdmin = createAdminClient();
    const supabase = await createClient();

    // Validate current user is super admin
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !currentUser) return { error: 'Oturum açmanız gerekiyor.' };

    // Helper to get profile
    const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', currentUser.id).single();
    if (currentProfile?.role !== 'super_admin') {
        return { error: 'Bu işlem için yetkiniz yok.' };
    }

    // Parse data
    const rawData = {
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        role: formData.get('role'),
        password: formData.get('password'),
    };

    const validation = createUserSchema.safeParse(rawData);
    if (!validation.success) {
        return { error: validation.error.issues[0].message };
    }

    const { email, password, fullName, phone, role } = validation.data;

    // 1. Create user in Auth (Admin context to auto-confirm)
    const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { FULL_NAME: fullName }
    });

    if (createError) {
        console.error('Auth create error:', createError);
        return { error: `Kullanıcı oluşturulamadı: ${createError.message}` };
    }

    if (!authUser.user) return { error: 'Kullanıcı oluşturulamadı.' };

    // 2. Add to profiles (if not trigger created, but we update it to be safe or insert)
    // Check if profile exists (triggers might have created it)
    const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', authUser.user.id)
        .single();

    const profileData = {
        id: authUser.user.id,
        full_name: fullName,
        email: email,
        phone: phone || null,
        role: role,
        is_active: true,
        created_at: new Date().toISOString(),
    };

    let profileError;
    if (existingProfile) {
        const { error } = await supabaseAdmin
            .from('profiles')
            .update(profileData)
            .eq('id', authUser.user.id);
        profileError = error;
    } else {
        const { error } = await supabaseAdmin
            .from('profiles')
            .insert(profileData);
        profileError = error;
    }

    if (profileError) {
        console.error('Profile create error:', profileError);
        // Cleanup auth user if profile fails? ideally transaction but supabase http doesn't support spanning auth and public easily
        // We will leave it for now or try to delete
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        return { error: `Profil oluşturulamadı: ${profileError.message}` };
    }

    revalidatePath('/super-admin/settings/users');
    return { success: true, message: 'Kullanıcı başarıyla oluşturuldu.' };
}

export async function softDeleteUser(userId: string) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    // Check permission
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Use admin client to ensure we can update any user
    const { error } = await supabaseAdmin
        .from('profiles')
        .update({ is_active: false })
        .eq('id', userId);

    if (error) {
        console.error('Soft delete error:', error);
        throw new Error('Kullanıcı silinemedi.');
    }

    // Also ban in auth to prevent login
    const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: '876600h' // 100 years
    });

    if (banError) console.error('Ban error:', banError);

    revalidatePath('/super-admin/settings/users');
    return { success: true };
}

export async function setUserPassword(userId: string, newPassword: string) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    // Permission check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword
    });

    if (error) {
        throw new Error(`Parola güncellenemedi: ${error.message}`);
    }

    return { success: true };
}

export async function updateUser(prevState: any, formData: FormData) {
    const supabaseAdmin = createAdminClient();

    const rawData = {
        userId: formData.get('userId'),
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        role: formData.get('role'),
    };

    const validation = updateUserSchema.safeParse(rawData);
    if (!validation.success) {
        return { error: validation.error.issues[0].message };
    }

    const { userId, fullName, email, phone, role } = validation.data;

    // Update profile
    const { error } = await supabaseAdmin
        .from('profiles')
        .update({
            full_name: fullName,
            email: email,
            phone: phone,
            role: role
        })
        .eq('id', userId);

    if (error) {
        return { error: 'Kullanıcı güncellenemedi.' };
    }

    // Update Auth email if changed
    // This sends confirmation email by default unless suppress is used, but admin client auto confirms? 
    // Updating email via admin client usually confirms automatically.
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: email,
        user_metadata: { FULL_NAME: fullName }
    });

    if (authError) {
        console.error("Auth update error", authError);
        // Non-critical if profile updated but auth email failed (rare)
    }

    revalidatePath('/super-admin/settings/users');
    return { success: true, message: 'Kullanıcı güncellendi.' };
}

export async function toggleUser2FA(userId: string, isRequired: boolean) {
    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin
        .from('profiles')
        .update({ is_2fa_required: isRequired })
        .eq('id', userId);

    if (error) throw new Error('2FA ayarı güncellenemedi.');

    revalidatePath('/super-admin/settings/users');
    return { success: true };
}
export async function toggleUserStatus(userId: string, isActive: boolean) {
    const supabaseAdmin = createAdminClient();

    // 1. Update Profile
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId);

    if (profileError) {
        console.error('Toggle status profile error:', profileError);
        throw new Error('Kullanıcı durumu güncellenemedi.');
    }

    // 2. Update Auth (Ban/Unban)
    // If not active, ban user (infinite). If active, unban (set duration to empty string or null)
    // Supabase admin.updateUserById takes ban_duration. Setting to '0h' or small number unbans, but standard is null or ''
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: isActive ? 'none' : '876600h' // 'none' resets the ban
    });

    if (authError) {
        console.error('Toggle status auth error:', authError);
    }

    revalidatePath('/super-admin/settings/users');
    return { success: true };
}
