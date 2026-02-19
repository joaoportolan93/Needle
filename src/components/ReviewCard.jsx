import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, MessageCircle, Clock, Bookmark } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ReviewCard = ({ activity }) => {
    const {
        type,
        itemId,
        itemName,
        itemArtist,
        itemCoverUrl,
        rating,
        reviewText,
        activityDate,
        user,
        likes = 0,
        comments = 0
    } = activity;

    const renderStars = (rating) => {
        return (
            <div className="flex text-green-500 gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        size={14}
                        fill={i < rating ? "currentColor" : "none"}
                        className={i < rating ? "text-green-500" : "text-muted-foreground/50"}
                    />
                ))}
            </div>
        );
    };

    const formattedDate = new Date(activityDate).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    let borderClass = 'border-l-4 border-border';
    let actionText = '';
    let ActionIcon = null;

    if (type === 'review') {
        borderClass = 'border-l-4 border-l-green-500';
    } else if (type === 'watchlist') {
        borderClass = 'border-l-4 border-l-blue-500';
        actionText = "Adicionou à lista 'Quero Ouvir'";
        ActionIcon = Clock;
    } else if (type === 'favorite') {
        borderClass = 'border-l-4 border-l-pink-500';
        actionText = "Adicionou aos Favoritos";
        ActionIcon = Heart;
    }

    return (
        <div className={`flex gap-4 p-4 bg-card/50 hover:bg-card transition-colors rounded-r-lg shadow-sm ${borderClass} group relative overflow-hidden`}>

            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-foreground/5 to-transparent rounded-bl-full pointer-events-none -z-10 group-hover:from-foreground/10 transition-all"></div>

            {/* Left: Poster */}
            <div className="shrink-0 relative">
                <Link to={`/item/${itemId}`}>
                    <img
                        src={itemCoverUrl || "https://via.placeholder.com/150"}
                        alt={itemName}
                        className="w-[70px] h-[105px] object-cover rounded shadow-md hover:scale-105 transition-transform duration-300"
                    />
                </Link>
                {/* Type Icon Badge on Poster */}
                <div className="absolute -top-2 -left-2 bg-card rounded-full p-1 shadow border border-border">
                    {type === 'review' && <MessageCircle size={12} className="text-green-500" />}
                    {type === 'watchlist' && <Clock size={12} className="text-blue-500" />}
                    {type === 'favorite' && <Heart size={12} className="text-pink-500 fill-pink-500" />}
                </div>
            </div>

            {/* Right: Content */}
            <div className="flex-grow flex flex-col gap-1 min-w-0">
                {/* Header: User and Action */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Link
                        to={`/profile/${user?.username || user?.name || 'user'}`}
                        className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                        <Avatar className="w-5 h-5 ring-1 ring-border">
                            <AvatarImage src={user?.avatar || user?.avatar_url} />
                            <AvatarFallback className="text-[9px] bg-indigo-900 text-indigo-100">U</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-foreground/80 hover:text-green-400 transition-colors">{user?.username || user?.name || 'Usuário'}</span>
                    </Link>

                    {/* Action Text for non-reviews */}
                    {type !== 'review' && (
                        <span className="text-xs text-muted-foreground/70 flex items-center gap-1 opacity-75">
                            {ActionIcon && <ActionIcon size={10} />}
                            {actionText}
                        </span>
                    )}
                </div>

                {/* Title and Rating */}
                <div className="flex flex-col">
                    <Link to={`/item/${itemId}`} className="text-lg font-bold text-foreground hover:text-indigo-400 transition-colors leading-tight truncate">
                        {itemName}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{itemArtist}</span>
                        {type === 'review' && rating > 0 && (
                            <>
                                <span className="text-border">•</span>
                                {renderStars(rating)}
                            </>
                        )}
                    </div>
                </div>

                {/* Review Text */}
                {type === 'review' && reviewText && (
                    <div className="mt-2">
                        <p className="text-muted-foreground text-[15px] leading-relaxed font-review text-opacity-90 line-clamp-3 italic relative pl-2 border-l-2 border-border">
                            "{reviewText}"
                        </p>
                    </div>
                )}

                {/* Footer: Date & Interactions */}
                <div className="mt-auto pt-2 flex items-center justify-between text-xs text-muted-foreground/70">
                    <div className="flex items-center gap-3">
                        {type === 'review' && (
                            <>
                                <button className="flex items-center gap-1 hover:text-pink-500 transition-colors group/like">
                                    <Heart size={14} className="group-hover/like:fill-pink-500" />
                                    <span>{likes}</span>
                                </button>
                                <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                                    <MessageCircle size={14} />
                                    <span>{comments}</span>
                                </button>
                            </>
                        )}
                    </div>

                    <span className="opacity-60 font-mono">{formattedDate}</span>
                </div>
            </div>
        </div>
    );
};

export default ReviewCard;
