"use strict";
// src/services/spotifyAPI.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchSpotify = searchSpotify;
exports.getSpotifyAlbumDetails = getSpotifyAlbumDetails;
exports.getSpotifyArtistDetails = getSpotifyArtistDetails;
exports.getSpotifyArtistTopTracks = getSpotifyArtistTopTracks;
exports.getSpotifyArtistAlbums = getSpotifyArtistAlbums;
exports.getSpotifyNewReleases = getSpotifyNewReleases;
exports.getSpotifyCategories = getSpotifyCategories;
exports.getSpotifyCategoryPlaylists = getSpotifyCategoryPlaylists;
exports.getSpotifyTrackDetails = getSpotifyTrackDetails;
const SPOTIFY_CLIENT_ID = "c1a33f5d7ac24544b4b6e931dfc7cfef"; // Substitua pelo seu Client ID
const SPOTIFY_CLIENT_SECRET = "ca9aa91d8a584f66bd29960b75a502f7"; // Substitua pelo seu Client Secret
let accessToken = "";
let tokenExpirationTime = 0;
/**
 * Obtém um token de acesso da API do Spotify usando o fluxo de Client Credentials.
 * Gerencia o token em cache e sua expiração.
 */
async function getSpotifyAccessToken() {
    if (accessToken && Date.now() < tokenExpirationTime) {
        console.log("Usando token de acesso do Spotify em cache.");
        return accessToken;
    }
    console.log("Obtendo novo token de acesso do Spotify...");
    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Basic " + btoa(SPOTIFY_CLIENT_ID + ":" + SPOTIFY_CLIENT_SECRET),
        },
        body: "grant_type=client_credentials",
    });
    if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro ao obter token de acesso do Spotify:", errorData);
        throw new Error(`Falha ao obter token de acesso do Spotify: ${response.statusText}`);
    }
    const data = await response.json();
    accessToken = data.access_token;
    // Define o tempo de expiração um pouco antes do real para evitar problemas de timing
    tokenExpirationTime = Date.now() + (data.expires_in - 300) * 1000; // Spotify retorna expires_in em segundos
    console.log("Novo token de acesso do Spotify obtido com sucesso.");
    return accessToken;
}
/**
 * Função genérica para fazer chamadas à API do Spotify.
 * @param endpoint O endpoint da API a ser chamado (ex: "/v1/browse/new-releases")
 * @param method O método HTTP (GET, POST, etc.)
 * @param body O corpo da requisição (para POST, PUT, etc.)
 * @returns A resposta da API em JSON
 */
async function callSpotifyAPI(endpoint, method = "GET", body = null) {
    const token = await getSpotifyAccessToken();
    const headers = {
        "Authorization": `Bearer ${token}`,
    };
    const config = {
        method,
        headers,
    };
    if (body && (method === "POST" || method === "PUT")) {
        headers["Content-Type"] = "application/json";
        config.body = JSON.stringify(body);
    }
    const response = await fetch(`https://api.spotify.com${endpoint}`, config);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        console.error(`Erro ao chamar API do Spotify (${endpoint}):`, errorData);
        throw new Error(`Falha na chamada à API do Spotify (${endpoint}): ${errorData.message || response.statusText}`);
    }
    // Handle cases where response might be empty (e.g., 204 No Content)
    if (response.status === 204) {
        return null;
    }
    return response.json();
}
// Funções de exemplo para interagir com a API
async function searchSpotify(query, types = ["album", "artist", "track"]) {
    const typeString = types.join(",");
    return callSpotifyAPI(`/v1/search?q=${encodeURIComponent(query)}&type=${typeString}`);
}
async function getSpotifyAlbumDetails(albumId) {
    return callSpotifyAPI(`/v1/albums/${albumId}`);
}
async function getSpotifyArtistDetails(artistId) {
    return callSpotifyAPI(`/v1/artists/${artistId}`);
}
async function getSpotifyArtistTopTracks(artistId, market = "BR") {
    return callSpotifyAPI(`/v1/artists/${artistId}/top-tracks?market=${market}`);
}
async function getSpotifyArtistAlbums(artistId) {
    return callSpotifyAPI(`/v1/artists/${artistId}/albums`);
}
async function getSpotifyNewReleases(limit = 20, offset = 0) {
    return callSpotifyAPI(`/v1/browse/new-releases?limit=${limit}&offset=${offset}`);
}
async function getSpotifyCategories(limit = 20, offset = 0, country = "BR") {
    return callSpotifyAPI(`/v1/browse/categories?limit=${limit}&offset=${offset}&country=${country}`);
}
async function getSpotifyCategoryPlaylists(categoryId, limit = 20, offset = 0, country = "BR") {
    return callSpotifyAPI(`/v1/browse/categories/${categoryId}/playlists?limit=${limit}&offset=${offset}&country=${country}`);
}
async function getSpotifyTrackDetails(trackId) {
    return callSpotifyAPI(`/v1/tracks/${trackId}`);
}
// Adicione mais funções conforme necessário para outros endpoints da API do Spotify
