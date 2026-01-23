// src/routes/reviews.ts
import { Router, Request, Response } from 'express';
import { getDatabase, saveDatabase, Review } from '../database/schema.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Helper para converter resultado do sql.js para objeto
function rowToObject(columns: string[], values: any[]): any {
    const obj: any = {};
    columns.forEach((col, i) => obj[col] = values[i]);
    return obj;
}

/**
 * GET /api/reviews
 * Lista todas as reviews (públicas)
 */
router.get('/', (req: Request, res: Response) => {
    try {
        const { album_id, user_id, limit = 20, offset = 0 } = req.query;
        const db = getDatabase();

        let query = `
            SELECT r.*, u.username, u.avatar_url as user_avatar
            FROM reviews r
            JOIN users u ON r.user_id = u.id
        `;

        if (album_id) {
            query += ` WHERE r.spotify_album_id = '${album_id}'`;
        } else if (user_id) {
            query += ` WHERE r.user_id = ${user_id}`;
        }

        query += ` ORDER BY r.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

        const result = db.exec(query);

        if (result.length === 0) {
            return res.json({ reviews: [] });
        }

        const reviews = result[0].values.map(row => rowToObject(result[0].columns, row));
        res.json({ reviews });
    } catch (error) {
        console.error('Erro ao listar reviews:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * GET /api/reviews/:id
 * Busca uma review específica
 */
router.get('/:id', (req: Request, res: Response) => {
    try {
        const db = getDatabase();
        const result = db.exec(`
            SELECT r.*, u.username, u.avatar_url as user_avatar
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.id = ${req.params.id}
        `);

        if (result.length === 0 || result[0].values.length === 0) {
            return res.status(404).json({ error: 'Review não encontrada' });
        }

        const review = rowToObject(result[0].columns, result[0].values[0]);
        res.json({ review });
    } catch (error) {
        console.error('Erro ao buscar review:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * POST /api/reviews
 * Cria uma nova review (requer autenticação)
 */
router.post('/', authenticate, (req: AuthRequest, res: Response) => {
    try {
        const { spotify_album_id, album_name, album_artist, album_cover_url, rating, review_text } = req.body;

        if (!spotify_album_id || !album_name || !album_artist || rating === undefined) {
            return res.status(400).json({
                error: 'spotify_album_id, album_name, album_artist e rating são obrigatórios'
            });
        }

        if (rating < 0 || rating > 5) {
            return res.status(400).json({ error: 'Rating deve estar entre 0 e 5' });
        }

        const db = getDatabase();

        // Verificar se já existe
        const existing = db.exec(`SELECT id FROM reviews WHERE user_id = ${req.userId} AND spotify_album_id = '${spotify_album_id}'`);
        if (existing.length > 0 && existing[0].values.length > 0) {
            return res.status(409).json({ error: 'Você já avaliou este álbum' });
        }

        db.run(`
            INSERT INTO reviews (user_id, spotify_album_id, album_name, album_artist, album_cover_url, rating, review_text)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [req.userId, spotify_album_id, album_name, album_artist, album_cover_url || null, rating, review_text || null]);

        saveDatabase();

        const idResult = db.exec(`SELECT last_insert_rowid() as id`);
        const reviewId = idResult[0].values[0][0];

        res.status(201).json({
            message: 'Review criada com sucesso',
            review: {
                id: reviewId,
                user_id: req.userId,
                spotify_album_id,
                album_name,
                album_artist,
                album_cover_url,
                rating,
                review_text
            }
        });
    } catch (error) {
        console.error('Erro ao criar review:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * PUT /api/reviews/:id
 * Atualiza uma review existente (só o autor pode)
 */
router.put('/:id', authenticate, (req: AuthRequest, res: Response) => {
    try {
        const { rating, review_text } = req.body;
        const db = getDatabase();

        // Verificar se a review existe e pertence ao usuário
        const existing = db.exec(`SELECT * FROM reviews WHERE id = ${req.params.id}`);

        if (existing.length === 0 || existing[0].values.length === 0) {
            return res.status(404).json({ error: 'Review não encontrada' });
        }

        const review = rowToObject(existing[0].columns, existing[0].values[0]);

        if (review.user_id !== req.userId) {
            return res.status(403).json({ error: 'Você não pode editar esta review' });
        }

        if (rating !== undefined && (rating < 0 || rating > 5)) {
            return res.status(400).json({ error: 'Rating deve estar entre 0 e 5' });
        }

        const newRating = rating !== undefined ? rating : review.rating;
        const newText = review_text !== undefined ? review_text : review.review_text;

        db.run(`
            UPDATE reviews
            SET rating = ?, review_text = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [newRating, newText, req.params.id]);

        saveDatabase();

        res.json({ message: 'Review atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar review:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * DELETE /api/reviews/:id
 * Deleta uma review (só o autor pode)
 */
router.delete('/:id', authenticate, (req: AuthRequest, res: Response) => {
    try {
        const db = getDatabase();

        // Verificar se a review existe e pertence ao usuário
        const existing = db.exec(`SELECT user_id FROM reviews WHERE id = ${req.params.id}`);

        if (existing.length === 0 || existing[0].values.length === 0) {
            return res.status(404).json({ error: 'Review não encontrada' });
        }

        const userId = existing[0].values[0][0];

        if (userId !== req.userId) {
            return res.status(403).json({ error: 'Você não pode deletar esta review' });
        }

        db.run(`DELETE FROM reviews WHERE id = ?`, [req.params.id]);
        saveDatabase();

        res.json({ message: 'Review deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar review:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * GET /api/reviews/album/:spotifyAlbumId/stats
 * Estatísticas de um álbum (média, total de reviews)
 */
router.get('/album/:spotifyAlbumId/stats', (req: Request, res: Response) => {
    try {
        const db = getDatabase();
        const result = db.exec(`
            SELECT 
                COUNT(*) as total_reviews,
                AVG(rating) as average_rating,
                MIN(rating) as min_rating,
                MAX(rating) as max_rating
            FROM reviews
            WHERE spotify_album_id = '${req.params.spotifyAlbumId}'
        `);

        if (result.length === 0) {
            return res.json({ stats: { total_reviews: 0, average_rating: null } });
        }

        const stats = rowToObject(result[0].columns, result[0].values[0]);
        res.json({ stats });
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
