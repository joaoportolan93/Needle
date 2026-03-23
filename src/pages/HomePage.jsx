import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSpotifyNewReleases, getSpotifyCategories } from '../services/api';
import { Star, ChevronRight, ThumbsUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../components/ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import ActivityFeed from '../components/ActivityFeed';

const HomePage = () => {
  const [newReleases, setNewReleases] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const releasesData = await getSpotifyNewReleases(10);
        setNewReleases(releasesData.albums.items || []);
        const categoriesData = await getSpotifyCategories(6);
        setCategories(categoriesData.categories.items || []);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  // Mini hero review cards
  const heroReviews = [
    { id: 1, user: "Hanna S.", avatar: "https://i.pravatar.cc/150?u=hanna", rating: 5, text: "Musicalmente incrível...", date: "20/03/2025", likes: 8 },
    { id: 2, user: "Mark R.", avatar: "https://i.pravatar.cc/150?u=mark", rating: 4, text: "Uma obra de arte sonora.", date: "15/03/2025", likes: 2 },
  ];

  const MiniReviewCard = ({ review, className = "" }) => (
    <div className={`bg-card/80 backdrop-blur-md border border-border p-3 rounded-xl text-foreground shadow-xl ${className}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <Avatar className="w-6 h-6">
          <AvatarImage src={review.avatar} />
          <AvatarFallback className="text-[9px]">{review.user[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h4 className="text-[11px] font-bold leading-none">{review.user}</h4>
          <div className="flex text-yellow-400 mt-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={8} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "text-yellow-400" : "text-gray-500"} />
            ))}
          </div>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">"{review.text}"</p>
      <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1.5">
        <span>{review.date}</span>
        <div className="flex items-center gap-0.5"><ThumbsUp size={9} /> {review.likes}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24 lg:pb-8 overflow-x-hidden">

      {/* ── HERO ── Compact horizontal banner */}
      <section className="relative overflow-hidden px-4 sm:px-8 py-6 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Text */}
          <div className="flex-1 z-10 text-center lg:text-left">
            <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground leading-tight mb-2">
              {t('home.heroTitle1')} <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">{t('home.heroTitle2')}</span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto lg:mx-0 leading-relaxed">
              {t('home.heroDescription')}
            </p>
            <div className="flex gap-3 mt-4 justify-center lg:justify-start">
              <Link to="/search" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
                {t('home.exploreMusic')}
              </Link>
              <Link to="/profile" className="px-4 py-2 border border-border hover:bg-accent text-sm font-semibold rounded-lg transition-colors">
                {t('home.myProfile')}
              </Link>
            </div>
          </div>

          {/* Floating mini review cards - show only on lg */}
          <div className="hidden lg:flex flex-row gap-3 items-center flex-shrink-0 relative">
            <MiniReviewCard review={heroReviews[0]} className="w-44 rotate-[-4deg]" />
            <MiniReviewCard review={heroReviews[1]} className="w-44 rotate-[4deg] mt-6" />
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT: 3-column grid on desktop ── */}
      <div className="px-4 sm:px-8 max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left: New Releases Carousel + Community Feed */}
        <div className="xl:col-span-2 space-y-6">

          {/* New Releases */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-foreground">{t('home.newReleases')}</h2>
              <Link to="/search?type=album" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5">
                {t('home.seeMore')} <ChevronRight size={14} />
              </Link>
            </div>
            <Carousel className="w-full">
              <CarouselContent className="-ml-2">
                {newReleases.map((album) => (
                  <CarouselItem key={album.id} className="pl-2 basis-1/2 sm:basis-1/3 md:basis-1/4">
                    <Link to={`/item/${album.id}`} className="block group">
                      <div className="relative aspect-square overflow-hidden rounded-lg mb-2 shadow">
                        <img
                          src={album.images[0]?.url || 'https://via.placeholder.com/300'}
                          alt={album.name}
                          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-white/10 backdrop-blur-md p-2 rounded-full">
                            <Star className="text-yellow-400 fill-yellow-400" size={18} />
                          </div>
                        </div>
                      </div>
                      <h3 className="text-foreground text-sm font-semibold truncate group-hover:text-indigo-400 transition-colors">{album.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{album.artists[0].name}</p>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-0 bg-card/80 border-border hover:bg-indigo-600 hover:text-white text-foreground" />
              <CarouselNext className="right-0 bg-card/80 border-border hover:bg-indigo-600 hover:text-white text-foreground" />
            </Carousel>
          </section>

          {/* Community Feed */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-foreground">{t('home.communityFeed')}</h2>
              <Link to="/feed" className="text-xs text-green-400 hover:text-green-300">{t('home.seeMore')}</Link>
            </div>
            <ActivityFeed />
          </section>
        </div>

        {/* Right: Genres */}
        <div className="space-y-6">
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-foreground">{t('home.exploreByGenre')}</h2>
              <Link to="/search" className="text-xs text-green-400 hover:text-green-300">{t('home.seeMore')}</Link>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat, idx) => (
                <Link to={`/search?category=${cat.id}`} key={cat.id} className="group relative aspect-square overflow-hidden rounded-lg">
                  <img
                    src={cat.icons[0]?.url || `https://picsum.photos/200?random=${idx}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-60 group-hover:opacity-40"
                    alt={cat.name}
                  />
                  <div className="absolute inset-0 flex items-end p-2 bg-gradient-to-t from-black/90 via-transparent">
                    <span className="font-bold text-white text-xs">{cat.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
};

export default HomePage;
