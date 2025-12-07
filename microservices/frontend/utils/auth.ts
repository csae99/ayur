// Auth utility for token management
const AUTH_TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const REFRESH_TOKEN_EXPIRY_KEY = 'refreshTokenExpiresAt';
const USER_KEY = 'user';

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

export const authUtils = {
    // Get access token
    getToken: (): string | null => {
        if (!isBrowser) return null;
        return localStorage.getItem(AUTH_TOKEN_KEY);
    },

    // Get refresh token
    getRefreshToken: (): string | null => {
        if (!isBrowser) return null;
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    },

    // Get user data
    getUser: (): any | null => {
        if (!isBrowser) return null;
        const userData = localStorage.getItem(USER_KEY);
        return userData ? JSON.parse(userData) : null;
    },

    // Store tokens after login
    setTokens: (data: {
        token: string;
        user: any;
        refreshToken?: string;
        refreshTokenExpiresAt?: string;
    }) => {
        if (!isBrowser) return;
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));

        if (data.refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        }
        if (data.refreshTokenExpiresAt) {
            localStorage.setItem(REFRESH_TOKEN_EXPIRY_KEY, data.refreshTokenExpiresAt);
        }
    },

    // Clear all auth data
    clearTokens: () => {
        if (!isBrowser) return;
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_EXPIRY_KEY);
        localStorage.removeItem(USER_KEY);
    },

    // Check if token is expired (with 5 min buffer)
    isTokenExpired: (token: string): boolean => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiryTime = payload.exp * 1000; // Convert to ms
            const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
            return Date.now() > (expiryTime - bufferTime);
        } catch {
            return true;
        }
    },

    // Check if refresh token is valid
    hasValidRefreshToken: (): boolean => {
        if (!isBrowser) return false;
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        const expiresAt = localStorage.getItem(REFRESH_TOKEN_EXPIRY_KEY);

        if (!refreshToken || !expiresAt) return false;
        return new Date() < new Date(expiresAt);
    },

    // Refresh access token using refresh token
    refreshAccessToken: async (): Promise<string | null> => {
        const refreshToken = authUtils.getRefreshToken();
        if (!refreshToken) return null;

        try {
            const response = await fetch('http://localhost/api/identity/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });

            if (!response.ok) {
                authUtils.clearTokens();
                return null;
            }

            const data = await response.json();
            localStorage.setItem(AUTH_TOKEN_KEY, data.token);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
            return data.token;
        } catch (error) {
            console.error('Failed to refresh token:', error);
            authUtils.clearTokens();
            return null;
        }
    },

    // Logout and invalidate refresh token
    logout: async (): Promise<void> => {
        const refreshToken = authUtils.getRefreshToken();

        if (refreshToken) {
            try {
                await fetch('http://localhost/api/identity/auth/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken })
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
        }

        authUtils.clearTokens();
    },

    // Get valid token (refreshes if needed)
    getValidToken: async (): Promise<string | null> => {
        const token = authUtils.getToken();

        if (!token) {
            // No token - try refresh
            if (authUtils.hasValidRefreshToken()) {
                return authUtils.refreshAccessToken();
            }
            return null;
        }

        // Check if token is expired
        if (authUtils.isTokenExpired(token)) {
            if (authUtils.hasValidRefreshToken()) {
                return authUtils.refreshAccessToken();
            }
            authUtils.clearTokens();
            return null;
        }

        return token;
    }
};

export default authUtils;
