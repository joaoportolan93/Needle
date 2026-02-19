import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Heart, ChevronLeft, ChevronRight, Music, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPublicLists, getUserLists, createList } from '../services/api';

// ===================== List Card Component =====================
// Renders a 2x2 album cover grid with item count badge, title, description, and user avatar

const ListCard = ({ list }) => {
  // Get up to 4 covers for the grid
  const covers = (list.items || [])
    .slice(0, 4)
    .map(item => item.album?.cover_url)
    .filter(Boolean);

  // Fill remaining slots with placeholder gradient
  while (covers.length < 4) {
    covers.push(null);
  }

  return (
    <Link
      to={`/lists/${list.id}`}
      className="group flex-shrink-0 w-44 sm:w-48 block"
    >
      {/* 2x2 Cover Grid */}
      <div className="relative aspect-square rounded-xl overflow-hidden shadow-lg mb-2">
        <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
          {covers.slice(0, 4).map((url, i) => (
            <div key={i} className="relative overflow-hidden">
              {url ? (
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-800/30 to-purple-900/30 flex items-center justify-center">
                  <Music size={16} className="text-muted-foreground/40" />
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Item count badge */}
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
          {list.items_count} itens
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-green-400 transition-colors">
        {list.title}
      </h3>

      {/* Description */}
      {list.description && (
        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
          {list.description}
        </p>
      )}

      {/* User avatar + likes */}
      <div className="flex items-center gap-1.5 mt-1.5">
        {list.user?.avatar_url ? (
          <img
            src={list.user.avatar_url}
            alt={list.user.username}
            className="w-5 h-5 rounded-full border border-border"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-green-700 flex items-center justify-center text-[9px] text-white font-bold">
            {list.user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        )}
        <span className="text-[10px] text-muted-foreground">
          {list.user?.username || 'Anônimo'}
        </span>
      </div>
    </Link>
  );
};


// ===================== Horizontal Scroll Section =====================

const ScrollSection = ({ title, lists, rightLabel, onRightClick }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const distance = 220;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -distance : distance,
        behavior: 'smooth',
      });
    }
  };

  if (!lists || lists.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg sm:text-xl font-bold text-foreground">{title}</h2>
        {rightLabel && (
          <button
            onClick={onRightClick}
            className="text-xs text-muted-foreground hover:text-green-400 transition-colors"
          >
            {rightLabel}
          </button>
        )}
      </div>

      <div className="relative group/scroll">
        {/* Left arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-card/90 border border-border shadow-lg flex items-center justify-center opacity-0 group-hover/scroll:opacity-100 transition-opacity hover:bg-accent"
        >
          <ChevronLeft size={16} className="text-foreground" />
        </button>

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {lists.map(list => (
            <ListCard key={list.id} list={list} />
          ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-card/90 border border-border shadow-lg flex items-center justify-center opacity-0 group-hover/scroll:opacity-100 transition-opacity hover:bg-accent"
        >
          <ChevronRight size={16} className="text-foreground" />
        </button>
      </div>
    </section>
  );
};


// ===================== Create List Modal =====================

const CreateListModal = ({ isOpen, onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      const newList = await createList({
        title: title.trim(),
        description: description.trim() || undefined,
        is_public: isPublic,
      });
      onCreated(newList);
      setTitle('');
      setDescription('');
      onClose();
    } catch (err) {
      console.error('Erro ao criar lista:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <h2 className="text-xl font-bold text-foreground mb-4">Criar Nova Lista</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Top Álbuns de 2024"
              className="w-full p-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
              maxLength={200}
              required
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Descrição (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Do que se trata essa lista?"
              rows={3}
              className="w-full p-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 accent-green-500 rounded"
            />
            Lista pública (visível para todos)
          </label>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex-1 py-2.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// ===================== Main Lists Page =====================

const ListsPage = () => {
  const { user } = useAuth();
  const [myLists, setMyLists] = useState([]);
  const [communityLists, setCommunityLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const fetchLists = async () => {
      setIsLoading(true);
      try {
        // Fetch community lists (all public)
        const publicLists = await getPublicLists(30);
        setCommunityLists(publicLists);

        // Fetch user's own lists if logged in
        if (user?.id) {
          const userLists = await getUserLists(user.id);
          setMyLists(userLists);
        }
      } catch (err) {
        console.error('Erro ao carregar listas:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLists();
  }, [user?.id]);

  const handleListCreated = (newList) => {
    setMyLists(prev => [newList, ...prev]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Minhas Listas</h1>
        {user && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-600 text-white font-semibold text-sm hover:bg-green-500 transition-colors shadow-lg hover:shadow-green-500/20"
          >
            <Plus size={16} />
            Criar Nova Lista
          </button>
        )}
      </div>

      {/* Section: My Lists */}
      {user && myLists.length > 0 && (
        <ScrollSection
          title="Listas que Você Criou"
          lists={myLists}
        />
      )}

      {/* Section: Empty state for your lists */}
      {user && myLists.length === 0 && (
        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3">Listas que Você Criou</h2>
          <div className="bg-card border border-border border-dashed rounded-xl p-8 text-center">
            <Music size={32} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">
              Você ainda não criou nenhuma lista.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-3 text-green-400 text-sm hover:underline"
            >
              Criar sua primeira lista →
            </button>
          </div>
        </section>
      )}

      {/* Section: Community Popular Lists */}
      <ScrollSection
        title="Listas Populares da Comunidade"
        lists={communityLists}
        rightLabel="Ver mais"
      />

      {/* If no community lists exist either */}
      {communityLists.length === 0 && (
        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3">Listas da Comunidade</h2>
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm">
              Nenhuma lista pública encontrada. Seja o primeiro a criar uma!
            </p>
          </div>
        </section>
      )}

      {/* Create List Modal */}
      <CreateListModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleListCreated}
      />
    </div>
  );
};

export default ListsPage;
