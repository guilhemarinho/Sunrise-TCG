import React, { useState, useRef } from 'react';
import { PokemonCard } from '../types';
import { TYPE_COLORS } from './SearchPanel';
import { ShoppingCart, Eye, Sparkles, Award, Heart } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

interface CardGridProps {
  cards: PokemonCard[];
  onSelectCard: (card: PokemonCard) => void;
  onAddToCart: (card: PokemonCard) => void;
  onToggleFavorite?: (cardId: string) => void;
}

export default function CardGrid({ cards, onSelectCard, onAddToCart, onToggleFavorite }: CardGridProps) {
  if (cards.length === 0) {
    return (
      <div className="w-full text-center py-16 bg-cyber-dark/40 border border-zinc-800 rounded-xl relative overflow-hidden shadow-inner">
        <div className="absolute inset-0 bg-dots-pattern opacity-10" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full border border-neon-purple/50 flex items-center justify-center text-neon-purple animate-pulse mb-4">
            <Sparkles size={28} />
          </div>
          <h3 className="text-xl font-display font-medium text-zinc-200 mb-1">Nenhuma carta encontrada</h3>
          <p className="text-zinc-500 max-w-md mx-auto text-sm px-4">
            Tente redefinir seus filtros de busca ou use termos mais gerais para encontrar as cartas específicas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
      {cards.map((card) => (
        <PokemonCardItem
          key={card.id}
          card={card}
          onSelect={() => onSelectCard(card)}
          onAddToCart={() => onAddToCart(card)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}

interface PokemonCardItemProps {
  key?: string;
  card: PokemonCard;
  onSelect: () => void;
  onAddToCart: () => void;
  onToggleFavorite?: (cardId: string) => void;
}

function PokemonCardItem({ card, onSelect, onAddToCart, onToggleFavorite }: PokemonCardItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Motion values for the 3D tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Springs for smooth movement
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [15, -15]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-15, 15]), { stiffness: 200, damping: 20 });

  // Glare gradients position
  const glareX = useTransform(x, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(y, [-0.5, 0.5], ['0%', '100%']);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Relative position from -0.5 to 0.5
    const mouseX = (event.clientX - rect.left) / width - 0.5;
    const mouseY = (event.clientY - rect.top) / height - 0.5;

    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  // Condition Badge Color Helper
  const getConditionColor = (cond: string) => {
    if (cond.includes('PSA 10') || cond.includes('BGS 9.5')) {
      return 'from-neon-green/30 to-green-500/10 border-neon-green/40 text-neon-green';
    }
    if (cond.includes('PSA 9')) {
      return 'from-neon-purple/30 to-purple-500/10 border-neon-purple/40 text-neon-purple';
    }
    return 'from-zinc-800/50 to-zinc-900/50 border-zinc-700 text-zinc-400';
  };

  const typeColor = TYPE_COLORS[card.type] || TYPE_COLORS.Colorless;

  return (
    <div
      ref={cardRef}
      className="relative group perspective"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 1000 }}
    >
      {/* Background glow shadow matching card type or rarity */}
      <div 
        className={`absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none z-0 ${
          card.rarity === 'Secret Rare' || card.rarity === 'Special Illustration Rare'
            ? 'bg-gradient-to-tr from-neon-purple via-cyan-400 to-neon-green'
            : 'bg-gradient-to-tr from-neon-purple/50 to-neon-green/50'
        }`}
      />

      <motion.div
        id={`card-item-${card.id}`}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative z-10 w-full bg-cyber-card border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl transition-shadow duration-300 group-hover:shadow-[0_0_25px_rgba(0,255,102,0.15)] flex flex-col h-[460px] cursor-pointer"
        onClick={onSelect}
      >
        {/* Card Header with Name & HP */}
        <div className="p-4 pb-2.5 flex items-center justify-between border-b border-zinc-900/80 relative z-10 select-none">
          <div>
            <h3 className="font-display font-bold text-zinc-100 group-hover:text-white transition-colors flex items-center gap-1.5 leading-tight">
              {card.name}
              {card.isHolo && (
                <Sparkles size={13} className="text-neon-green animate-pulse" />
              )}
            </h3>
            <span className="text-[10px] font-mono text-zinc-500 block leading-none mt-0.5 uppercase tracking-wide">
              {card.japaneseName}
            </span>
          </div>
          <div className="text-right">
            {card.id.startsWith('BOX-') ? (
              <>
                <span className="font-mono text-[11px] text-zinc-400 uppercase tracking-widest block font-medium">BOX</span>
                <span className="font-mono text-xs font-bold text-zinc-200">
                  <span className="text-[10px] text-zinc-500 font-medium mr-0.5">PACKS</span>
                  {card.hp}
                </span>
              </>
            ) : card.hp === 0 ? (
              <>
                <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest block font-medium">TREINADOR</span>
                <span className="font-mono text-xs font-bold text-zinc-200">
                  <span className="text-[9px] text-zinc-500 font-medium mr-0.5">CARD</span>
                  SINGLE
                </span>
              </>
            ) : (
              <>
                <span className="font-mono text-[11px] text-zinc-400 uppercase tracking-widest block font-medium">ex</span>
                <span className="font-mono text-xs font-bold text-zinc-200">
                  <span className="text-[10px] text-zinc-500 font-medium mr-0.5">HP</span>
                  {card.hp}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Card Image Area with Holographic Overlay */}
        <div className="relative flex-1 bg-cyber-dark overflow-hidden flex items-center justify-center p-3 border-b border-zinc-900/60 select-none">
          {/* Holographic Refraction layer */}
          {card.isHolo && (
            <motion.div
              className="absolute inset-0 z-20 pointer-events-none mix-blend-color-dodge opacity-0 group-hover:opacity-75 transition-opacity duration-300"
              style={{
                background: useTransform(
                  [glareX, glareY],
                  ([gx, gy]) => `radial-gradient(circle at ${gx} ${gy}, rgba(0, 255, 102, 0.18) 0%, rgba(188, 19, 254, 0.22) 50%, transparent 100%)`
                )
              }}
            />
          )}

          {/* Glare sweep sheen */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform z-10" />

          {/* Floating random glitter sparkles on hover */}
          {isHovered && card.isHolo && (
            <>
              <div className="glitter-sparkle top-4 left-6" style={{ animationDelay: '0.1s' }} />
              <div className="glitter-sparkle top-12 right-10" style={{ animationDelay: '0.5s' }} />
              <div className="glitter-sparkle bottom-8 left-12" style={{ animationDelay: '0.9s' }} />
              <div className="glitter-sparkle bottom-14 right-6" style={{ animationDelay: '1.3s' }} />
            </>
          )}

          {/* The Artwork itself */}
          <img
            src={card.imageUrl}
            alt={card.name}
            className="w-full h-full object-cover rounded-lg group-hover:scale-[1.03] transition-transform duration-500 relative z-0 border border-zinc-900/60"
            referrerPolicy="no-referrer"
          />

          {/* Favorite Heart Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.(card.id);
            }}
            className={`absolute top-4 right-4 z-30 p-1.5 rounded-full border transition-all duration-300 cursor-pointer ${
              card.isFavorited
                ? 'bg-rose-950/80 border-rose-500 text-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)] scale-[1.05]'
                : 'bg-cyber-dark/85 border-zinc-800 text-zinc-400 hover:text-rose-500 hover:border-rose-500/50'
            }`}
            title={card.isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart size={13} className={card.isFavorited ? 'fill-rose-500' : ''} />
          </button>

          {/* PSA Grade Badge */}
          <div className={`absolute top-4 left-4 z-30 px-2 py-0.5 rounded border text-[10px] font-mono font-bold flex items-center gap-1 bg-gradient-to-r shadow-md ${getConditionColor(card.condition)}`}>
            <Award size={11} />
            {card.condition}
          </div>

          {/* Card Rarity and Number overlay */}
          <div className="absolute bottom-4 left-4 z-30 px-2 py-0.5 rounded bg-cyber-dark/85 border border-zinc-800 text-[9px] font-mono text-zinc-400 select-none">
            {card.cardNumber}
          </div>

          {/* Type Badge */}
          <div className={`absolute bottom-4 right-4 z-30 px-2 py-0.5 rounded border text-[9px] font-mono flex items-center gap-1 ${typeColor.bg} ${typeColor.border} ${typeColor.text} ${typeColor.glow}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {card.type}
          </div>
        </div>

        {/* Card Footer with Price and Actions */}
        <div className="p-4 bg-cyber-dark/45 border-t border-zinc-950 flex flex-col justify-between relative z-10 select-none">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <span className="text-[10px] text-zinc-500 font-mono tracking-wider block">PREÇO DO CARD</span>
              <span className="text-lg font-mono font-bold text-neon-green">
                R$ {card.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 font-mono block">EXPANSÃO</span>
              <span className="text-xs text-zinc-300 font-display font-medium block max-w-[120px] truncate">
                {card.expansion}
              </span>
            </div>
          </div>

          {/* Interactive Actions Grid */}
          <div className="grid grid-cols-5 gap-2" onClick={(e) => e.stopPropagation()}>
            {/* View Details Button */}
            <button
              onClick={onSelect}
              className="col-span-2 py-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-lg text-xs font-display flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer"
            >
              <Eye size={14} />
              <span>Ver</span>
            </button>

            {/* Buy / Cart Button */}
            <button
              onClick={onAddToCart}
              className="col-span-3 py-2 bg-gradient-to-r from-neon-green to-emerald-600 hover:from-emerald-500 hover:to-neon-green text-cyber-dark font-display font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(0,255,102,0.1)] hover:shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:scale-[1.02]"
            >
              <ShoppingCart size={14} />
              <span>Comprar</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
