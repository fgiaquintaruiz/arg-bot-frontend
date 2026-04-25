const KOTLIN_URL = import.meta.env.VITE_KOTLIN_API_URL || 'https://arg-bot-backend-kotlin.onrender.com';

export const getApiUrl = (): string => KOTLIN_URL;

export const API_URL = KOTLIN_URL;
