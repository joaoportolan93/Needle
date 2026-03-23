import React, { useState, useEffect } from 'react';
import ReviewCard from './ReviewCard';
import { useAuth } from '../contexts/AuthContext';
import { getActivityFeed } from '../services/api';
import { useTranslation } from 'react-i18next';

const ActivityFeed = () => {
  const { user: currentUser } = useAuth();
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const loadActivities = async () => {
      setIsLoading(true);

      try {
        // Try fetching from backend API first (includes bot users + all DB reviews)
        const feedData = await getActivityFeed(15);

        if (feedData && feedData.length > 0) {
          // Transform API data to match ReviewCard's expected shape
          const transformed = feedData.map(review => ({
            id: `api-${review.id}`,
            type: 'review',
            itemId: review.album_spotify_id,
            itemName: review.album?.name || 'Álbum',
            itemArtist: review.album?.artist_name || '',
            itemCoverUrl: review.album?.cover_url,
            rating: review.rating,
            reviewText: review.review_text,
            activityDate: new Date(review.created_at),
            user: {
              username: review.user?.username,
              avatar: review.user?.avatar_url,
              avatar_url: review.user?.avatar_url,
              name: review.user?.username,
            },
            likes: review.likes_count || 0,
            comments: 0,
          }));
          setActivities(transformed);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.log('Feed API não disponível, usando dados locais:', err.message);
      }

      // Fallback: load from localStorage (same as before)
      const allActivities = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('needle-review-')) {
          try {
            const reviewData = JSON.parse(localStorage.getItem(key));
            if (reviewData && reviewData.itemId) {
              allActivities.push({
                ...reviewData,
                type: 'review',
                activityDate: new Date(reviewData.date),
                user: reviewData.user || {
                  username: currentUser?.username,
                  avatar: currentUser?.avatar_url,
                },
              });
            }
          } catch (error) {
            console.error("Erro ao parsear activity do localStorage:", key, error);
          }
        }
      }

      const favorites = JSON.parse(localStorage.getItem('needle-favorites') || '[]');
      favorites.forEach(favorite => {
        allActivities.push({
          id: `favorite-${favorite.id}`,
          type: 'favorite',
          itemId: favorite.id,
          itemName: favorite.name,
          itemArtist: favorite.artist,
          itemCoverUrl: favorite.coverUrl,
          activityDate: new Date(favorite.addedAt),
          user: { username: currentUser?.username, avatar: currentUser?.avatar_url },
        });
      });

      const watchlist = JSON.parse(localStorage.getItem('needle-watchlist') || '[]');
      watchlist.forEach(item => {
        allActivities.push({
          id: `watchlist-${item.id}`,
          type: 'watchlist',
          itemId: item.id,
          itemName: item.name,
          itemArtist: item.artist,
          itemCoverUrl: item.coverUrl,
          activityDate: new Date(item.addedAt),
          user: { username: currentUser?.username, avatar: currentUser?.avatar_url },
        });
      });

      allActivities.sort((a, b) => b.activityDate - a.activityDate);

      // Mock data if nothing exists
      if (allActivities.length === 0) {
        allActivities.push(
          {
            id: 'mock-1',
            type: 'review',
            itemId: 'mock-album-1',
            itemName: 'Wuthering Heights',
            itemArtist: 'Kate Bush',
            itemCoverUrl: 'https://i.scdn.co/image/ab67616d0000b2738b7447db378b27c622a8677c',
            rating: 5,
            reviewText: "Emily Brontë died of tuberculosis 177 years ago yet this adaptation is still the worst thing that has ever happened to her.",
            activityDate: new Date(),
            user: { name: "allain", avatar: "https://i.pravatar.cc/150?u=allain" },
            likes: 47458,
            comments: 124,
          },
          {
            id: 'mock-2',
            type: 'review',
            itemId: 'mock-album-2',
            itemName: 'The Dark Side of the Moon',
            itemArtist: 'Pink Floyd',
            itemCoverUrl: 'https://i.scdn.co/image/ab67616d0000b27329188d3e9c402123d8c1be1a',
            rating: 5,
            reviewText: "There is no dark side of the moon really. Matter of fact it's all dark.",
            activityDate: new Date('2025-04-10'),
            user: { name: "PortoGraffitti", avatar: "https://i.pravatar.cc/150?u=porno" },
            likes: 120,
            comments: 4,
          }
        );
      }

      setActivities(allActivities.slice(0, 15));
      setIsLoading(false);
    };

    loadActivities();
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="py-4 text-center">
        <p className="text-muted-foreground">{t('activity.loading')}</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-muted-foreground">{t('activity.noActivity')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map(activity => (
        <ReviewCard key={activity.id} activity={activity} />
      ))}
    </div>
  );
};

export default ActivityFeed;