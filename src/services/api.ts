// src/services/api.ts
// Service para comunicação com o backend Sonora

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Token de autenticação
let authToken: string | null = localStorage.getItem('sonora_token');

/**
 * Define o token de autenticação
 */
export function setAuthToken(token: string | null) {
    authToken = token;
    if (token) {
        localStorage.setItem('sonora_token', token);
    } else {
        localStorage.removeItem('sonora_token');
    }
}

/**
 * Retorna o token atual
 */
export function getAuthToken(): string | null {
    return authToken;
}

/**
 * Headers padrão para requests autenticadas
 */
function getHeaders(): HeadersInit {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
}

// ============================================
// AUTH
// ============================================

export interface RegisterData {
    username: string;
    email: string;
    password: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface AuthResponse {
    message: string;
    user: {
        id: number;
        username: string;
        email: string;
        avatar_url?: string;
    };
    token: string;
}

export async function register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Erro ao registrar');
    }

    setAuthToken(result.token);
    return result;
}

export async function login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Erro ao fazer login');
    }

    setAuthToken(result.token);
    return result;
}

export async function getCurrentUser() {
    const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Não autenticado');
    }

    return response.json();
}

export function logout() {
    setAuthToken(null);
}

// ============================================
// REVIEWS
// ============================================

export interface Review {
    id: number;
    user_id: number;
    spotify_album_id: string;
    album_name: string;
    album_artist: string;
    album_cover_url: string | null;
    rating: number;
    review_text: string | null;
    created_at: string;
    updated_at: string;
    username?: string;
    user_avatar?: string;
}

export interface CreateReviewData {
    spotify_album_id: string;
    album_name: string;
    album_artist: string;
    album_cover_url?: string;
    rating: number;
    review_text?: string;
}

export interface UpdateReviewData {
    rating?: number;
    review_text?: string;
}

export async function getReviews(params?: { album_id?: string; user_id?: number; limit?: number; offset?: number }): Promise<{ reviews: Review[] }> {
    const searchParams = new URLSearchParams();
    if (params?.album_id) searchParams.set('album_id', params.album_id);
    if (params?.user_id) searchParams.set('user_id', String(params.user_id));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    const response = await fetch(`${API_URL}/api/reviews?${searchParams}`, {
        headers: getHeaders(),
    });

    return response.json();
}

export async function getReview(id: number): Promise<{ review: Review }> {
    const response = await fetch(`${API_URL}/api/reviews/${id}`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Review não encontrada');
    }

    return response.json();
}

export async function createReview(data: CreateReviewData): Promise<{ message: string; review: Review }> {
    const response = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar review');
    }

    return result;
}

export async function updateReview(id: number, data: UpdateReviewData): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/api/reviews/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar review');
    }

    return result;
}

export async function deleteReview(id: number): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/api/reviews/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Erro ao deletar review');
    }

    return result;
}

export async function getAlbumStats(spotifyAlbumId: string): Promise<{ stats: { total_reviews: number; average_rating: number | null; min_rating: number | null; max_rating: number | null } }> {
    const response = await fetch(`${API_URL}/api/reviews/album/${spotifyAlbumId}/stats`, {
        headers: getHeaders(),
    });

    return response.json();
}
