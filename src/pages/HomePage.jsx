import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSpotifyNewReleases, getSpotifyCategories } from '../services/api';
import { Star, ChevronRight, MessageSquare, ThumbsUp, MoreHorizontal } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../components/ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Card, CardContent } from "../components/ui/card";

const HomePage = () => {
  const [newReleases, setNewReleases] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Mock data for Hero Reviews
  const heroReviews = [
    {
      id: 1,
      user: "Hanna S.",
      avatar: "https://i.pravatar.cc/150?u=hanna",
      rating: 5,
      text: "Isere are newbusiness atribut so musically tremowmeminced bo tbm...",
      date: "20/03/2025",
      likes: 8
    },
    {
      id: 2,
      user: "Mark R.",
      avatar: "https://i.pravatar.cc/150?u=mark",
      rating: 4,
      text: "Hats shoald kiscrin free review",
      date: "15/03/2025",
      likes: 2
    },
    {
      id: 3,
      user: "Diana P.",
      avatar: "https://i.pravatar.cc/150?u=diana",
      rating: 5,
      text: "Ihilare trouslt nictin musiss from you grown inderuss and wrrite muith",
      date: "21/02/2025",
      likes: 11
    }
  ];

  const ReviewCard = ({ review, className = "" }) => (
    <div className={`bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-xl text-white shadow-xl ${className}`}>
      <div className="flex items-center gap-3 mb-2">
        <Avatar className="w-8 h-8">
          <AvatarImage src={review.avatar} />
          <AvatarFallback>{review.user[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h4 className="text-xs font-bold">{review.user}</h4>
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "text-yellow-400" : "text-gray-500"} />
            ))}
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-300 mb-3 line-clamp-2 leading-relaxed">"{review.text}"</p>
      <div className="flex justify-between items-center text-xs text-gray-400">
        <span>{review.date}</span>
        <div className="flex items-center gap-1">
          <ThumbsUp size={12} /> {review.likes}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24 lg:pb-20 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-8 pt-8 sm:pt-12 pb-8 sm:pb-16 flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto">
        <div className="lg:w-1/2 z-10 text-center lg:text-left">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-4" style={{ fontFamily: "Lato, bold" }}>
            Muito Bem-Vindos ao Sonora!
          </h1>
          <p className="text-base sm:text-lg text-gray-400 max-w-lg leading-relaxed mx-auto lg:mx-0" style={{ fontFamily: "Lato, bold" }}>
            Inspirado em um site de filmes e em outros sites de música, Sonora é uma nova plataforma de reviews de música que permite aos usuários descobrir, avaliar e compartilhar suas opiniões profissionais (ou não) sobre álbuns, artistas e músicas.
          </p>
        </div>

        {/* Floating cards - Hidden on mobile, visible on larger screens */}
        <div className="hidden lg:block lg:w-1/2 relative h-[300px] w-full mt-10 lg:mt-0 perspective-1000">
          <ReviewCard review={heroReviews[0]} className="absolute top-10 left-10 z-20 w-64 rotate-[-6deg] animate-in slide-in-from-right-10 duration-700" />
          <ReviewCard review={heroReviews[1]} className="absolute -top-5 right-10 z-10 w-60 rotate-[6deg] opacity-80" />
          <ReviewCard review={heroReviews[2]} className="absolute bottom-5 right-20 z-30 w-72 rotate-[-3deg] shadow-indigo-500/20" />
        </div>
      </section>

      {/* New Releases Section - Carousel */}
      <section className="px-4 sm:px-8 mb-10 sm:mb-16 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Novos Lançamentos</h2>
          <Link to="/search?type=album" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center">
            Ver mais <ChevronRight size={16} />
          </Link>
        </div>

        <Carousel className="w-full">
          <CarouselContent className="-ml-2 sm:-ml-4">
            {newReleases.map((album) => (
              <CarouselItem key={album.id} className="pl-2 sm:pl-4 basis-1/2 sm:basis-1/3 lg:basis-1/5">
                <Link to={`/item/${album.id}`} className="block group">
                  <div className="relative aspect-square overflow-hidden rounded-xl mb-3 shadow-lg">
                    <img
                      src={album.images[0]?.url || 'https://via.placeholder.com/300'}
                      alt={album.name}
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-white/10 backdrop-blur-md p-3 rounded-full">
                        <Star className="text-yellow-400 fill-yellow-400" size={24} />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-white font-semibold truncate group-hover:text-indigo-400 transition-colors">{album.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{album.artists[0].name}</p>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} size={12} className="text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0 bg-black/50 border-none hover:bg-indigo-600 text-white" />
          <CarouselNext className="right-0 bg-black/50 border-none hover:bg-indigo-600 text-white" />
        </Carousel>
      </section>

      <div className="px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12 max-w-7xl mx-auto">
        {/* Community Feed */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <div className="flex items-end justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Feed da Comunidade</h2>
            <Link to="/feed" className="text-sm text-green-400 hover:text-green-300">Ver mais</Link>
          </div>

          <div className="space-y-4">
            {/* Mock Feed Item 1 */}
            <div className="bg-[#11111e] rounded-xl p-5 border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src="https://i.pravatar.cc/150?u=ryo" />
                    <AvatarFallback>RY</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-white text-sm">Ryokuoushoku</h4>
                    <p className="text-xs text-gray-500">03/07/2025</p>
                  </div>
                </div>
                <button className="text-gray-500 hover:text-white"><MoreHorizontal size={20} /></button>
              </div>
              <div className="mb-2">
                <div className="flex text-yellow-400 mb-2">
                  {[1, 2, 3, 4, 0].map((star, i) => (
                    <Star key={i} size={14} fill={star ? "currentColor" : "none"} className={star ? "text-yellow-400" : "text-gray-600"} />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Novos e tenha critiqur semtivio ve productão de um ari consat! Eramado um homego music critique e discovery.
                </p>
              </div>
              <div className="flex gap-4 mt-4 pt-4 border-t border-white/5 text-gray-500 text-xs">
                <button className="flex items-center gap-1 hover:text-white transition-colors"><ThumbsUp size={14} /> 1 Aprovação</button>
                <button className="flex items-center gap-1 hover:text-white transition-colors"><MessageSquare size={14} /> Comentar</button>
              </div>
            </div>

            {/* Mock Feed Item 2 */}
            <div className="bg-[#11111e] rounded-xl p-5 border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src="https://i.pravatar.cc/150?u=porno" />
                    <AvatarFallback>PO</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-white text-sm">PortoGraffitti</h4>
                    <p className="text-xs text-gray-500">10/04/2025</p>
                  </div>
                </div>
                <button className="text-gray-500 hover:text-white"><MoreHorizontal size={20} /></button>
              </div>
              <div className="mb-2">
                <p className="text-gray-300 text-sm leading-relaxed">
                  Frada favorrimer um discussiòa etta discussidad?
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Categories / Genres */}
        <div className="order-1 lg:order-2">
          <div className="flex items-end justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Explorar por Gênero</h2>
            <Link to="/search" className="text-sm text-green-400 hover:text-green-300">Ver mais</Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-2 gap-2 sm:gap-3">
            {categories.map((cat, idx) => (
              <Link to={`/search?category=${cat.id}`} key={cat.id} className="group relative aspect-square overflow-hidden rounded-lg">
                <img
                  src={cat.icons[0]?.url || `https://picsum.photos/200?random=${idx}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-70 group-hover:opacity-50"
                  alt={cat.name}
                />
                <div className="absolute inset-0 flex items-end p-3 bg-gradient-to-t from-black/90 via-transparent">
                  <span className="font-bold text-white text-sm md:text-base">{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

