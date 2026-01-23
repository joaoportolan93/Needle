// src/services/spotifyAPI.ts

// Utiliza variáveis de ambiente para as credenciais
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

let accessToken = "";
let tokenExpirationTime = 0;
let isRefreshingToken = false;
let tokenRefreshPromise: Promise<string> | null = null;

/**
 * Obtém um token de acesso da API do Spotify usando o fluxo de Client Credentials.
 * Gerencia o token em cache e sua expiração.
 */
async function getSpotifyAccessToken(forceRefresh = false): Promise<string> {
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
        console.error("Client ID ou Client Secret do Spotify não configurados nas variáveis de ambiente.");
        throw new Error("Credenciais do Spotify não configuradas.");
    }
    
    // Se o token é válido e não é forçada uma atualização, use o cache
    if (!forceRefresh && accessToken && Date.now() < tokenExpirationTime) {
        console.log("Usando token de acesso do Spotify em cache.");
        return accessToken;
    }

    // Se já estiver atualizando o token, espere pela promessa existente
    if (isRefreshingToken && tokenRefreshPromise) {
        return tokenRefreshPromise;
    }

    // Inicia processo de renovação do token
    console.log("Obtendo novo token de acesso do Spotify...");
    isRefreshingToken = true;

    // Armazena a promessa para que múltiplas chamadas utilizem a mesma
    tokenRefreshPromise = (async () => {
        try {
            const response = await fetch("https://accounts.spotify.com/api/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": "Basic " + btoa(SPOTIFY_CLIENT_ID + ":" + SPOTIFY_CLIENT_SECRET),
                },
                body: "grant_type=client_credentials",
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: response.statusText }));
                console.error("Erro ao obter token de acesso do Spotify:", errorData);
                throw new Error(`Falha ao obter token de acesso do Spotify: ${errorData.error || response.statusText}`);
            }

            const data = await response.json();
            accessToken = data.access_token;
            // Subtrai 5 minutos (300s) para renovar antes de expirar
            tokenExpirationTime = Date.now() + (data.expires_in - 300) * 1000;

            console.log("Novo token de acesso do Spotify obtido com sucesso.");
            return accessToken;
        } catch (error) {
            console.error("Erro fatal ao obter token:", error);
            accessToken = "";
            tokenExpirationTime = 0;
            throw error;
        } finally {
            isRefreshingToken = false;
            tokenRefreshPromise = null;
        }
    })();

    return tokenRefreshPromise;
}

/**
 * Função genérica para fazer chamadas à API do Spotify.
 * Inclui lógica de retry para erros de autenticação.
 */
async function callSpotifyAPI(endpoint: string, method: string = "GET", body: any = null, retryCount = 0): Promise<any> {
    const maxRetries = 2; // Número máximo de tentativas
    
    try {
        const token = await getSpotifyAccessToken();
        const headers: HeadersInit = {
            "Authorization": `Bearer ${token}`,
        };

        const config: RequestInit = {
            method,
            headers,
        };

        if (body && (method === "POST" || method === "PUT")) {
            headers["Content-Type"] = "application/json";
            config.body = JSON.stringify(body);
        }

        const response = await fetch(`https://api.spotify.com${endpoint}`, config);

        if (!response.ok) {
            // Tenta extrair informações do erro
            const errorData = await response.json().catch(() => ({ 
                status: response.status,
                message: response.statusText 
            }));
            
            // Se for erro de autenticação e ainda não atingimos o limite de retries
            if (response.status === 401 && retryCount < maxRetries) {
                console.warn(`Erro de autenticação na API do Spotify. Tentando renovar o token... (Tentativa ${retryCount + 1})`);
                await getSpotifyAccessToken(true); // Força renovação do token
                return callSpotifyAPI(endpoint, method, body, retryCount + 1);
            }
            
            console.error(`Erro ao chamar API do Spotify (${endpoint}):`, errorData);
            throw new Error(`Falha na chamada à API do Spotify (${endpoint}): ${errorData.error?.message || errorData.message || response.statusText}`);
        }
        
        if (response.status === 204) {
            return null;
        }

        return response.json();
    } catch (error) {
        console.error(`Erro ao chamar API do Spotify (${endpoint}):`, error);
        throw error;
    }
}

export async function searchSpotify(query: string, types: string[] = ["album", "artist", "track"]) {
    if (!query.trim()) {
        throw new Error("Termo de busca vazio");
    }
    const typeString = types.join(",");
    return callSpotifyAPI(`/v1/search?q=${encodeURIComponent(query)}&type=${typeString}`);
}

export async function getSpotifyAlbumDetails(albumId: string) {
    if (!albumId) {
        throw new Error("ID do álbum não fornecido");
    }
    return callSpotifyAPI(`/v1/albums/${albumId}`);
}

export async function getSpotifyArtistDetails(artistId: string) {
    if (!artistId) {
        throw new Error("ID do artista não fornecido");
    }
    return callSpotifyAPI(`/v1/artists/${artistId}`);
}

export async function getSpotifyArtistTopTracks(artistId: string, market: string = "BR") {
    if (!artistId) {
        throw new Error("ID do artista não fornecido");
    }
    return callSpotifyAPI(`/v1/artists/${artistId}/top-tracks?market=${market}`);
}

export async function getSpotifyArtistAlbums(artistId: string, include_groups: string = "album,single", limit: number = 20) {
    if (!artistId) {
        throw new Error("ID do artista não fornecido");
    }
    return callSpotifyAPI(`/v1/artists/${artistId}/albums?include_groups=${include_groups}&limit=${limit}`);
}

export async function getSpotifyNewReleases(limit: number = 20, offset: number = 0) {
    return callSpotifyAPI(`/v1/browse/new-releases?limit=${limit}&offset=${offset}`);
}

export async function getSpotifyCategories(limit: number = 20, offset: number = 0, country: string = "BR") {
    return callSpotifyAPI(`/v1/browse/categories?limit=${limit}&offset=${offset}&country=${country}`);
}

export async function getSpotifyCategoryPlaylists(categoryId: string, limit: number = 20, offset: number = 0, country: string = "BR") {
    if (!categoryId) {
        throw new Error("ID da categoria não fornecido");
    }
    return callSpotifyAPI(`/v1/browse/categories/${categoryId}/playlists?limit=${limit}&offset=${offset}&country=${country}`);
}

export async function getSpotifyTrackDetails(trackId: string) {
    if (!trackId) {
        throw new Error("ID da faixa não fornecido");
    }
    return callSpotifyAPI(`/v1/tracks/${trackId}`);
}

