// src/types/review.ts

/**
 * Representa uma review de álbum no sistema Sonora
 */
export interface Review {
    id: number;
    user_id: number;
    spotify_album_id: string;

    // Dados do álbum (denormalizados)
    album_name: string;
    album_artist: string;
    album_cover_url: string | null;

    // Dados da review
    rating: number; // 0 a 5, suporta meio-ponto (ex: 3.5)
    review_text: string | null;

    // Timestamps
    created_at: string; // ISO 8601
    updated_at: string; // ISO 8601

    // Dados do usuário (quando join)
    username?: string;
    user_avatar?: string;
}

/**
 * Payload para criar uma review
 */
export interface CreateReviewInput {
    spotify_album_id: string;
    album_name: string;
    album_artist: string;
    album_cover_url?: string;
    rating: number;
    review_text?: string;
}

/**
 * Payload para atualizar uma review
 */
export interface UpdateReviewInput {
    rating?: number;
    review_text?: string;
}

/**
 * Dados do usuário autenticado
 */
export interface User {
    id: number;
    username: string;
    email: string;
    avatar_url?: string;
}

/**
 * Estatísticas de um álbum
 */
export interface AlbumStats {
    total_reviews: number;
    average_rating: number | null;
    min_rating: number | null;
    max_rating: number | null;
}
