// src/components/ReviewCard.tsx
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StarRating } from './StarRating';
import type { Review } from '@/types/review';

interface ReviewCardProps {
    review: Review;
    currentUserId?: number;
    onEdit?: (review: Review) => void;
    onDelete?: (review: Review) => void;
    showAlbum?: boolean;
}

export function ReviewCard({
    review,
    currentUserId,
    onEdit,
    onDelete,
    showAlbum = true
}: ReviewCardProps) {
    const isOwner = currentUserId === review.user_id;

    const timeAgo = formatDistanceToNow(new Date(review.created_at), {
        addSuffix: true,
        locale: ptBR,
    });

    return (
        <Card className="w-full">
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        {showAlbum && review.album_cover_url && (
                            <img
                                src={review.album_cover_url}
                                alt={review.album_name}
                                className="w-12 h-12 rounded object-cover"
                            />
                        )}
                        <div>
                            {showAlbum && (
                                <>
                                    <p className="font-semibold">{review.album_name}</p>
                                    <p className="text-sm text-muted-foreground">{review.album_artist}</p>
                                </>
                            )}
                        </div>
                    </div>

                    <StarRating value={review.rating} readonly size="sm" showValue />
                </div>
            </CardHeader>

            <CardContent>
                {review.review_text && (
                    <p className="text-sm mb-4 whitespace-pre-wrap">{review.review_text}</p>
                )}

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                            <AvatarImage src={review.user_avatar || undefined} />
                            <AvatarFallback>
                                {review.username?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                            {review.username} • {timeAgo}
                        </span>
                    </div>

                    {isOwner && (
                        <div className="flex gap-1">
                            {onEdit && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onEdit(review)}
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>
                            )}
                            {onDelete && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onDelete(review)}
                                >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
