import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ProfilePage = () => {
  const [userReviews, setUserReviews] = useState([]);
  const [userFavorites, setUserFavorites] = useState([]);
  const [userWatchlist, setUserWatchlist] = useState([]);
  const [activeTab, setActiveTab] = useState('reviews');
  const [showStats, setShowStats] = useState(false);
  const [userStats, setUserStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    topGenres: [],
    recentActivity: [],
    ratingDistribution: [0, 0, 0, 0, 0] // Para estrelas 1-5
  });

  const mockUser = {
    name: 'Usuário Sonora',
    avatarUrl: 'https://via.placeholder.com/150/1DB954/FFFFFF?text=U',
    joinDate: 'Maio de 2024',
    // Stats will be updated dynamically
  };

  useEffect(() => {
    // Load reviews
    const reviews = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sonora-review-')) {
        try {
          const reviewData = JSON.parse(localStorage.getItem(key));
          if (reviewData && reviewData.itemId) {
            reviews.push(reviewData);
          }
        } catch (error) {
          console.error("Erro ao parsear review do localStorage:", key, error);
        }
      }
    }
    setUserReviews(reviews);

    // Load favorites
    const favoritesData = JSON.parse(localStorage.getItem('sonora-favorites') || '[]');
    setUserFavorites(favoritesData);

    // Load watchlist
    const watchlistData = JSON.parse(localStorage.getItem('sonora-watchlist') || '[]');
    setUserWatchlist(watchlistData);

    // Calculate user statistics
    calculateUserStats(reviews);

  }, []);

  const calculateUserStats = (reviews) => {
    if (reviews.length === 0) {
      return;
    }

    // Calcular média de avaliações
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Contar distribuição de avaliações (1-5 estrelas)
    const ratingDistribution = [0, 0, 0, 0, 0];
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        ratingDistribution[review.rating - 1]++;
      }
    });

    // Extrair e contar tags para determinar gêneros mais comuns
    const tagCounts = {};
    reviews.forEach(review => {
      if (review.tags && review.tags.length > 0) {
        review.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    const topGenres = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre, count]) => ({ genre, count }));

    // Obter atividade recente (últimas 5 avaliações)
    const recentActivity = [...reviews]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    setUserStats({
      totalReviews: reviews.length,
      averageRating,
      topGenres,
      recentActivity,
      ratingDistribution
    });
  };

  const renderItemGrid = (items, emptyMessage) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
      {items.length > 0 ? (
        items.map((item, index) => (
          <div key={item.id || index} className="bg-gray-800 p-4 rounded-lg shadow">
            <Link to={`/item/${item.itemId || item.id}`} className="block">
              <img 
                src={item.itemCoverUrl || item.coverUrl || `https://via.placeholder.com/150/14181C/E1E1E1?text=${item.itemName || item.name || 'Capa'}`}
                alt={`Capa de ${item.itemName || item.name}`}
                className="w-full h-40 object-cover rounded-md mb-2"
              />
              <h3 className="text-lg font-semibold truncate text-white">{item.itemName || item.name}</h3>
              <p className="text-sm text-gray-400 truncate">{item.itemArtist || item.artist}</p>
            </Link>
            {/* Specific info for reviews */}
            {item.rating !== undefined && (
              <div className="mt-2">
                <p className="text-yellow-400">{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</p>
                {item.listenDate && <p className="text-xs text-gray-500 mt-1">Ouvido em: {new Date(item.listenDate).toLocaleDateString()}</p>}
                {item.reviewText && <p className="text-sm text-gray-300 mt-1 truncate">"{item.reviewText}"</p>}
              </div>
            )}
          </div>
        ))
      ) : (
        <p className="text-gray-400 col-span-full">{emptyMessage}</p>
      )}
    </div>
  );

  const renderReviews = () => renderItemGrid(userReviews, "Você ainda não fez nenhum review.");
  const renderFavorites = () => renderItemGrid(userFavorites, "Você ainda não adicionou nenhum favorito.");
  const renderWatchlist = () => renderItemGrid(userWatchlist, "Sua lista 'Quero Ouvir' está vazia.");
  
  const renderStats = () => (
    <div className="mt-4">
      {userReviews.length === 0 ? (
        <p className="text-gray-400">Nenhuma estatística disponível. Faça algumas avaliações primeiro!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Estatísticas Gerais */}
          <div className="bg-gray-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-800">Estatísticas Gerais</h3>
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm">Avaliação Média</p>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-yellow-400">
                    {userStats.averageRating.toFixed(1)}
                  </span>
                  <span className="text-yellow-400 ml-2">
                    {'★'.repeat(Math.floor(userStats.averageRating))}
                    {userStats.averageRating % 1 >= 0.5 ? '½' : ''}
                    {'☆'.repeat(5 - Math.ceil(userStats.averageRating))}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">Distribuição de Avaliações</p>
                <div className="mt-2 space-y-2">
                  {userStats.ratingDistribution.map((count, index) => (
                    <div key={index} className="flex items-center">
                      <span className="text-sm w-8">{index + 1}★</span>
                      <div className="flex-grow mx-2 bg-gray-800 rounded-full h-3">
                        <div 
                          className="bg-green-600 h-3 rounded-full" 
                          style={{ width: `${(count / userStats.totalReviews) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Gêneros Favoritos */}
          <div className="bg-gray-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-800">Seus Gêneros Favoritos</h3>
            {userStats.topGenres.length > 0 ? (
              <div className="space-y-3">
                {userStats.topGenres.map(({ genre, count }) => (
                  <div key={genre} className="flex items-center">
                    <span className="truncate flex-grow">{genre}</span>
                    <div className="ml-2 bg-green-600 px-2 py-1 rounded-full text-xs">
                      {count}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">Adicione tags às suas avaliações para ver seus gêneros favoritos!</p>
            )}
          </div>
          
          {/* Atividade Recente */}
          <div className="bg-gray-900 p-4 rounded-lg md:col-span-2">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-800">Atividade Recente</h3>
            {userStats.recentActivity.length > 0 ? (
              <div className="space-y-2">
                {userStats.recentActivity.map(activity => (
                  <div key={activity.id} className="flex items-center p-2 hover:bg-gray-800 rounded">
                    <img 
                      src={activity.itemCoverUrl || `https://via.placeholder.com/40`} 
                      alt={activity.itemName} 
                      className="w-10 h-10 rounded mr-3"
                    />
                    <div className="flex-grow">
                      <p className="font-medium">{activity.itemName}</p>
                      <p className="text-sm text-gray-400">{activity.itemArtist}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-400">{'★'.repeat(activity.rating)}</p>
                      <p className="text-xs text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">Nenhuma atividade recente encontrada.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
  
  return (
    <div className="p-4 max-w-6xl mx-auto text-white">
      <div className="flex flex-col md:flex-row items-center md:items-end bg-gray-800 p-6 rounded-lg shadow-lg mb-6">
        <img src={mockUser.avatarUrl} alt="Avatar do Usuário" className="w-32 h-32 rounded-full border-4 border-gray-700 mb-4 md:mb-0 md:mr-6" />
        <div className="text-center md:text-left flex-grow">
          <h1 className="text-3xl font-bold">{mockUser.name}</h1>
          <p className="text-gray-400">Membro desde {mockUser.joinDate}</p>
          <div className="mt-2 flex space-x-4 justify-center md:justify-start">
            <div className="text-center">
              <p className="text-xl font-semibold">{userReviews.length}</p>
              <p className="text-xs text-gray-500">Reviews</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold">{userFavorites.length}</p>
              <p className="text-xs text-gray-500">Favoritos</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold">{userWatchlist.length}</p>
              <p className="text-xs text-gray-500">Quero Ouvir</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowStats(!showStats)} 
          className="mt-4 md:mt-0 md:ml-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          {showStats ? 'Esconder Estatísticas' : 'Ver Estatísticas'}
        </button>
      </div>

      {/* Estatísticas - visíveis apenas quando o botão é clicado */}
      {showStats && (
        <div className="mb-6 bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-700">Suas Estatísticas de Escuta</h2>
          {renderStats()}
        </div>
      )}

      <div className="mb-6 border-b border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm 
              ${activeTab === 'reviews' ? 'border-green-500 text-green-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}
            `}
          >
            Reviews ({userReviews.length})
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm 
              ${activeTab === 'favorites' ? 'border-green-500 text-green-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}
            `}
          >
            Favoritos ({userFavorites.length})
          </button>
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm 
              ${activeTab === 'watchlist' ? 'border-green-500 text-green-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}
            `}
          >
            Quero Ouvir ({userWatchlist.length})
          </button>
        </nav>
      </div>

      <div>
        {activeTab === 'reviews' && renderReviews()}
        {activeTab === 'favorites' && renderFavorites()}
        {activeTab === 'watchlist' && renderWatchlist()}
      </div>
    </div>
  );
};

export default ProfilePage;

