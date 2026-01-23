import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSpotifyNewReleases, getSpotifyCategories } from '../services/spotifyAPI';
import ActivityFeed from '../components/ActivityFeed';

const HomePage = () => {
  const [newReleases, setNewReleases] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('releases');

  useEffect(() => {
    const fetchHomeData = async () => {
      setIsLoading(true);
      try {
        // Buscar novos lançamentos
        const releasesData = await getSpotifyNewReleases(10);
        setNewReleases(releasesData.albums.items || []);

        // Buscar categorias/gêneros
        const categoriesData = await getSpotifyCategories(20);
        setCategories(categoriesData.categories.items || []);
      } catch (err) {
        console.error('Erro ao buscar dados da página inicial:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <p className="text-xl">Carregando conteúdo da página inicial...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-xl text-red-500">Erro ao carregar conteúdo: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-white">Bem-vindo ao Sonora</h1>
      
      {/* Tabs de navegação */}
      <div className="mb-8 border-b border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('releases')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm 
              ${activeTab === 'releases' ? 'border-green-500 text-green-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}
            `}
          >
            Novos Lançamentos
          </button>
          <button
            onClick={() => setActiveTab('genres')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm 
              ${activeTab === 'genres' ? 'border-green-500 text-green-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}
            `}
          >
            Explorar por Gênero
          </button>
          <button
            onClick={() => setActiveTab('feed')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm 
              ${activeTab === 'feed' ? 'border-green-500 text-green-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}
            `}
          >
            Feed de Atividades
          </button>
        </nav>
      </div>
      
      {/* Conteúdo da tab selecionada */}
      {activeTab === 'releases' && (
        <section>
          <div className="flex justify-between items-baseline mb-4">
            <h2 className="text-2xl font-semibold text-white">Novos Lançamentos</h2>
            <Link to="/search?type=album" className="text-sm text-green-400 hover:text-green-300">
              Ver mais
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {newReleases.map(album => (
              <Link 
                to={`/item/${album.id}`} 
                key={album.id} 
                className="block group bg-gray-900 p-3 rounded-lg shadow-lg transition duration-300 hover:bg-gray-800"
              >
                <div className="mb-3">
                  <img 
                    src={album.images[0]?.url || 'https://via.placeholder.com/300'} 
                    alt={album.name} 
                    className="w-full aspect-square object-cover rounded-md shadow-md"
                  />
                </div>
                <h3 className="font-medium text-sm text-white group-hover:text-green-400 truncate">{album.name}</h3>
                <p className="text-xs text-gray-400 truncate">
                  {album.artists.map(artist => artist.name).join(', ')}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(album.release_date).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'genres' && (
        <section>
          <div className="flex justify-between items-baseline mb-4">
            <h2 className="text-2xl font-semibold text-white">Explorar por Gênero</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.map(category => (
              <div 
                key={category.id} 
                className="relative group overflow-hidden rounded-lg shadow-lg aspect-square"
              >
                <img 
                  src={category.icons[0]?.url || 'https://via.placeholder.com/300'} 
                  alt={category.name} 
                  className="w-full h-full object-cover transition duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end">
                  <h3 className="text-white font-bold p-4 w-full text-center">{category.name}</h3>
                </div>
                <Link 
                  to={`/search?category=${category.id}`} 
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300"
                >
                  <span className="bg-green-600 text-white px-4 py-2 rounded-full font-medium">Explorar</span>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'feed' && (
        <section>
          <div className="flex justify-between items-baseline mb-4">
            <h2 className="text-2xl font-semibold text-white">Feed de Atividades</h2>
          </div>
          
          <ActivityFeed />
        </section>
      )}
    </div>
  );
};

export default HomePage;

