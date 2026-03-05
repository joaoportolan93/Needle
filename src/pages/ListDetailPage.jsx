import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Loader2, Music, Trash2, Calendar, User, ArrowLeft, MoreVertical, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getListDetail, deleteList, deleteListItem } from '../services/api';

const ListDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [list, setList] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchList = async () => {
      try {
        setIsLoading(true);
        setError('');
        const data = await getListDetail(parseInt(id, 10));
        setList(data);
      } catch (err) {
        console.error('Erro ao carregar lista:', err);
        setError('Não foi possível carregar os detalhes desta lista.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchList();
    }
  }, [id]);

  const isOwner = user?.id === list?.user_id;

  const handleDeleteList = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta lista? Esta ação não pode ser desfeita.')) {
      return;
    }
    try {
      setIsDeleting(true);
      await deleteList(list.id);
      navigate('/lists', { replace: true });
    } catch (err) {
      console.error('Erro ao deletar lista:', err);
      alert('Ocorreu um erro ao excluir a lista. Tente novamente.');
      setIsDeleting(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!window.confirm('Remover este álbum da lista?')) return;
    try {
      setDeleteItemId(itemId);
      await deleteListItem(list.id, itemId);
      setList(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== itemId),
        items_count: prev.items_count - 1
      }));
    } catch (err) {
      console.error('Erro ao remover item:', err);
      alert('Ocorreu um erro ao remover o item. Tente novamente.');
    } finally {
      setDeleteItemId(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(date);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 size={40} className="animate-spin text-green-500 mb-4" />
        <p className="text-muted-foreground">Carregando lista...</p>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">Ops!</h2>
        <p className="text-muted-foreground mb-6">{error || 'Lista não encontrada.'}</p>
        <button
          onClick={() => navigate('/lists')}
          className="px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-500 transition-colors"
        >
          Voltar para Listas
        </button>
      </div>
    );
  }

  // Obter até 4 capas para o grid do header
  const covers = [...(list.items || [])]
    .slice(0, 4)
    .map(item => item.album?.cover_url)
    .filter(Boolean);
    
  while (covers.length < 4) covers.push(null);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-32">
      {/* Botão Voltar */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={20} />
        <span>Voltar</span>
      </button>

      {/* Header da Lista */}
      <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
        {/* Grid de Capas (Grande) */}
        <div className="w-56 h-56 sm:w-64 sm:h-64 flex-shrink-0 relative shadow-2xl rounded-xl overflow-hidden bg-secondary">
          <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
            {covers.map((url, i) => (
              <div key={i} className="relative bg-gradient-to-br from-green-900/40 to-purple-900/40 flex items-center justify-center">
                {url ? (
                  <img src={url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Music size={24} className="text-white/20" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Informações da Lista */}
        <div className="flex-1 flex flex-col justify-end min-h-[14rem]">
          <span className="text-sm font-bold uppercase tracking-widest text-green-400 mb-2">
            {list.is_public ? 'Lista Pública' : 'Lista Privada'}
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 line-clamp-3 leading-tight tracking-tight">
            {list.title}
          </h1>
          {list.description && (
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mb-6">
              {list.description}
            </p>
          )}

          {/* Meta dados */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-foreground/80 font-medium mt-auto">
            <Link to={`/profile/${list.user?.username}`} className="flex items-center gap-2 hover:underline hover:text-green-400 transition-colors">
              {list.user?.avatar_url ? (
                <img src={list.user.avatar_url} alt="" className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-green-700 flex items-center justify-center text-[10px] text-white">
                  {list.user?.username?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <span>{list.user?.username}</span>
            </Link>
            <span className="hidden sm:inline text-muted-foreground">•</span>
            <span>{list.items_count} {list.items_count === 1 ? 'item' : 'itens'}</span>
          </div>

          {/* Ações */}
          {isOwner && (
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => navigate('/search')}
                className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-full hover:bg-green-500 hover:scale-105 transition-all flex items-center gap-2"
              >
                <Search size={18} />
                Adicionar Álbuns
              </button>
              
              <button
                onClick={handleDeleteList}
                disabled={isDeleting}
                className="p-2.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors tooltip-trigger relative group"
                title="Excluir Lista"
              >
                {isDeleting ? <Loader2 size={20} className="animate-spin text-red-500" /> : <Trash2 size={20} />}
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Excluir Lista
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid de Tabela de Itens */}
      {list.items && list.items.length > 0 ? (
        <div className="w-full">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr] sm:grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-3 border-b border-border/50 text-xs font-semibold uppercase text-muted-foreground mb-4">
            <div className="hidden sm:flex items-center justify-center w-8">#</div>
            <div>Título</div>
            <div className="hidden sm:block min-w-[120px]">Adicionado em</div>
            {isOwner && <div className="hidden sm:flex justify-end w-10"></div>}
          </div>

          {/* Table Body */}
          <div className="flex flex-col gap-2">
            {[...list.items].sort((a,b) => a.position - b.position).map((item, index) => (
              <div 
                key={item.id}
                className="group grid grid-cols-[1fr] sm:grid-cols-[auto_1fr_auto_auto] gap-4 items-center px-4 py-3 hover:bg-white/5 rounded-xl transition-colors relative"
              >
                {/* Index / Hover Play indicator */}
                <div className="hidden sm:flex items-center justify-center w-8 text-muted-foreground font-medium text-sm">
                  <span className="group-hover:hidden">{index + 1}</span>
                  <Music size={14} className="hidden group-hover:block text-green-500" />
                </div>

                {/* Cover and Info */}
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-12 h-12 flex-shrink-0 bg-secondary rounded overflow-hidden">
                    {item.album?.cover_url ? (
                      <img src={item.album.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Music size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center truncate">
                    <Link 
                      to={`/item/${item.album_spotify_id}`}
                      className="text-white font-medium truncate hover:underline hover:text-green-400"
                    >
                      {item.album?.name || 'Álbum Desconhecido'}
                    </Link>
                    <Link 
                      to={`/search?q=${item.album?.artist_name}`}
                      className="text-muted-foreground text-sm truncate hover:underline"
                    >
                      {item.album?.artist_name || 'Artista Desconhecido'}
                    </Link>
                  </div>
                </div>

                {/* Added at Date */}
                <div className="hidden sm:flex items-center min-w-[120px] text-sm text-muted-foreground">
                  {formatDate(item.added_at)}
                </div>

                {/* Actions (Owner only) */}
                {isOwner && (
                  <div className="absolute sm:relative right-4 sm:right-0 sm:flex justify-end w-10">
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={deleteItemId === item.id}
                      className="p-2 text-muted-foreground/50 opacity-0 group-hover:opacity-100 group-hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all"
                      title="Remover da lista"
                    >
                      {deleteItemId === item.id ? (
                         <Loader2 size={16} className="animate-spin text-red-500" />
                      ) : (
                         <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="py-20 flex flex-col items-center justify-center text-center opacity-80">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6">
            <Music size={32} className="text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Essa lista está vazia</h3>
          <p className="text-muted-foreground mb-8 max-w-sm">
            {isOwner 
              ? 'Comece adicionando alguns álbuns à sua lista pela página de busca.'
              : 'Esta lista ainda não possui nenhum álbum.'}
          </p>
          {isOwner && (
            <button
              onClick={() => navigate('/search')}
              className="px-8 py-3 bg-white text-black font-semibold rounded-full hover:scale-105 transition-transform"
            >
              Procurar Álbuns
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ListDetailPage;
