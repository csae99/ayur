import { authUtils } from './auth';

// API base URL - dynamically use current hostname so it works on any machine
const API_BASE = typeof window !== 'undefined'
    ? `${window.location.origin}/api`
    : 'http://localhost/api';

interface FetchOptions extends RequestInit {
    skipAuth?: boolean;
}

/**
 * Fetch wrapper with automatic token refresh and error handling
 */
export async function apiFetch(
    endpoint: string,
    options: FetchOptions = {}
): Promise<Response> {
    const { skipAuth = false, headers = {}, ...restOptions } = options;

    // Build headers
    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(headers as Record<string, string>),
    };

    // Add authorization header if not skipped
    if (!skipAuth) {
        const token = await authUtils.getValidToken();
        if (token) {
            requestHeaders['Authorization'] = `Bearer ${token}`;
        }
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

    let response = await fetch(url, {
        ...restOptions,
        headers: requestHeaders,
    });

    // If 401 and we have a refresh token, try to refresh and retry
    if (response.status === 401 && !skipAuth && authUtils.hasValidRefreshToken()) {
        const newToken = await authUtils.refreshAccessToken();

        if (newToken) {
            // Retry with new token
            requestHeaders['Authorization'] = `Bearer ${newToken}`;
            response = await fetch(url, {
                ...restOptions,
                headers: requestHeaders,
            });
        }
    }

    return response;
}

/**
 * Helper: GET request
 */
export async function apiGet(endpoint: string, options: FetchOptions = {}) {
    return apiFetch(endpoint, { ...options, method: 'GET' });
}

/**
 * Helper: POST request
 */
export async function apiPost(endpoint: string, body: any, options: FetchOptions = {}) {
    return apiFetch(endpoint, {
        ...options,
        method: 'POST',
        body: JSON.stringify(body)
    });
}

/**
 * Helper: PATCH request
 */
export async function apiPatch(endpoint: string, body: any, options: FetchOptions = {}) {
    return apiFetch(endpoint, {
        ...options,
        method: 'PATCH',
        body: JSON.stringify(body)
    });
}

/**
 * Helper: DELETE request
 */
export async function apiDelete(endpoint: string, options: FetchOptions = {}) {
    return apiFetch(endpoint, { ...options, method: 'DELETE' });
}

export default { apiFetch, apiGet, apiPost, apiPatch, apiDelete };
