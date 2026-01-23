import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSpotifyArtistDetails, getSpotifyArtistTopTracks, getSpotifyArtistAlbums } from '../services/spotifyAPI';

const ArtistPage = () => {
  const { id } = useParams();
  const [artist, setArtist] = useState(null);
  const [topTracks, setTopTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArtistData = async () => {
      setIsLoading(true);
      try {
        // Buscar detalhes do artista
        const artistData = await getSpotifyArtistDetails(id);
        setArtist(artistData);

        // Buscar top faixas do artista
        const topTracksData = await getSpotifyArtistTopTracks(id);
        setTopTracks(topTracksData.tracks || []);

        // Buscar álbuns do artista
        const albumsData = await getSpotifyArtistAlbums(id);
        setAlbums(albumsData.items || []);

      } catch (err) {
        console.error('Erro ao buscar dados do artista:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchArtistData();
    }
  }, [id]);

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <p className="text-xl">Carregando informações do artista...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-xl text-red-500">Erro ao carregar informações do artista: {error}</p>
        <Link to="/search" className="text-blue-500 hover:underline mt-4 inline-block">
          Voltar para a Busca
        </Link>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="p-4 text-center">
        <p className="text-xl">Artista não encontrado.</p>
        <Link to="/search" className="text-blue-500 hover:underline mt-4 inline-block">
          Voltar para a Busca
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <Link to="/search" className="text-blue-500 hover:underline mb-6 inline-block">
        &larr; Voltar para a Busca
      </Link>

      {/* Cabeçalho do Artista */}
      <div className="flex flex-col md:flex-row items-center md:items-start mb-8">
        <img 
          src={artist.images && artist.images[0] ? artist.images[0].url : `https://via.placeholder.com/300/1DB954/FFFFFF?text=${artist.name.charAt(0)}`} 
          alt={artist.name} 
          className="w-64 h-64 object-cover rounded-full mb-4 md:mb-0 md:mr-8"
        />
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-bold mb-2">{artist.name}</h1>
          {artist.genres && artist.genres.length > 0 && (
            <p className="text-gray-400 mb-2">Gêneros: {artist.genres.join(', ')}</p>
          )}
          <p className="text-gray-400 mb-4">
            Popularidade: {artist.popularity}/100
          </p>
          <p className="text-gray-400 mb-4">
            Seguidores: {artist.followers.total.toLocaleString()}
          </p>
          <a 
            href={artist.external_urls.spotify} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
          >
            Abrir no Spotify
          </a>
        </div>
      </div>

      {/* Top Tracks */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">Top Faixas</h2>
        {topTracks.length > 0 ? (
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">#</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Faixa</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Álbum</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Duração</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-800">
                {topTracks.map((track, index) => (
                  <tr key={track.id} className="hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex items-center">
                        <img 
                          src={track.album.images[2]?.url || `https://via.placeholder.com/40`} 
                          alt={track.name} 
                          className="w-10 h-10 mr-3 rounded"
                        />
                        <div>
                          <div className="font-medium">{track.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <Link to={`/item/${track.album.id}`} className="hover:underline">
                        {track.album.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatDuration(track.duration_ms)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400">Nenhuma faixa encontrada para este artista.</p>
        )}
      </section>

      {/* Discografia */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">Discografia</h2>
        {albums.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {albums.map(album => (
              <Link to={`/item/${album.id}`} key={album.id} className="block group">
                <div className="bg-gray-800 p-3 rounded-lg shadow-lg transition duration-300 hover:bg-gray-700">
                  <div className="mb-3">
                    <img 
                      src={album.images[0]?.url || `https://via.placeholder.com/300`} 
                      alt={album.name} 
                      className="w-full aspect-square object-cover rounded-md shadow-md"
                    />
                  </div>
                  <h3 className="font-medium text-sm group-hover:text-green-400 truncate">{album.name}</h3>
                  <p className="text-xs text-gray-400">{album.release_date.split('-')[0]} • {album.album_type}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">Nenhum álbum encontrado para este artista.</p>
        )}
      </section>
    </div>
  );
};

export default ArtistPage; 