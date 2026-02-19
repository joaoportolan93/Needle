import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, getUserReviews, getUserLists } from '../services/api';
import { Star, Music, Users, ListMusic, Loader2 } from 'lucide-react';

const ProfilePage = () => {
  const { username: routeUsername } = useParams();
  const { user: currentUser } = useAuth();

  // Determine if we're viewing someone else's profile or our own
  const isOwnProfile = !routeUsername || routeUsername === currentUser?.username;

  const [profileUser, setProfileUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [lists, setLists] = useState([]);
  const [activeTab, setActiveTab] = useState('reviews');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // For own profile: local data
  const [userFavorites, setUserFavorites] = useState([]);
  const [userWatchlist, setUserWatchlist] = useState([]);
  const [showStats, setShowStats] = useState(false);
  const [userStats, setUserStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: [0, 0, 0, 0, 0],
  });

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (isOwnProfile && currentUser) {
          // Own profile: use auth context + localStorage
          setProfileUser({
            id: currentUser.id,
            username: currentUser.username,
            avatar_url: currentUser.avatar_url,
            bio: currentUser.bio,
            created_at: currentUser.created_at,
            followers_count: 0,
            following_count: 0,
            reviews_count: 0,
          });

          // Load localStorage data
          const localReviews = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('sonora-review-')) {
              try {
                const reviewData = JSON.parse(localStorage.getItem(key));
                if (reviewData && reviewData.itemId) localReviews.push(reviewData);
              } catch (e) { /* ignore */ }
            }
          }
          setReviews(localReviews);
          calculateStats(localReviews);

          setUserFavorites(JSON.parse(localStorage.getItem('sonora-favorites') || '[]'));
          setUserWatchlist(JSON.parse(localStorage.getItem('sonora-watchlist') || '[]'));

          // Also load lists from API if user has ID
          if (currentUser.id) {
            try {
              const userLists = await getUserLists(currentUser.id);
              setLists(userLists);
            } catch (e) { /* ok */ }
          }
        } else if (routeUsername) {
          // Public profile: fetch from API
          const profile = await getUserProfile(routeUsername);
          setProfileUser(profile);

          // Fetch user reviews from API
          const userReviews = await getUserReviews(profile.id, 50);
          setReviews(userReviews);

          // Fetch user lists from API
          const userLists = await getUserLists(profile.id);
          setLists(userLists);
        }
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
        setError(err.message || 'Usuário não encontrado');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [routeUsername, currentUser, isOwnProfile]);

  const calculateStats = (reviewList) => {
    if (reviewList.length === 0) return;
    const totalRating = reviewList.reduce((sum, r) => sum + (r.rating || 0), 0);
    const avg = totalRating / reviewList.length;
    const dist = [0, 0, 0, 0, 0];
    reviewList.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) dist[Math.floor(r.rating) - 1]++;
    });
    setUserStats({ totalReviews: reviewList.length, averageRating: avg, ratingDistribution: dist });
  };

  // ─── Loading & Error states ───
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-green-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Users size={48} className="text-muted-foreground/40 mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Perfil não encontrado</h2>
        <p className="text-muted-foreground">{error}</p>
        <Link to="/" className="mt-4 text-green-400 hover:underline">← Voltar ao início</Link>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Users size={48} className="text-muted-foreground/40 mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Faça login para ver seu perfil</h2>
        <Link to="/login" className="mt-2 text-green-400 hover:underline">Entrar</Link>
      </div>
    );
  }

  const avatarUrl = profileUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUser.username}`;
  const joinDate = profileUser.created_at
    ? new Date(profileUser.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : 'Recente';

  // ─── Review card for API reviews (public profile) ───
  const renderApiReview = (review) => (
    <div key={review.id} className="bg-card p-4 rounded-lg shadow border border-border">
      <Link to={`/item/${review.album_spotify_id}`} className="block">
        <img
          src={review.album?.cover_url || `https://via.placeholder.com/150/14181C/E1E1E1?text=Álbum`}
          alt={review.album?.name}
          className="w-full h-40 object-cover rounded-md mb-2"
          loading="lazy"
        />
        <h3 className="text-lg font-semibold truncate text-foreground">{review.album?.name || 'Álbum'}</h3>
        <p className="text-sm text-muted-foreground truncate">{review.album?.artist_name}</p>
      </Link>
      <div className="mt-2">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={14}
              fill={i < Math.floor(review.rating || 0) ? "currentColor" : "none"}
              className={i < Math.floor(review.rating || 0) ? "text-yellow-400" : "text-muted-foreground/30"}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1">{review.rating}</span>
        </div>
        {review.review_text && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">"{review.review_text}"</p>
        )}
        <p className="text-xs text-muted-foreground/60 mt-1">
          {new Date(review.created_at).toLocaleDateString('pt-BR')}
        </p>
      </div>
    </div>
  );

  // ─── Review card for localStorage reviews (own profile) ───
  const renderLocalReview = (item, index) => (
    <div key={item.id || index} className="bg-card p-4 rounded-lg shadow border border-border">
      <Link to={`/item/${item.itemId || item.id}`} className="block">
        <img
          src={item.itemCoverUrl || item.coverUrl || `https://via.placeholder.com/150/14181C/E1E1E1?text=${item.itemName || item.name || 'Capa'}`}
          alt={`Capa de ${item.itemName || item.name}`}
          className="w-full h-40 object-cover rounded-md mb-2"
        />
        <h3 className="text-lg font-semibold truncate text-foreground">{item.itemName || item.name}</h3>
        <p className="text-sm text-muted-foreground truncate">{item.itemArtist || item.artist}</p>
      </Link>
      {item.rating !== undefined && (
        <div className="mt-2">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} fill={i < item.rating ? "currentColor" : "none"} className={i < item.rating ? "text-yellow-400" : "text-muted-foreground/30"} />
            ))}
          </div>
          {item.reviewText && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">"{item.reviewText}"</p>}
        </div>
      )}
    </div>
  );

  // ─── List card ───
  const renderListCard = (list) => {
    const covers = (list.items || []).slice(0, 4).map(i => i.album?.cover_url).filter(Boolean);
    while (covers.length < 4) covers.push(null);

    return (
      <div key={list.id} className="bg-card rounded-lg shadow border border-border overflow-hidden">
        <div className="grid grid-cols-2 grid-rows-2 aspect-square">
          {covers.slice(0, 4).map((url, i) => (
            <div key={i} className="overflow-hidden">
              {url ? (
                <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <Music size={14} className="text-muted-foreground/30" />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-foreground truncate">{list.title}</h3>
          <p className="text-xs text-muted-foreground">{list.items_count} álbuns</p>
          {list.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{list.description}</p>
          )}
        </div>
      </div>
    );
  };

  // ─── Tab definitions ───
  const tabs = isOwnProfile
    ? [
      { key: 'reviews', label: `Reviews (${reviews.length})` },
      { key: 'lists', label: `Listas (${lists.length})` },
      { key: 'favorites', label: `Favoritos (${userFavorites.length})` },
      { key: 'watchlist', label: `Quero Ouvir (${userWatchlist.length})` },
    ]
    : [
      { key: 'reviews', label: `Reviews (${reviews.length})` },
      { key: 'lists', label: `Listas (${lists.length})` },
    ];

  return (
    <div className="p-4 max-w-6xl mx-auto text-foreground">
      {/* ─── Profile Header ─── */}
      <div className="flex flex-col md:flex-row items-center md:items-end bg-card p-6 rounded-lg shadow-lg mb-6 border border-border">
        <img
          src={avatarUrl}
          alt={`Avatar de ${profileUser.username}`}
          className="w-32 h-32 rounded-full border-4 border-border mb-4 md:mb-0 md:mr-6 object-cover"
        />
        <div className="text-center md:text-left flex-grow">
          <h1 className="text-3xl font-bold">{profileUser.username}</h1>
          {profileUser.bio && (
            <p className="text-muted-foreground mt-1 text-sm max-w-lg">{profileUser.bio}</p>
          )}
          <p className="text-muted-foreground text-xs mt-1">Membro desde {joinDate}</p>
          <div className="mt-3 flex space-x-6 justify-center md:justify-start">
            <div className="text-center">
              <p className="text-xl font-semibold">{profileUser.reviews_count || reviews.length}</p>
              <p className="text-xs text-muted-foreground">Reviews</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold">{profileUser.followers_count || 0}</p>
              <p className="text-xs text-muted-foreground">Seguidores</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold">{profileUser.following_count || 0}</p>
              <p className="text-xs text-muted-foreground">Seguindo</p>
            </div>
            {isOwnProfile && (
              <div className="text-center">
                <p className="text-xl font-semibold">{userFavorites.length}</p>
                <p className="text-xs text-muted-foreground">Favoritos</p>
              </div>
            )}
          </div>
        </div>
        {isOwnProfile && (
          <Link
            to="/settings"
            className="mt-4 md:mt-0 md:ml-4 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Editar Perfil
          </Link>
        )}
      </div>

      {/* ─── Stats (own profile only) ─── */}
      {isOwnProfile && showStats && userStats.totalReviews > 0 && (
        <div className="mb-6 bg-card p-6 rounded-lg shadow-lg border border-border">
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-border">Suas Estatísticas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-muted-foreground text-sm">Avaliação Média</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-yellow-400">{userStats.averageRating.toFixed(1)}</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill={i < Math.floor(userStats.averageRating) ? "currentColor" : "none"} className={i < Math.floor(userStats.averageRating) ? "text-yellow-400" : "text-muted-foreground/30"} />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-sm mb-2">Distribuição</p>
              {userStats.ratingDistribution.map((count, i) => (
                <div key={i} className="flex items-center gap-2 mb-1">
                  <span className="text-xs w-6 text-right">{i + 1}★</span>
                  <div className="flex-grow bg-secondary rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(count / userStats.totalReviews) * 100}%` }} />
                  </div>
                  <span className="text-xs w-6">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isOwnProfile && (
        <button
          onClick={() => setShowStats(!showStats)}
          className="mb-4 text-sm text-green-400 hover:underline"
        >
          {showStats ? '↑ Esconder Estatísticas' : '📊 Ver Estatísticas'}
        </button>
      )}

      {/* ─── Tabs ─── */}
      <div className="mb-6 border-b border-border">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.key
                  ? 'border-green-500 text-green-500'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ─── Tab Content ─── */}
      {activeTab === 'reviews' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {reviews.length > 0 ? (
            isOwnProfile
              ? reviews.map((r, i) => renderLocalReview(r, i))
              : reviews.map(r => renderApiReview(r))
          ) : (
            <p className="text-muted-foreground col-span-full text-center py-8">
              {isOwnProfile ? 'Você ainda não fez nenhum review.' : 'Este usuário ainda não fez reviews.'}
            </p>
          )}
        </div>
      )}

      {activeTab === 'lists' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {lists.length > 0 ? (
            lists.map(l => renderListCard(l))
          ) : (
            <p className="text-muted-foreground col-span-full text-center py-8">
              {isOwnProfile ? 'Você ainda não criou nenhuma lista.' : 'Este usuário não tem listas públicas.'}
            </p>
          )}
        </div>
      )}

      {activeTab === 'favorites' && isOwnProfile && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {userFavorites.length > 0 ? (
            userFavorites.map((item, i) => renderLocalReview(item, i))
          ) : (
            <p className="text-muted-foreground col-span-full text-center py-8">
              Você ainda não adicionou nenhum favorito.
            </p>
          )}
        </div>
      )}

      {activeTab === 'watchlist' && isOwnProfile && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {userWatchlist.length > 0 ? (
            userWatchlist.map((item, i) => renderLocalReview(item, i))
          ) : (
            <p className="text-muted-foreground col-span-full text-center py-8">
              Sua lista "Quero Ouvir" está vazia.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
