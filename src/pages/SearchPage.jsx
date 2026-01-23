import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { searchSpotify } from '../services/spotifyAPI'; // Ajuste o caminho se necessário

const SearchPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState({ artists: [], albums: [], tracks: [] });
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'artists', 'albums', 'tracks'
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
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
      setResults({ artists: [], albums: [], tracks: [] }); // Limpa resultados em caso de erro
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debouncedTerm) {
      handleSearch(debouncedTerm);
    }
  }, [debouncedTerm, handleSearch]);

  const renderResults = (items, type) => {
    if (!items || items.length === 0) {
      return <p className="text-gray-400 mt-4">Nenhum resultado encontrado para {type}.</p>;
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {items.map(item => {
          // Define a rota com base no tipo
          const route = type === 'Artistas' ? `/artist/${item.id}` : `/item/${item.id}`;
          
          return (
            <Link to={route} key={item.id} className="bg-gray-800 p-3 rounded-lg shadow hover:bg-gray-700 transition-colors">
              <img 
                src={item.images && item.images.length > 0 ? item.images[0].url : (item.album && item.album.images && item.album.images.length > 0 ? item.album.images[0].url : 'https://via.placeholder.com/150/14181C/E1E1E1?text=Capa')}
                alt={`Capa de ${item.name}`}
                className={`w-full h-40 object-cover rounded-md mb-2 ${type === 'Artistas' ? 'rounded-full' : ''}`}
              />
              <h3 className="text-md font-semibold truncate text-white">{item.name}</h3>
              {type === 'Álbuns' && item.artists && (
                <p className="text-xs text-gray-400 truncate">{item.artists.map(a => a.name).join(', ')}</p>
              )}
              {type === 'Músicas' && item.artists && (
                <p className="text-xs text-gray-400 truncate">{item.artists.map(a => a.name).join(', ')}</p>
              )}
              {type === 'Músicas' && item.album && (
                <p className="text-xs text-gray-500 truncate">Álbum: {item.album.name}</p>
              )}
              <p className="text-xs text-green-400 capitalize mt-1">{type.slice(0, -1)}</p>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-4 max-w-6xl mx-auto text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">Explore Músicas, Álbuns e Artistas</h1>
      <div className="mb-6">
        <input
          type="text"
          className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400"
          placeholder="O que você quer ouvir hoje?"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filtros de Tabs */}
      <div className="flex space-x-2 mb-4 border-b border-gray-700">
        {['all', 'artists', 'albums', 'tracks'].map(filter => (
          <button 
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`py-2 px-4 font-medium text-sm rounded-t-md 
              ${activeFilter === filter ? 'bg-green-500 text-gray-900' : 'text-gray-400 hover:bg-gray-700'}
            `}
          >
            {filter === 'all' ? 'Todos' : filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      {loading && <p className="text-center text-gray-400">Buscando...</p>}

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
                <p className="text-gray-400 mt-4 text-center">Nenhum resultado encontrado para "{debouncedTerm}".</p>
              )}
            </>
          )}
          {activeFilter === 'artists' && renderResults(results.artists, 'Artistas')}
          {activeFilter === 'albums' && renderResults(results.albums, 'Álbuns')}
          {activeFilter === 'tracks' && renderResults(results.tracks, 'Músicas')}
        </div>
      )}
      {!debouncedTerm && !loading && (
         <p className="text-gray-500 text-center mt-8">Digite algo para começar a busca.</p>
      )}
    </div>
  );
};

export default SearchPage;

