import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { searchSpotify, getSpotifyCategories } from '../services/api';
import { Music, TrendingUp, Globe, Flame } from 'lucide-react';

const SearchPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState({ artists: [], albums: [], tracks: [] });
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Curated highlight cards (playlists/charts that users can explore)
  const curatedCards = [
    {
      id: 'toplists',
      name: 'Top 50 Brasil',
      gradient: 'from-green-500 to-green-800',
      icon: <TrendingUp size={28} />,
      searchQuery: 'Top 50 Brasil',
    },
    {
      id: 'global',
      name: 'Top 50 Global',
      gradient: 'from-blue-500 to-indigo-800',
      icon: <Globe size={28} />,
      searchQuery: 'Top 50 Global',
    },
    {
      id: 'viral',
      name: 'Viral Brasil',
      gradient: 'from-orange-500 to-red-700',
      icon: <Flame size={28} />,
      searchQuery: 'Viral 50 Brasil',
    },
    {
      id: 'discover',
      name: 'Descobertas da Semana',
      gradient: 'from-purple-500 to-pink-700',
      icon: <Music size={28} />,
      searchQuery: 'Descobertas da Semana',
    },
  ];

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getSpotifyCategories(20);
        setCategories(data.categories?.items || []);
      } catch (err) {
        console.error('Erro ao buscar categorias:', err);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleSearch = useCallback(async (termToSearch) => {
    if (!termToSearch || termToSearch.length < 2) {
      setResults({ artists: [], albums: [], tracks: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await searchSpotify(termToSearch, ['artist', 'album', 'track']);
      setResults({
        artists: data.artists ? data.artists.items : [],
        albums: data.albums ? data.albums.items : [],
        tracks: data.tracks ? data.tracks.items : [],
      });
    } catch (error) {
      console.error('Erro ao buscar no Spotify:', error);
      setResults({ artists: [], albums: [], tracks: [] });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debouncedTerm) handleSearch(debouncedTerm);
  }, [debouncedTerm, handleSearch]);

  const handleCuratedClick = (query) => {
    setSearchTerm(query);
    setDebouncedTerm(query);
  };

  const renderResults = (items, type) => {
    if (!items || items.length === 0) {
      return <p className="text-muted-foreground mt-4">Nenhum resultado encontrado para {type}.</p>;
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {items.map(item => {
          const route = type === 'Artistas' ? `/artist/${item.id}` : `/item/${item.id}`;
          return (
            <Link to={route} key={item.id} className="bg-card p-3 rounded-lg shadow border border-border hover:bg-accent transition-colors">
              <img
                src={item.images && item.images.length > 0 ? item.images[0].url : (item.album && item.album.images && item.album.images.length > 0 ? item.album.images[0].url : 'https://via.placeholder.com/150/14181C/E1E1E1?text=Capa')}
                alt={`Capa de ${item.name}`}
                className={`w-full h-40 object-cover rounded-md mb-2 ${type === 'Artistas' ? 'rounded-full' : ''}`}
              />
              <h3 className="text-md font-semibold truncate text-foreground">{item.name}</h3>
              {type === 'Álbuns' && item.artists && (
                <p className="text-xs text-muted-foreground truncate">{item.artists.map(a => a.name).join(', ')}</p>
              )}
              {type === 'Músicas' && item.artists && (
                <p className="text-xs text-muted-foreground truncate">{item.artists.map(a => a.name).join(', ')}</p>
              )}
              {type === 'Músicas' && item.album && (
                <p className="text-xs text-muted-foreground truncate">Álbum: {item.album.name}</p>
              )}
              <p className="text-xs text-green-500 capitalize mt-1">{type.slice(0, -1)}</p>
            </Link>
          );
        })}
      </div>
    );
  };

  // Genre card colors — cycling gradient pairs
  const genreGradients = [
    'from-emerald-600 to-emerald-900',
    'from-rose-600 to-rose-900',
    'from-violet-600 to-violet-900',
    'from-amber-600 to-amber-900',
    'from-cyan-600 to-cyan-900',
    'from-fuchsia-600 to-fuchsia-900',
    'from-lime-600 to-lime-900',
    'from-sky-600 to-sky-900',
    'from-teal-600 to-teal-900',
    'from-pink-600 to-pink-900',
    'from-indigo-600 to-indigo-900',
    'from-orange-600 to-orange-900',
    'from-red-600 to-red-900',
    'from-blue-600 to-blue-900',
    'from-yellow-600 to-yellow-900',
    'from-purple-600 to-purple-900',
    'from-stone-600 to-stone-900',
    'from-slate-600 to-slate-900',
    'from-zinc-600 to-zinc-900',
    'from-neutral-600 to-neutral-900',
  ];

  return (
    <div className="p-4 max-w-6xl mx-auto text-foreground">
      <h1 className="text-3xl font-bold mb-6 text-center">Explore Músicas, Álbuns e Artistas</h1>
      <div className="mb-6">
        <input
          type="text"
          className="w-full p-3 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-muted-foreground"
          placeholder="O que você quer ouvir hoje?"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex space-x-2 mb-4 border-b border-border">
        {['all', 'artists', 'albums', 'tracks'].map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`py-2 px-4 font-medium text-sm rounded-t-md 
              ${activeFilter === filter ? 'bg-green-500 text-white' : 'text-muted-foreground hover:bg-accent'}
            `}
          >
            {filter === 'all' ? 'Todos' : filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      {loading && <p className="text-center text-muted-foreground">Buscando...</p>}

      {!loading && debouncedTerm && (
        <div className="mt-4">
          {activeFilter === 'all' && (
            <>
              {results.artists.length > 0 && <h2 className="text-xl font-semibold mt-4 mb-2">Artistas</h2>}
              {renderResults(results.artists, 'Artistas')}
              {results.albums.length > 0 && <h2 className="text-xl font-semibold mt-6 mb-2">Álbuns</h2>}
              {renderResults(results.albums, 'Álbuns')}
              {results.tracks.length > 0 && <h2 className="text-xl font-semibold mt-6 mb-2">Músicas</h2>}
              {renderResults(results.tracks, 'Músicas')}
              {results.artists.length === 0 && results.albums.length === 0 && results.tracks.length === 0 && debouncedTerm.length > 1 && (
                <p className="text-muted-foreground mt-4 text-center">Nenhum resultado encontrado para "{debouncedTerm}".</p>
              )}
            </>
          )}
          {activeFilter === 'artists' && renderResults(results.artists, 'Artistas')}
          {activeFilter === 'albums' && renderResults(results.albums, 'Álbuns')}
          {activeFilter === 'tracks' && renderResults(results.tracks, 'Músicas')}
        </div>
      )}

      {/* Idle state: show genre exploration cards */}
      {!debouncedTerm && !loading && (
        <div className="mt-6 space-y-8">

          {/* Curated highlights */}
          <section>
            <h2 className="text-xl font-bold mb-4 text-foreground">🔥 Em Destaque</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {curatedCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleCuratedClick(card.searchQuery)}
                  className={`group relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br ${card.gradient} 
                    hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg hover:shadow-xl text-left`}
                >
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                  <div className="relative p-4 flex flex-col justify-between h-full text-white">
                    <div className="opacity-60 group-hover:opacity-80 transition-opacity">
                      {card.icon}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold leading-tight drop-shadow-lg">
                      {card.name}
                    </h3>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Spotify genre categories */}
          <section>
            <h2 className="text-xl font-bold mb-4 text-foreground">🎵 Explorar por Gênero</h2>
            {categoriesLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="aspect-square rounded-xl bg-card animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {categories.map((cat, idx) => (
                  <Link
                    to={`/search?category=${cat.id}`}
                    key={cat.id}
                    onClick={(e) => {
                      e.preventDefault();
                      handleCuratedClick(cat.name);
                    }}
                    className="group relative aspect-square overflow-hidden rounded-xl shadow-md hover:shadow-xl 
                      hover:scale-[1.03] active:scale-[0.97] transition-all duration-300"
                  >
                    {/* Background gradient (always visible) */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${genreGradients[idx % genreGradients.length]}`} />

                    {/* Category icon image */}
                    {cat.icons && cat.icons.length > 0 && (
                      <img
                        src={cat.icons[0].url}
                        className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-40 
                          group-hover:scale-110 transition-all duration-500"
                        alt={cat.name}
                      />
                    )}

                    {/* Text overlay */}
                    <div className="absolute inset-0 flex items-end p-3 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                      <span className="font-bold text-white text-sm drop-shadow-lg leading-tight">
                        {cat.name}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

        </div>
      )}
    </div>
  );
};

export default SearchPage;
