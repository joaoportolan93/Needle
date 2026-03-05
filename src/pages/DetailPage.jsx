import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSpotifyAlbumDetails, getSpotifyArtistDetails, getSpotifyTrackDetails, getUserLists, addListItem } from '../services/api';
import ShareButtons from '../components/ShareButtons';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Plus, Music } from 'lucide-react';

const DetailPage = () => {
  const { id, type = 'album' } = useParams();
  const [itemDetails, setItemDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [listenDate, setListenDate] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [customTag, setCustomTag] = useState('');
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  // States for Add to List Custom Modal
  const { user } = useAuth();
  const [showListModal, setShowListModal] = useState(false);
  const [userLists, setUserLists] = useState([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [addingToListId, setAddingToListId] = useState(null);

  const predefinedTags = [
    "Relaxante", "Enérgico", "Melancólico", "Feliz", "Nostálgico", "Dançante",
    "Instrumental", "Acústico", "Eletrônico", "Jazz", "Rock", "Pop", "Hip-Hop",
    "Clássico", "Indie", "Folk", "R&B", "Soul", "Metal", "Alternativo"
  ];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let data;
        if (type === 'album') {
          data = await getSpotifyAlbumDetails(id);
        } else if (type === 'artist') {
          data = await getSpotifyArtistDetails(id);
        } else if (type === 'track') {
          data = await getSpotifyTrackDetails(id);
        } else {
          throw new Error('Tipo de item desconhecido.');
        }
        setItemDetails(data);
        loadReviews(id);
        loadUserReview(id);
      } catch (err) {
        console.error('Erro ao carregar detalhes:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, type]);

  const loadReviews = (itemId) => {
    const allReviews = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sonora-review-')) {
        try {
          const reviewData = JSON.parse(localStorage.getItem(key));
          if (reviewData && reviewData.itemId === itemId) allReviews.push(reviewData);
        } catch (error) {
          console.error("Erro ao parsear review do localStorage:", key, error);
        }
      }
    }
    setReviews(allReviews);
  };

  const loadUserReview = (itemId) => {
    const reviewKey = `sonora-review-${itemId}`;
    const savedReview = localStorage.getItem(reviewKey);
    if (savedReview) {
      try {
        const reviewData = JSON.parse(savedReview);
        setUserRating(reviewData.rating || 0);
        setReviewText(reviewData.reviewText || '');
        setListenDate(reviewData.listenDate || '');
        setSelectedTags(reviewData.tags || []);
      } catch (error) {
        console.error("Erro ao carregar avaliação do usuário:", error);
      }
    }
  };

  const saveReview = () => {
    if (userRating === 0) {
      alert('Por favor, dê uma avaliação em estrelas antes de salvar.');
      return;
    }
    const reviewData = {
      id: `review-${id}-${Date.now()}`,
      itemId: id,
      itemType: type,
      itemName: itemDetails.name,
      itemArtist: type === 'album' || type === 'track'
        ? itemDetails.artists.map(artist => artist.name).join(', ')
        : '',
      itemCoverUrl: itemDetails.images && itemDetails.images.length > 0
        ? itemDetails.images[0].url
        : '',
      rating: userRating,
      reviewText,
      listenDate,
      tags: selectedTags,
      date: new Date().toISOString()
    };
    const reviewKey = `sonora-review-${id}`;
    localStorage.setItem(reviewKey, JSON.stringify(reviewData));
    loadReviews(id);
    setShowReviewForm(false);
    const userReviewsKey = 'sonora-user-reviews';
    let userReviews = JSON.parse(localStorage.getItem(userReviewsKey) || '[]');
    userReviews = userReviews.filter(rev => rev.itemId !== id);
    userReviews.push({ id: reviewData.id, itemId: id, itemType: type, itemName: itemDetails.name, rating: userRating, date: new Date().toISOString() });
    localStorage.setItem(userReviewsKey, JSON.stringify(userReviews));
    alert('Sua avaliação foi salva com sucesso!');
  };

  const addToFavorites = () => {
    const favoritesKey = 'sonora-favorites';
    let favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
    if (!favorites.some(fav => fav.id === id)) {
      favorites.push({
        id, type, name: itemDetails.name,
        artist: type === 'album' || type === 'track' ? itemDetails.artists.map(artist => artist.name).join(', ') : '',
        coverUrl: itemDetails.images && itemDetails.images.length > 0 ? itemDetails.images[0].url : '',
        addedAt: new Date().toISOString()
      });
      localStorage.setItem(favoritesKey, JSON.stringify(favorites));
      alert('Adicionado aos favoritos!');
    } else {
      alert('Este item já está nos seus favoritos!');
    }
  };

  const addToWatchlist = () => {
    const watchlistKey = 'sonora-watchlist';
    let watchlist = JSON.parse(localStorage.getItem(watchlistKey) || '[]');
    if (!watchlist.some(item => item.id === id)) {
      watchlist.push({
        id, type, name: itemDetails.name,
        artist: type === 'album' || type === 'track' ? itemDetails.artists.map(artist => artist.name).join(', ') : '',
        coverUrl: itemDetails.images && itemDetails.images.length > 0 ? itemDetails.images[0].url : '',
        addedAt: new Date().toISOString()
      });
      localStorage.setItem(watchlistKey, JSON.stringify(watchlist));
      alert('Adicionado à sua lista "Quero Ouvir"!');
    } else {
      alert('Este item já está na sua lista "Quero Ouvir"!');
    }
  };

  const handleOpenListModal = async () => {
    if (!user) {
      alert('Faça login para adicionar álbuns a uma lista.');
      return;
    }
    setShowListModal(true);
    if (userLists.length === 0) {
      setIsLoadingLists(true);
      try {
        const lists = await getUserLists(user.id, 50);
        setUserLists(lists);
      } catch (err) {
        console.error('Erro ao buscar listas do usuário:', err);
      } finally {
        setIsLoadingLists(false);
      }
    }
  };

  const handleAddToList = async (listId) => {
    if (!id) return;
    setAddingToListId(listId);
    try {
      await addListItem(listId, { album_spotify_id: id });
      alert('Álbum adicionado à lista com sucesso!');
      setShowListModal(false);
    } catch (err) {
      console.error('Erro ao adicionar item à lista:', err);
      if (err.message && err.message.includes('already in this list')) {
         alert('Este álbum já está na lista.');
      } else {
         alert('Ocorreu um erro ao adicionar à lista. Tente novamente.');
      }
    } finally {
      setAddingToListId(null);
    }
  };

  const handleTagClick = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const addCustomTag = () => {
    if (customTag.trim() === '') return;
    if (!selectedTags.includes(customTag.trim())) {
      setSelectedTags([...selectedTags, customTag.trim()]);
    }
    setCustomTag('');
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <p className="text-xl text-foreground">Carregando detalhes...</p>
      </div>
    );
  }

  if (error) {
    const errorLowerCase = error.toLowerCase();
    if (errorLowerCase.includes('resource not found') || errorLowerCase.includes('não encontrado')) {
      return (
        <div className="p-4 text-center">
          <p className="text-xl text-red-500 mb-4">Este item não foi encontrado no Spotify</p>
          <p className="text-muted-foreground mb-6">Pode ser que este álbum, artista ou música tenha sido removido do catálogo ou não esteja disponível na sua região.</p>
          <Link to="/search" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center">
            Voltar para a Busca
          </Link>
        </div>
      );
    }
    return (
      <div className="p-4 text-center">
        <p className="text-xl text-red-500">Erro ao carregar detalhes: {error}</p>
        <Link to="/search" className="text-blue-500 hover:underline mt-4 inline-block">
          Voltar para a Busca
        </Link>
      </div>
    );
  }

  if (!itemDetails) {
    return (
      <div className="p-4 text-center">
        <p className="text-xl text-foreground">Nenhum detalhe encontrado.</p>
        <Link to="/search" className="text-blue-500 hover:underline mt-4 inline-block">
          Voltar para a Busca
        </Link>
      </div>
    );
  }

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="p-4 max-w-6xl mx-auto text-foreground">
      <Link to="/search" className="text-blue-500 hover:underline mb-6 inline-block">
        &larr; Voltar para a Busca
      </Link>

      {/* Detalhes do Item */}
      <div className="flex flex-col md:flex-row mb-8">
        <div className="md:w-1/3 mb-4 md:mb-0 md:mr-6">
          <img
            src={itemDetails.images && itemDetails.images.length > 0
              ? itemDetails.images[0].url
              : `https://via.placeholder.com/300/1DB954/FFFFFF?text=${itemDetails.name.charAt(0)}`}
            alt={itemDetails.name}
            className="w-full rounded-lg shadow-lg"
          />

          {/* Botões de ação */}
          <div className="mt-4 flex flex-col space-y-2">
            <a
              href={itemDetails.external_urls?.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-center"
            >
              Abrir no Spotify
            </a>
            <button
              onClick={addToFavorites}
              className="bg-secondary hover:bg-accent text-foreground font-bold py-2 px-4 rounded flex items-center justify-center"
            >
              <span>♥ Adicionar aos Favoritos</span>
            </button>
            <button
              onClick={addToWatchlist}
              className="bg-secondary hover:bg-accent text-foreground font-bold py-2 px-4 rounded flex items-center justify-center"
            >
              <span>➕ Adicionar à lista "Quero Ouvir"</span>
            </button>
            <button
              onClick={handleOpenListModal}
              className="bg-secondary hover:bg-accent text-foreground font-bold py-2 px-4 rounded flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              <span>Adicionar a uma Lista</span>
            </button>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
            >
              <span>{showReviewForm ? 'Cancelar Avaliação' : 'Avaliar este item'}</span>
            </button>
          </div>
        </div>

        <div className="md:w-2/3">
          <h1 className="text-3xl font-bold mb-2">{itemDetails.name}</h1>

          {type === 'album' && (
            <>
              <p className="text-xl text-muted-foreground mb-4">
                <Link to={`/artist/${itemDetails.artists[0].id}`} className="hover:underline">
                  {itemDetails.artists.map(artist => artist.name).join(', ')}
                </Link>
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-muted-foreground">Data de Lançamento</p>
                  <p>{new Date(itemDetails.release_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total de Faixas</p>
                  <p>{itemDetails.total_tracks}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Popularidade</p>
                  <p>{itemDetails.popularity}/100</p>
                </div>
                {averageRating && (
                  <div>
                    <p className="text-muted-foreground">Avaliação da Comunidade</p>
                    <p className="text-yellow-400">
                      {'★'.repeat(Math.floor(averageRating))}
                      {averageRating % 1 >= 0.5 ? '½' : ''}
                      {'☆'.repeat(5 - Math.ceil(averageRating))}
                      {` (${averageRating})`}
                    </p>
                  </div>
                )}
              </div>

              {/* Lista de Faixas */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">Faixas</h2>
                <div className="overflow-y-auto max-h-[400px] pr-2">
                  {itemDetails.tracks.items.map((track, index) => (
                    <div key={track.id} className="flex items-center py-2 border-b border-border">
                      <div className="mr-4 text-muted-foreground w-8 text-right">{index + 1}</div>
                      <div className="flex-grow">
                        <p className="font-medium">{track.name}</p>
                        <p className="text-sm text-muted-foreground">{track.artists.map(artist => artist.name).join(', ')}</p>
                      </div>
                      <div className="text-right text-muted-foreground text-sm">
                        {Math.floor(track.duration_ms / 60000)}:
                        {String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {type === 'artist' && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-muted-foreground">Gêneros</p>
                  <p>{itemDetails.genres.join(', ') || 'Não especificado'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Popularidade</p>
                  <p>{itemDetails.popularity}/100</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Seguidores</p>
                  <p>{itemDetails.followers.total.toLocaleString()}</p>
                </div>
              </div>
            </>
          )}

          {/* Formulário de Avaliação */}
          {showReviewForm && (
            <div className="mt-8 bg-card p-6 rounded-lg border border-border">
              <h2 className="text-xl font-semibold mb-4">Avaliar {itemDetails.name}</h2>

              <div className="mb-4">
                <label className="block text-muted-foreground mb-2">Sua Avaliação:</label>
                <div className="flex text-3xl text-yellow-400 mb-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setUserRating(star)}
                      className="focus:outline-none transition-all duration-150"
                    >
                      {userRating >= star ? '★' : '☆'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-muted-foreground mb-2">Data em que ouviu:</label>
                <input
                  type="date"
                  value={listenDate}
                  onChange={(e) => setListenDate(e.target.value)}
                  className="w-full bg-secondary border border-border rounded p-2 text-foreground"
                />
              </div>

              <div className="mb-4">
                <label className="block text-muted-foreground mb-2">Seu Review:</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Escreva seus pensamentos sobre este álbum..."
                  className="w-full bg-secondary border border-border rounded p-2 text-foreground h-32"
                ></textarea>
              </div>

              <div className="mb-6">
                <label className="block text-muted-foreground mb-2">Tags:</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {predefinedTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagClick(tag)}
                      className={`px-3 py-1 rounded-full text-sm ${selectedTags.includes(tag)
                        ? 'bg-green-600 text-white'
                        : 'bg-secondary text-muted-foreground hover:bg-accent'
                        }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <div className="flex">
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    placeholder="Adicionar tag personalizada"
                    className="flex-1 bg-secondary border border-border rounded-l p-2 text-foreground"
                    onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
                  />
                  <button
                    onClick={addCustomTag}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-r"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="bg-secondary hover:bg-accent text-foreground font-bold py-2 px-4 rounded mr-2"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveReview}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  Salvar Avaliação
                </button>
              </div>
            </div>
          )}

          {/* Avaliações da Comunidade */}
          {reviews.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 border-b border-border pb-2">Avaliações da Comunidade</h2>

              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review.id} className="bg-card p-4 rounded-lg border border-border">
                    <div className="flex justify-between mb-2">
                      <div className="text-yellow-400">
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(review.date).toLocaleDateString()}
                      </div>
                    </div>

                    {review.listenDate && (
                      <div className="text-sm text-muted-foreground mb-2">
                        Ouvido em: {new Date(review.listenDate).toLocaleDateString()}
                      </div>
                    )}

                    {review.reviewText && (
                      <p className="mb-3">{review.reviewText}</p>
                    )}

                    {review.tags && review.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {review.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-secondary rounded-full text-xs text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Compartilhar esta avaliação:</p>
                      <ShareButtons
                        title={`Review: ${itemDetails.name}`}
                        description={`Confira minha avaliação de ${itemDetails.name} (${review.rating}/5 estrelas) no Sonora App!`}
                        url={`${window.location.origin}/item/${id}?review=${review.id}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Adicionar à Lista */}
      {showListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm flex flex-col shadow-2xl max-h-[80vh]">
            <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10 rounded-t-xl">
              <h3 className="font-bold text-lg text-foreground">Adicionar à Lista</h3>
              <button 
                onClick={() => setShowListModal(false)}
                className="text-muted-foreground hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-y-auto p-4 flex-1">
              {isLoadingLists ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="animate-spin text-green-500 mb-2" size={24} />
                  <p className="text-sm text-muted-foreground">Carregando suas listas...</p>
                </div>
              ) : userLists.length === 0 ? (
                <div className="text-center py-8">
                  <Music className="mx-auto text-muted-foreground/50 mb-3" size={32} />
                  <p className="text-sm text-muted-foreground mb-4">Você ainda não criou nenhuma lista.</p>
                  <Link 
                    to="/lists" 
                    className="text-sm text-green-400 hover:underline font-semibold"
                  >
                    Criar Nova Lista
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {userLists.map(list => (
                    <button
                      key={list.id}
                      onClick={() => handleAddToList(list.id)}
                      disabled={addingToListId === list.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-border text-left group"
                    >
                      <div className="w-10 h-10 bg-secondary rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {(list.items && list.items.length > 0) ? (
                          <img src={list.items[0].album?.cover_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Music size={16} className="text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-green-400 transition-colors">
                          {list.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {list.items_count} {list.items_count === 1 ? 'item' : 'itens'} {list.is_public ? '• Pública' : '• Privada'}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {addingToListId === list.id ? (
                          <Loader2 size={18} className="animate-spin text-green-500" />
                        ) : (
                          <Plus size={18} className="text-muted-foreground group-hover:text-green-400" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DetailPage;
