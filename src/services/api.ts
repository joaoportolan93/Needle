/**
 * Sonora API Service
 * ===================
 * Secure API client that communicates with the Python backend.
 * All Spotify API calls are proxied through the backend to keep credentials safe.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
}

// ===================== Spotify Proxy Functions =====================

/**
 * Search for albums, artists, and tracks on Spotify
 */
export async function searchSpotify(
    query: string,
    types: string[] = ['album', 'artist', 'track'],
    limit: number = 20,
    offset: number = 0
) {
    const params = new URLSearchParams({
        q: query,
        type: types.join(','),
        limit: limit.toString(),
        offset: offset.toString(),
    });

    return fetchAPI(`/api/spotify/search?${params}`);
}

/**
 * Get new album releases from Spotify
 */
export async function getSpotifyNewReleases(limit: number = 20, offset: number = 0) {
    const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
    });

    return fetchAPI(`/api/spotify/new-releases?${params}`);
}

/**
 * Get Spotify categories
 */
export async function getSpotifyCategories(limit: number = 20, offset: number = 0) {
    const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
    });

    return fetchAPI(`/api/spotify/categories?${params}`);
}

/**
 * Get album details by Spotify ID
 */
export async function getSpotifyAlbumDetails(albumId: string) {
    return fetchAPI(`/api/spotify/albums/${albumId}`);
}

/**
 * Get artist details by Spotify ID
 */
export async function getSpotifyArtistDetails(artistId: string) {
    return fetchAPI(`/api/spotify/artists/${artistId}`);
}

/**
 * Get artist's top tracks
 */
export async function getSpotifyArtistTopTracks(artistId: string) {
    return fetchAPI(`/api/spotify/artists/${artistId}/top-tracks`);
}

/**
 * Get artist's albums
 */
export async function getSpotifyArtistAlbums(artistId: string, limit: number = 20) {
    const params = new URLSearchParams({
        limit: limit.toString(),
    });

    return fetchAPI(`/api/spotify/artists/${artistId}/albums?${params}`);
}

/**
 * Get track details by Spotify ID
 */
export async function getSpotifyTrackDetails(trackId: string) {
    return fetchAPI(`/api/spotify/tracks/${trackId}`);
}

// ===================== Reviews API =====================

export interface ReviewCreate {
    album_spotify_id: string;
    album_name: string;
    album_artist: string;
    album_cover_url?: string;
    album_release_date?: string;
    rating: number;
    review_text?: string;
    is_favorite?: boolean;
}

export interface ReviewUpdate {
    rating?: number;
    review_text?: string;
    is_favorite?: boolean;
}

export interface Review {
    id: number;
    user_id: number;
    album_spotify_id: string;
    rating: number;
    review_text?: string;
    is_favorite: boolean;
    created_at: string;
    updated_at: string;
    user?: {
        id: number;
        username: string;
        avatar_url?: string;
    };
    album?: {
        spotify_id: string;
        name: string;
        artist_name: string;
        cover_url?: string;
    };
}

/**
 * Create a new album review
 */
export async function createReview(review: ReviewCreate, userId: number = 1): Promise<Review> {
    const params = new URLSearchParams({ user_id: userId.toString() });

    return fetchAPI(`/api/reviews?${params}`, {
        method: 'POST',
        body: JSON.stringify(review),
    });
}

/**
 * Get all reviews for a specific album
 */
export async function getAlbumReviews(
    albumId: string,
    limit: number = 20,
    offset: number = 0
): Promise<Review[]> {
    const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
    });

    return fetchAPI(`/api/reviews/album/${albumId}?${params}`);
}

/**
 * Get all reviews by a specific user
 */
export async function getUserReviews(
    userId: number,
    limit: number = 20,
    offset: number = 0
): Promise<Review[]> {
    const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
    });

    return fetchAPI(`/api/reviews/user/${userId}?${params}`);
}

/**
 * Get a specific review by ID
 */
export async function getReview(reviewId: number): Promise<Review> {
    return fetchAPI(`/api/reviews/${reviewId}`);
}

/**
 * Update an existing review
 */
export async function updateReview(
    reviewId: number,
    update: ReviewUpdate,
    userId: number = 1
): Promise<Review> {
    const params = new URLSearchParams({ user_id: userId.toString() });

    return fetchAPI(`/api/reviews/${reviewId}?${params}`, {
        method: 'PUT',
        body: JSON.stringify(update),
    });
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: number, userId: number = 1): Promise<void> {
    const params = new URLSearchParams({ user_id: userId.toString() });

    return fetchAPI(`/api/reviews/${reviewId}?${params}`, {
        method: 'DELETE',
    });
}

/**
 * Get recent reviews across all albums
 */
export async function getRecentReviews(limit: number = 10): Promise<Review[]> {
    const params = new URLSearchParams({ limit: limit.toString() });

    return fetchAPI(`/api/reviews/recent?${params}`);
}

// ===================== Album Stats =====================

export interface AlbumStats {
    album_id: string;
    review_count: number;
    average_rating: number;
}

/**
 * Get statistics for an album (average rating, review count)
 */
export async function getAlbumStats(albumId: string): Promise<AlbumStats> {
    return fetchAPI(`/api/stats/album/${albumId}`);
}

// ===================== Health Check =====================

/**
 * Check if the backend API is running
 */
export async function checkHealth(): Promise<{ status: string; message: string }> {
    return fetchAPI('/api/health');
}
