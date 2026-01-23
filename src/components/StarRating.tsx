// src/components/StarRating.tsx
import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
    value: number;
    onChange?: (rating: number) => void;
    readonly?: boolean;
    size?: 'sm' | 'md' | 'lg';
    showValue?: boolean;
}

const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
};

export function StarRating({
    value,
    onChange,
    readonly = false,
    size = 'md',
    showValue = false
}: StarRatingProps) {
    const [hoverValue, setHoverValue] = useState<number | null>(null);

    const displayValue = hoverValue ?? value;

    const handleClick = (rating: number) => {
        if (readonly || !onChange) return;
        // Permite clicar na mesma estrela para reduzir meio ponto
        if (rating === value) {
            onChange(rating - 0.5);
        } else {
            onChange(rating);
        }
    };

    const handleMouseMove = (e: React.MouseEvent<SVGElement>, starIndex: number) => {
        if (readonly) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const isHalf = x < rect.width / 2;
        setHoverValue(starIndex - (isHalf ? 0.5 : 0));
    };

    return (
        <div className="flex items-center gap-1">
            <div
                className="flex"
                onMouseLeave={() => !readonly && setHoverValue(null)}
            >
                {[1, 2, 3, 4, 5].map((starIndex) => {
                    const filled = displayValue >= starIndex;
                    const halfFilled = !filled && displayValue >= starIndex - 0.5;

                    return (
                        <Star
                            key={starIndex}
                            className={cn(
                                sizeClasses[size],
                                'transition-colors cursor-pointer',
                                readonly && 'cursor-default',
                                filled && 'fill-yellow-400 text-yellow-400',
                                halfFilled && 'text-yellow-400',
                                !filled && !halfFilled && 'text-gray-300 dark:text-gray-600'
                            )}
                            style={halfFilled ? {
                                background: 'linear-gradient(90deg, #facc15 50%, transparent 50%)',
                                WebkitBackgroundClip: 'text',
                                fill: 'currentColor',
                            } : undefined}
                            onClick={() => handleClick(starIndex)}
                            onMouseMove={(e) => handleMouseMove(e, starIndex)}
                        />
                    );
                })}
            </div>
            {showValue && (
                <span className="ml-2 text-sm font-medium text-muted-foreground">
                    {value.toFixed(1)}
                </span>
            )}
        </div>
    );
}
