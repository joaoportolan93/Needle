// src/routes/spotify.ts
import { Router, Request, Response } from 'express';

const router = Router();

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;

// Cache de token em memória
let cachedToken: string | null = null;
let tokenExpiry = 0;

/**
 * GET /api/spotify/token
 * Retorna um token de acesso do Spotify (Client Credentials Flow)
 * O CLIENT_SECRET nunca é exposto ao frontend!
 */
router.get('/token', async (req: Request, res: Response) => {
    try {
        // Verificar cache
        if (cachedToken && Date.now() < tokenExpiry) {
            return res.json({
                access_token: cachedToken,
                token_type: 'Bearer',
                cached: true
            });
        }

        // Buscar novo token
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
            },
            body: 'grant_type=client_credentials',
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Erro ao obter token do Spotify:', error);
            return res.status(500).json({ error: 'Falha ao obter token do Spotify' });
        }

        const data = await response.json();

        // Cachear token (com margem de 5 minutos)
        cachedToken = data.access_token;
        tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

        res.json({
            access_token: data.access_token,
            token_type: 'Bearer',
            expires_in: data.expires_in
        });
    } catch (error) {
        console.error('Erro no endpoint de token:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
