// types.ts
export interface User {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    avatar?: string;
    is2FAEnabled: boolean;
    }
    
    export interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
    enable2FA: () => Promise<{ qrCode: string }>;
    disable2FA: () => Promise<void>;
    verify2FA: (code: string) => Promise<void>;
    }