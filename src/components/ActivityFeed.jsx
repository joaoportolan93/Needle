import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Carrega todas as avaliações e ordena por data
    const loadActivities = () => {
      setIsLoading(true);
      const allActivities = [];

      // Carregar avaliações
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sonora-review-')) {
          try {
            const reviewData = JSON.parse(localStorage.getItem(key));
            if (reviewData && reviewData.itemId) {
              allActivities.push({
                ...reviewData,
                type: 'review',
                activityDate: new Date(reviewData.date)
              });
            }
          } catch (error) {
            console.error("Erro ao parsear activity do localStorage:", key, error);
          }
        }
      }

      // Carregar favoritos
      const favorites = JSON.parse(localStorage.getItem('sonora-favorites') || '[]');
      favorites.forEach(favorite => {
        allActivities.push({
          id: `favorite-${favorite.id}`,
          type: 'favorite',
          itemId: favorite.id,
          itemName: favorite.name,
          itemArtist: favorite.artist,
          itemCoverUrl: favorite.coverUrl,
          activityDate: new Date(favorite.addedAt)
        });
      });

      // Carregar watchlist
      const watchlist = JSON.parse(localStorage.getItem('sonora-watchlist') || '[]');
      watchlist.forEach(item => {
        allActivities.push({
          id: `watchlist-${item.id}`,
          type: 'watchlist',
          itemId: item.id,
          itemName: item.name,
          itemArtist: item.artist,
          itemCoverUrl: item.coverUrl,
          activityDate: new Date(item.addedAt)
        });
      });

      // Ordenar por data (mais recente primeiro)
      allActivities.sort((a, b) => b.activityDate - a.activityDate);
      
      // Pegar os 10 mais recentes
      setActivities(allActivities.slice(0, 10));
      setIsLoading(false);
    };

    loadActivities();
  }, []);

  if (isLoading) {
    return (
      <div className="py-4 text-center">
        <p>Carregando atividades...</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="py-4 text-center">
        <p>Nenhuma atividade encontrada. Comece a avaliar músicas e álbuns!</p>
      </div>
    );
  }

  const getActivityText = (activity) => {
    switch (activity.type) {
      case 'review':
        return `Avaliou ${activity.itemName} com ${activity.rating} estrelas`;
      case 'favorite':
        return `Adicionou ${activity.itemName} aos favoritos`;
      case 'watchlist':
        return `Adicionou ${activity.itemName} à lista "Quero Ouvir"`;
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {activities.map(activity => (
        <div key={activity.id} className="bg-gray-800 p-4 rounded-lg shadow flex">
          <Link to={`/item/${activity.itemId}`} className="shrink-0">
            <img 
              src={activity.itemCoverUrl || `https://via.placeholder.com/60`} 
              alt={activity.itemName} 
              className="w-16 h-16 rounded mr-4 object-cover"
            />
          </Link>
          
          <div className="flex-grow">
            <p className="font-medium">
              <span className="text-green-400">Usuário Sonora</span> {getActivityText(activity)}
            </p>
            
            <div className="flex items-center mt-1">
              <Link to={`/item/${activity.itemId}`} className="text-gray-300 hover:text-white hover:underline">
                {activity.itemName}
              </Link>
              <span className="mx-1 text-gray-500">•</span>
              <span className="text-gray-400">{activity.itemArtist}</span>
            </div>
            
            {activity.type === 'review' && activity.reviewText && (
              <p className="text-gray-300 mt-2 text-sm italic">"{activity.reviewText.substring(0, 100)}{activity.reviewText.length > 100 ? '...' : ''}"</p>
            )}
            
            {activity.type === 'review' && activity.tags && activity.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {activity.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-gray-700 rounded-full text-xs text-gray-300">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="text-right shrink-0 text-sm text-gray-500">
            {new Date(activity.activityDate).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityFeed; 