import { SecuritySettings } from "@/app/actions/system-settings";

export function validatePassword(password: string, settings: SecuritySettings): { isValid: boolean; error?: string } {
    if (password.length < settings.min_password_length) {
        return { isValid: false, error: `Şifre en az ${settings.min_password_length} karakter olmalıdır.` };
    }

    if (settings.require_uppercase && !/[A-Z]/.test(password)) {
        return { isValid: false, error: "Şifre en az bir büyük harf (A-Z) içermelidir." };
    }

    if (settings.require_number && !/[0-9]/.test(password)) {
        return { isValid: false, error: "Şifre en az bir rakam (0-9) içermelidir." };
    }

    if (settings.require_special_char && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { isValid: false, error: "Şifre en az bir özel karakter (!@#$%^&*) içermelidir." };
    }

    return { isValid: true };
}
