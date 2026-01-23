// src/components/ReviewForm.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { StarRating } from './StarRating';
import { createReview, updateReview } from '@/services/api';
import type { Review } from '@/types/review';

interface AlbumData {
    spotify_album_id: string;
    album_name: string;
    album_artist: string;
    album_cover_url?: string;
}

interface ReviewFormProps {
    album: AlbumData;
    existingReview?: Review;
    onSuccess?: (review: Review) => void;
    onCancel?: () => void;
}

export function ReviewForm({ album, existingReview, onSuccess, onCancel }: ReviewFormProps) {
    const [rating, setRating] = useState(existingReview?.rating ?? 0);
    const [reviewText, setReviewText] = useState(existingReview?.review_text ?? '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEditing = !!existingReview;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            setError('Selecione uma nota de 1 a 5 estrelas');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            if (isEditing) {
                await updateReview(existingReview.id, {
                    rating,
                    review_text: reviewText || undefined,
                });
                onSuccess?.({ ...existingReview, rating, review_text: reviewText });
            } else {
                const result = await createReview({
                    spotify_album_id: album.spotify_album_id,
                    album_name: album.album_name,
                    album_artist: album.album_artist,
                    album_cover_url: album.album_cover_url,
                    rating,
                    review_text: reviewText || undefined,
                });
                onSuccess?.(result.review);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao salvar review');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full max-w-lg">
            <CardHeader>
                <div className="flex gap-4">
                    {album.album_cover_url && (
                        <img
                            src={album.album_cover_url}
                            alt={album.album_name}
                            className="w-20 h-20 rounded-md object-cover"
                        />
                    )}
                    <div>
                        <CardTitle className="text-lg">{album.album_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{album.album_artist}</p>
                    </div>
                </div>
            </CardHeader>

            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Sua nota
                        </label>
                        <StarRating
                            value={rating}
                            onChange={setRating}
                            size="lg"
                            showValue
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Sua crítica (opcional)
                        </label>
                        <Textarea
                            placeholder="O que você achou desse álbum?"
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            rows={4}
                            maxLength={2000}
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                            {reviewText.length}/2000
                        </p>
                    </div>

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                </CardContent>

                <CardFooter className="flex gap-2 justify-end">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancelar
                        </Button>
                    )}
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar' : 'Publicar'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
