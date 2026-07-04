import React, { useState, useMemo, useEffect } from 'react';
import { PokemonCard, CartItem, SearchFilters } from './types';
import { CARD_DATA } from './data';
import ParticleBackground from './components/ParticleBackground';
import SearchPanel from './components/SearchPanel';
import CardGrid from './components/CardGrid';
import CardDetailModal from './components/CardDetailModal';
import CartDrawer from './components/CartDrawer';
import WishlistPanel from './components/WishlistPanel';
import { 
  ShoppingBag, Sparkles, Clock, Volume2, VolumeX, Shield, Zap, Flame, Award, Globe, 
  ExternalLink, ArrowUpRight, CheckCircle2, Heart 
} from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  // Main app state
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    types: [],
    rarities: [],
    minPrice: 50,
    maxPrice: 5000,
    minHp: 50,
    maxHp: 340,
    sortBy: 'price-desc',
  });

  const [selectedCard, setSelectedCard] = useState<PokemonCard | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'singles' | 'sealed'>('singles');
  const [audioActive, setAudioActive] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string; cardName: string }[]>([]);

  // Favorites / Wishlist State
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('sunrise_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('sunrise_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (cardId: string) => {
    setFavorites((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  };

  // Dynamically augment CARD_DATA to include isFavorited boolean
  const augmentedCards = useMemo(() => {
    return CARD_DATA.map((card) => ({
      ...card,
      isFavorited: favorites.includes(card.id),
    }));
  }, [favorites]);

  // List of favorited cards
  const favoritedCards = useMemo(() => {
    return augmentedCards.filter((card) => card.isFavorited);
  }, [augmentedCards]);

  const selectedCardWithFavorite = useMemo(() => {
    if (!selectedCard) return null;
    const found = augmentedCards.find((c) => c.id === selectedCard.id);
    return found || selectedCard;
  }, [selectedCard, augmentedCards]);

  // Time stats
  const [tokyoTime, setTokyoTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Tokyo',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      setTokyoTime(new Intl.DateTimeFormat('pt-BR', options).format(new Date()));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter & sort cards logic
  const filteredCards = useMemo(() => {
    return augmentedCards.filter((card) => {
      // Tab filter (Cartas Avulsas vs Produtos Selados)
      if (activeTab === 'singles' && card.id.startsWith('BOX-')) {
        return false;
      }
      if (activeTab === 'sealed' && !card.id.startsWith('BOX-')) {
        return false;
      }

      // Text filter
      if (filters.query) {
        const q = filters.query.toLowerCase();
        const matchesName = card.name.toLowerCase().includes(q);
        const matchesJapanese = card.japaneseName.toLowerCase().includes(q);
        const matchesRarity = card.rarity.toLowerCase().includes(q);
        const matchesType = card.type.toLowerCase().includes(q);
        const matchesExpansion = card.expansion.toLowerCase().includes(q);
        const matchesCondition = card.condition.toLowerCase().includes(q);
        const matchesAttack = card.attacks.some(
          (atk) => atk.name.toLowerCase().includes(q) || atk.description.toLowerCase().includes(q)
        );

        if (!matchesName && !matchesJapanese && !matchesRarity && !matchesType && !matchesExpansion && !matchesCondition && !matchesAttack) {
          return false;
        }
      }

      // Type filter
      if (!card.id.startsWith('BOX-') && filters.types.length > 0 && !filters.types.includes(card.type)) {
        return false;
      }

      // Rarity filter
      if (!card.id.startsWith('BOX-') && filters.rarities.length > 0 && !filters.rarities.includes(card.rarity)) {
        return false;
      }

      // Price filter
      if (card.price < filters.minPrice || card.price > filters.maxPrice) {
        return false;
      }

      // HP filter
      if (!card.id.startsWith('BOX-') && card.hp > 0 && card.hp < filters.minHp) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'price-asc') return a.price - b.price;
      if (filters.sortBy === 'price-desc') return b.price - a.price;
      if (filters.sortBy === 'hp-desc') return b.hp - a.hp;
      if (filters.sortBy === 'name-asc') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [filters, augmentedCards, activeTab]);

  // Cart operations
  const handleAddToCart = (card: PokemonCard) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.card.id === card.id);
      if (existing) {
        return prev.map((item) => 
          item.card.id === card.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { card, quantity: 1 }];
    });

    // Spawn a toast notification
    const newToast = {
      id: Math.random().toString(),
      message: 'adicionado ao carrinho',
      cardName: card.name
    };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 3000);
  };

  const handleUpdateCartQuantity = (cardId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(cardId);
      return;
    }
    setCart((prev) => 
      prev.map((item) => (item.card.id === cardId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveFromCart = (cardId: string) => {
    setCart((prev) => prev.filter((item) => item.card.id !== cardId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const totalCartItemsCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  const handleResetFilters = () => {
    setFilters({
      query: '',
      types: [],
      rarities: [],
      minPrice: 50,
      maxPrice: 5000,
      minHp: 50,
      maxHp: 340,
      sortBy: 'price-desc',
    });
  };

  return (
    <div className="min-h-screen bg-cyber-darker relative bg-grid-pattern text-slate-100 pb-20 overflow-x-hidden selection:bg-neon-purple selection:text-white">
      {/* Top Free Shipping Announcement Banner */}
      <div className="bg-gradient-to-r from-neon-purple/90 via-black to-neon-green/90 border-b border-zinc-800/80 text-center py-2.5 px-4 text-[11px] md:text-xs font-display font-semibold select-none flex items-center justify-center gap-2 relative overflow-hidden z-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <span className="inline-block animate-pulse text-neon-green text-sm">🚚</span>
        <span className="text-zinc-200 tracking-wider uppercase">
          Frete Grátis para todo o Brasil em compras acima de <span className="text-neon-green font-bold font-mono text-xs">R$ 600,00</span>!
        </span>
      </div>

      {/* Absolute particle backdrop canvas */}
      <ParticleBackground />

      {/* Real-time ambient cyber-overlay for grading atmospheric lighting */}
      <div className="cyber-overlay" />

      {/* Slide-out Cart Toasts list */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-cyber-card/95 border border-neon-green/40 rounded-xl p-3.5 shadow-[0_0_15px_rgba(0,255,102,0.15)] flex items-center gap-3 pointer-events-auto backdrop-blur-md"
          >
            <div className="w-7 h-7 rounded-full bg-neon-green/10 flex items-center justify-center text-neon-green">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <h4 className="font-display font-bold text-xs text-zinc-100">{toast.cardName}</h4>
              <p className="text-[10px] text-zinc-500 font-mono leading-none mt-0.5 uppercase tracking-wider">{toast.message}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Floating Header Bar */}
      <header className="sticky top-0 z-40 bg-cyber-darker/80 border-b border-zinc-900/90 backdrop-blur-md relative select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          
          {/* Logo Brand Anchor */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded border border-neon-green bg-cyber-dark flex items-center justify-center text-neon-green shadow-neon-green">
              <Zap size={15} />
            </div>
            <div>
              <span className="font-display font-black text-base uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-neon-purple leading-none block">
                Sunrise TCG
              </span>
              <span className="text-[9px] font-mono text-zinc-500 block uppercase tracking-widest leading-none mt-0.5">
                Secret Vault • Setor 09
              </span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="hidden md:flex items-center gap-6 text-xs font-mono">
            {/* Tokyo Clock */}
            <div className="flex items-center gap-2 border-r border-zinc-800 pr-5">
              <Clock size={13} className="text-neon-purple animate-pulse" />
              <span className="text-zinc-500">TÓQUIO:</span>
              <span className="text-neon-purple font-bold tracking-widest min-w-[70px]">{tokyoTime || '00:00:00'}</span>
            </div>

            {/* Catalog Status */}
            <div className="flex items-center gap-2 border-r border-zinc-800 pr-5">
              <Shield size={13} className="text-neon-green" />
              <span className="text-zinc-500">COFRE DE CARTAS:</span>
              <span className="text-neon-green font-bold">SECURE ONLINE</span>
            </div>

            {/* Equalizer deck */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAudioActive(!audioActive)}
                className={`p-1.5 rounded border transition-colors cursor-pointer ${
                  audioActive 
                    ? 'border-neon-green bg-neon-green/5 text-neon-green' 
                    : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
                title={audioActive ? 'Mudar sintetizador' : 'Ativar sintetizador'}
              >
                {audioActive ? <Volume2 size={13} /> : <VolumeX size={13} />}
              </button>
              {audioActive && (
                <div className="flex items-end gap-0.5 h-3">
                  <div className="w-0.5 bg-neon-green animate-bounce" style={{ height: '100%', animationDelay: '0.1s' }} />
                  <div className="w-0.5 bg-neon-green animate-bounce" style={{ height: '60%', animationDelay: '0.4s' }} />
                  <div className="w-0.5 bg-neon-green animate-bounce" style={{ height: '80%', animationDelay: '0.2s' }} />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Wishlist Icon & Trigger */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              className={`relative py-2 px-4 rounded-xl border font-display text-xs font-bold flex items-center gap-2 transition-all duration-300 cursor-pointer ${
                favoritedCards.length > 0
                  ? 'bg-rose-950/30 border-rose-500 text-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.2)] hover:bg-rose-950/50 scale-[1.03]'
                  : 'bg-cyber-dark/50 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <Heart size={15} className={favoritedCards.length > 0 ? 'fill-rose-500' : ''} />
              <span>Favoritos</span>
              {favoritedCards.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-zinc-100 font-mono text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-md animate-scaleIn">
                  {favoritedCards.length}
                </span>
              )}
            </button>

            {/* Cart Icon & Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative py-2 px-4 rounded-xl border font-display text-xs font-bold flex items-center gap-2 transition-all duration-300 cursor-pointer ${
                totalCartItemsCount > 0
                  ? 'bg-neon-green/10 border-neon-green text-neon-green shadow-neon-green hover:bg-neon-green/20 scale-[1.03]'
                  : 'bg-cyber-dark/50 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <ShoppingBag size={15} />
              <span>Carrinho</span>
              {totalCartItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-neon-purple text-zinc-100 font-mono text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-md animate-scaleIn">
                  {totalCartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 md:mt-12 relative z-10 flex flex-col gap-8">
        
        {/* Main Hero Banner with Generated Logo and Cyberpunk aesthetic */}
        <section id="hero-banner-section" className="relative w-full rounded-2xl overflow-hidden border border-zinc-800 bg-cyber-gray/40 shadow-neon-dual p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative select-none">
          <div className="absolute inset-0 bg-dots-pattern opacity-10 pointer-events-none" />
          <div className="scanline-moving opacity-15" />

          {/* Left panel info */}
          <div className="flex-1 text-center md:text-left relative z-10">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3.5">
              <span className="px-2.5 py-0.5 rounded-full bg-neon-green/10 border border-neon-green/30 text-[9px] font-mono text-neon-green tracking-wider uppercase">
                Estilo Cyberpunk Oriental
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-neon-purple/10 border border-neon-purple/30 text-[9px] font-mono text-neon-purple tracking-wider uppercase">
                Colecionáveis de Luxo
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-display font-black text-zinc-100 tracking-tight leading-none mb-4 uppercase">
              Bem-vindo ao <span className="text-neon-green text-neon-green">Sunrise TCG</span>
            </h1>

            <p className="text-zinc-400 text-sm max-w-xl leading-relaxed mb-6 font-sans">
              Somos uma loja focada em Pokemon TCG, Pincipalmente nas coleçoes e produtos japoneses
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <a
                href="#cards-grid-section"
                className="px-5 py-3 bg-gradient-to-r from-neon-purple to-purple-700 hover:from-purple-600 hover:to-neon-purple text-zinc-100 font-display font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(188,19,254,0.15)] hover:shadow-[0_0_25px_rgba(188,19,254,0.3)] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Explorar Cofre</span>
                <ArrowUpRight size={14} />
              </a>

              <button
                onClick={() => {
                  const element = document.getElementById('search-container');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                    setTimeout(() => {
                      const input = document.getElementById('main-search-input');
                      if (input) input.focus();
                    }, 500);
                  }
                }}
                className="px-5 py-3 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 text-zinc-300 font-display font-medium text-xs rounded-xl hover:border-zinc-700 transition-all cursor-pointer"
              >
                Busca Avançada
              </button>
            </div>
          </div>

          {/* Right panel: Showcase of the high-quality generated Brand Logo */}
          <div className="w-full md:w-auto flex justify-center relative z-10">
            <div className="relative p-1.5 rounded-2xl bg-gradient-to-tr from-neon-purple via-zinc-800 to-neon-green shadow-2xl overflow-hidden max-w-[320px] sm:max-w-[380px] group transition-transform duration-500 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform" />
              
              <img
                src="/src/assets/images/sunrise_logo_1783136190528.jpg"
                alt="Sunrise TCG Logo"
                className="w-full h-auto object-cover rounded-xl shadow-lg border border-zinc-950/80"
                referrerPolicy="no-referrer"
              />

              {/* Decorative scan overlay */}
              <div className="absolute top-2 left-2 z-20 bg-cyber-dark/85 border border-zinc-800 px-2 py-0.5 rounded text-[8px] font-mono text-zinc-400">
                OFFICIAL REPLICANT GRAPHIC
              </div>
            </div>
          </div>
        </section>
        
        {/* Cyberpunk Tab Switcher */}
        <div className="flex justify-center md:justify-start gap-4 border-b border-zinc-800/40 pb-4 select-none">
          <button
            onClick={() => setActiveTab('singles')}
            className={`px-6 py-3 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer border ${
              activeTab === 'singles'
                ? 'bg-neon-green/10 border-neon-green text-neon-green shadow-[0_0_15px_rgba(0,255,102,0.15)] scale-[1.02]'
                : 'bg-cyber-dark/40 border-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800'
            }`}
          >
            <span>🃏</span>
            <span>Cartas Avulsas</span>
          </button>
          <button
            onClick={() => setActiveTab('sealed')}
            className={`px-6 py-3 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer border ${
              activeTab === 'sealed'
                ? 'bg-neon-purple/10 border-neon-purple text-neon-purple shadow-[0_0_15px_rgba(188,19,254,0.15)] scale-[1.02]'
                : 'bg-cyber-dark/40 border-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800'
            }`}
          >
            <span>📦</span>
            <span>Produtos Selados</span>
          </button>
        </div>

        {/* Dynamic Cards Search Engine Container */}
        <section id="search-section" className="flex flex-col gap-5">
          <SearchPanel
            filters={filters}
            setFilters={setFilters}
            onReset={handleResetFilters}
          />
        </section>

        {/* Primary Content Grid */}
        <section id="cards-grid-section" className="scroll-mt-24">
          <div className="flex items-center justify-between mb-6 select-none">
            <div className="flex items-center gap-2">
              <Sparkles className="text-neon-green" size={16} />
              <h2 className="font-display font-black text-lg md:text-xl uppercase tracking-wider text-zinc-100">
                {activeTab === 'singles' ? 'Cartas Avulsas Raras' : 'Produtos Selados Originais'}
              </h2>
            </div>
            <span className="font-mono text-[11px] text-zinc-500 bg-cyber-dark/50 px-2.5 py-1 rounded-md border border-zinc-900">
              ENCONTRADOS: <span className="text-neon-green font-bold">{filteredCards.length}</span>
            </span>
          </div>

          <CardGrid
            cards={filteredCards}
            onSelectCard={(card) => setSelectedCard(card)}
            onAddToCart={handleAddToCart}
            onToggleFavorite={toggleFavorite}
          />
        </section>

        {/* Extra Interactive Section: TCG Authentication Standards */}
        <section id="security-assurance-section" className="grid grid-cols-1 md:grid-cols-3 gap-5 select-none mt-4">
          
          <div className="p-4 bg-cyber-card/60 border border-zinc-900 rounded-xl flex gap-4 items-start hover:border-zinc-800 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-neon-green/10 border border-neon-green/30 flex items-center justify-center text-neon-green flex-shrink-0">
              <Award size={18} />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-zinc-200">Autenticidade Blindada</h4>
              <p className="text-xs text-zinc-500 font-sans leading-relaxed mt-0.5">
                Todas as nossas cartas raras passam por sensores espectrais e curadoria física estrita para garantir sua legitimidade original.
              </p>
            </div>
          </div>

          <div className="p-4 bg-cyber-card/60 border border-zinc-900 rounded-xl flex gap-4 items-start hover:border-zinc-800 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center text-neon-purple flex-shrink-0">
              <Zap size={18} />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-zinc-200">Graus PSA / BGS</h4>
              <p className="text-xs text-zinc-500 font-sans leading-relaxed mt-0.5">
                Especializados em cartas catalogadas com pontuações de altíssimo nível (Mints e Gem Mints), preservados em cases acrílicos fotônicos.
              </p>
            </div>
          </div>

          <div className="p-4 bg-cyber-card/60 border border-zinc-900 rounded-xl flex gap-4 items-start hover:border-zinc-800 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-neon-green/10 border border-neon-green/30 flex items-center justify-center text-neon-green flex-shrink-0">
              <Globe size={18} />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-zinc-200">Logística de Neo-Tokyo</h4>
              <p className="text-xs text-zinc-500 font-sans leading-relaxed mt-0.5">
                Utilizamos entregas automatizadas via drone ou despachos postais rápidos ultra-protegidos contra umidade e interferências mecânicas.
              </p>
            </div>
          </div>

        </section>

      </main>

      {/* Footer copyright */}
      <footer className="mt-20 border-t border-zinc-900 py-8 text-center text-xs font-mono text-zinc-600 relative z-10 select-none">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 SUNRISE TCG. ALL RIGHTS RESERVED. SEC-09 DISTRICT.</span>
          <div className="flex gap-4">
            <span className="hover:text-neon-green cursor-pointer">TERMOS DE USO</span>
            <span className="hover:text-neon-purple cursor-pointer">PRIVACIDADE</span>
          </div>
        </div>
      </footer>

      {/* Card Detail Modal */}
      <CardDetailModal
        card={selectedCardWithFavorite}
        onClose={() => setSelectedCard(null)}
        onAddToCart={handleAddToCart}
        onToggleFavorite={toggleFavorite}
      />

      {/* Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
      />

      {/* Wishlist Panel Drawer */}
      <WishlistPanel
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        favoritedCards={favoritedCards}
        onToggleFavorite={toggleFavorite}
        onAddToCart={handleAddToCart}
        onSelectCard={(card) => setSelectedCard(card)}
      />
    </div>
  );
}
