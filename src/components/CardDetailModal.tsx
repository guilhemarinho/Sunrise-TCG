import React, { useRef, useState } from 'react';
import { PokemonCard, PokemonType } from '../types';
import { TYPE_COLORS } from './SearchPanel';
import { X, ShoppingCart, Sparkles, Award, ShieldAlert, Heart, RefreshCw, Eye, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

interface CardDetailModalProps {
  card: PokemonCard | null;
  onClose: () => void;
  onAddToCart: (card: PokemonCard) => void;
  onToggleFavorite?: (cardId: string) => void;
}

export default function CardDetailModal({ card, onClose, onAddToCart, onToggleFavorite }: CardDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const cardScannerRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullScreen) {
          setIsFullScreen(false);
          setIsZoomed(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, onClose]);

  // Mouse tilt variables for the high-tech 3D scanner
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [20, -20]), { stiffness: 150, damping: 15 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-20, 20]), { stiffness: 150, damping: 15 });

  const glareX = useTransform(x, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(y, [-0.5, 0.5], ['0%', '100%']);

  const holoBg = useTransform(
    [glareX, glareY],
    ([gx, gy]) => `radial-gradient(circle at ${gx} ${gy}, rgba(0, 255, 102, 0.25) 0%, rgba(188, 19, 254, 0.3) 50%, transparent 100%)`
  );

  if (!card) return null;

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardScannerRef.current) return;
    const rect = cardScannerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = (event.clientX - rect.left) / width - 0.5;
    const mouseY = (event.clientY - rect.top) / height - 0.5;

    x.set(mouseX);
    y.set(mouseY);
  };

  const resetRotation = () => {
    setIsRotating(false);
    x.set(0);
    y.set(0);
  };

  // Helper to render type icons
  const renderEnergyIcons = (costs: PokemonType[]) => {
    if (costs.length === 0) return <span className="text-zinc-500 font-mono text-[10px]">None</span>;
    return (
      <div className="flex gap-1.5 items-center select-none">
        {costs.map((cost, idx) => {
          const colors = TYPE_COLORS[cost] || TYPE_COLORS.Colorless;
          return (
            <span
              key={idx}
              title={cost}
              className={`w-4 h-4 rounded-full border text-[9px] font-bold flex items-center justify-center font-mono ${colors.bg} ${colors.border} ${colors.text} ${colors.glow}`}
            >
              {cost[0]}
            </span>
          );
        })}
      </div>
    );
  };

  const typeColor = TYPE_COLORS[card.type] || TYPE_COLORS.Colorless;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-cyber-darker/90 backdrop-blur-md animate-fadeIn">
      {/* Click outside to close */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Cyber Grid ambient overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-15 pointer-events-none" />

      {/* Modal Container */}
      <div
        ref={modalRef}
        id="card-detail-modal"
        className="relative z-10 w-full max-w-4xl bg-cyber-dark border border-zinc-800 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(188,19,254,0.15)] flex flex-col md:flex-row h-full max-h-[90vh] md:max-h-[80vh] md:h-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-40 bg-cyber-dark/80 border border-zinc-800 hover:border-neon-purple p-2 rounded-full text-zinc-400 hover:text-neon-purple transition-colors cursor-pointer"
          title="Fechar"
        >
          <X size={18} />
        </button>

        {/* Column 1: The interactive 3D Hologram Card Scanner */}
        <div className="flex-1 bg-cyber-darker border-b md:border-b-0 md:border-r border-zinc-800/80 flex flex-col items-center justify-center p-6 md:p-8 relative min-h-[350px] md:min-h-0">
          <div className="absolute inset-0 bg-dots-pattern opacity-20 pointer-events-none" />
          
          {/* Neon scanline overlay inside scanner */}
          <div className="scanline-moving opacity-20" />

          {/* Interactive hints */}
          <div className="absolute bottom-4 left-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 uppercase tracking-widest select-none pointer-events-none">
            <RefreshCw size={11} className="text-neon-green animate-spin-slow" />
            <span>Mova o mouse para inclinar o card</span>
          </div>

          <div
            ref={cardScannerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsRotating(true)}
            onMouseLeave={resetRotation}
            className="relative perspective w-[220px] sm:w-[260px] h-[310px] sm:h-[365px] flex items-center justify-center"
            style={{ perspective: 1200 }}
          >
            {/* Background neon ray glow of the scanner */}
            <div className={`absolute -inset-4 rounded-3xl opacity-60 blur-2xl pointer-events-none transition-transform duration-500 ${isRotating ? 'scale-[1.1]' : 'scale-100'} ${typeColor.glow}`} />

            {/* 3D Rotatable Card Representation */}
            <motion.div
              style={{
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
              }}
              className="w-full h-full bg-cyber-card border border-zinc-700/60 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative z-10 flex flex-col cursor-grab active:cursor-grabbing"
            >
              {/* Card Holographic reflection sweep */}
              {card.isHolo && (
                <motion.div
                  className="absolute inset-0 z-20 pointer-events-none mix-blend-color-dodge opacity-80"
                  style={{
                    background: holoBg
                  }}
                />
              )}

              {/* Card illustration area inside the scanner */}
              <div className="p-3.5 pb-2 border-b border-zinc-900/80 flex items-center justify-between font-display relative z-10 select-none">
                <span className="font-bold text-zinc-200 text-sm">{card.name}</span>
                <span className="font-mono text-xs text-zinc-400 font-bold">
                  {card.id.startsWith('BOX-') ? `${card.hp} Packs` : card.hp === 0 ? 'Treinador' : `${card.hp} HP`}
                </span>
              </div>
              
              <div className="flex-1 bg-cyber-dark relative overflow-hidden flex items-center justify-center p-3 select-none">
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="w-full h-full object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                />
                
                {/* PSA grading overlay inside scanner */}
                <div className="absolute top-4 left-4 z-30 px-2 py-0.5 rounded border border-neon-green/30 bg-cyber-dark/85 text-[9px] font-mono font-bold text-neon-green flex items-center gap-1">
                  <Award size={10} />
                  {card.condition}
                </div>

                {/* Full Screen View trigger overlay */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFullScreen(true);
                  }}
                  className="absolute bottom-4 right-4 z-30 p-2 rounded-lg bg-cyber-dark/85 border border-zinc-800 hover:border-neon-green hover:text-neon-green text-zinc-400 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg select-none"
                  title="Ver Arte em Tela Cheia"
                >
                  <Maximize2 size={12} className="text-neon-green" />
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Tela Cheia</span>
                </button>
              </div>

              {/* Card number & type footer */}
              <div className="p-3 bg-cyber-dark/95 border-t border-zinc-900 flex justify-between text-[10px] font-mono text-zinc-500 relative z-10 select-none">
                <span>{card.cardNumber}</span>
                <span>{card.expansion}</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Column 2: Stats, Attacks & Add to Cart */}
        <div className="flex-1 flex flex-col p-6 md:p-8 overflow-y-auto max-h-[50vh] md:max-h-none">
          {/* Card Title & Meta */}
          <div className="mb-5 select-none">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`px-2.5 py-0.5 rounded border text-[10px] font-mono font-bold flex items-center gap-1 ${typeColor.bg} ${typeColor.border} ${typeColor.text} ${typeColor.glow}`}>
                {card.type}
              </span>
              <span className="px-2.5 py-0.5 rounded border border-neon-purple/30 bg-neon-purple/5 text-[10px] font-mono text-neon-purple font-medium">
                {card.rarity}
              </span>
              <span className="px-2.5 py-0.5 rounded border border-zinc-800 bg-cyber-dark/50 text-[10px] font-mono text-zinc-400 font-medium">
                {card.condition}
              </span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-display font-black text-zinc-100 flex items-center gap-2 tracking-tight">
              {card.name}
              {card.isHolo && <Sparkles size={18} className="text-neon-green animate-pulse" />}
            </h2>
            <div className="text-xs font-mono text-zinc-500 block uppercase tracking-wider mt-0.5">
              {card.japaneseName} • ILUSTRADOR: {card.illustrator}
            </div>
          </div>

          {/* Description text with Full Screen trigger */}
          <div className="mb-6 p-3.5 bg-cyber-card border border-zinc-800/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs md:text-sm text-zinc-400 italic font-sans leading-relaxed flex-1">
              "{card.description}"
            </p>
            <button
              onClick={() => setIsFullScreen(true)}
              className="py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-neon-green/50 text-[11px] font-display font-medium text-zinc-300 hover:text-neon-green rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer flex-shrink-0 self-end sm:self-center"
            >
              <Maximize2 size={12} />
              <span>Ampliar Arte</span>
            </button>
          </div>

          {/* Attacks Listing */}
          <div className="mb-6">
            <h4 className="text-xs font-display font-semibold tracking-wider text-neon-green uppercase mb-3 flex items-center gap-1.5 select-none">
              {card.id.startsWith('BOX-') ? (
                <>
                  <Award size={12} />
                  Detalhes do Produto Japonês
                </>
              ) : (
                <>
                  <Heart size={12} />
                  Ataques & Habilidades
                </>
              )}
            </h4>
            <div className="flex flex-col gap-3">
              {card.id.startsWith('BOX-') ? (
                card.attacks.map((atk, index) => (
                  <div
                    key={index}
                    className="p-3.5 bg-cyber-dark/65 border border-zinc-800/80 rounded-xl hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-display font-bold text-sm text-zinc-200">
                        {atk.name}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-sans leading-normal">
                      {atk.description}
                    </p>
                  </div>
                ))
              ) : (
                card.attacks.map((atk, index) => (
                  <div
                    key={index}
                    className="p-3.5 bg-cyber-dark/65 border border-zinc-800/80 rounded-xl hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2.5">
                        {renderEnergyIcons(atk.cost)}
                        <span className="font-display font-bold text-sm text-zinc-200">
                          {atk.name}
                        </span>
                      </div>
                      {atk.damage && (
                        <span className="font-mono text-sm font-bold text-zinc-100">
                          {atk.damage}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 font-sans leading-normal">
                      {atk.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Table: Weakness, Resistance, Retreat Cost */}
          {!card.id.startsWith('BOX-') && (
            <div className="grid grid-cols-3 gap-3 border-t border-b border-zinc-800/60 py-3.5 mb-6 text-xs font-mono select-none">
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase mb-0.5">Fraqueza</span>
                <span className="text-zinc-300 font-semibold">{card.weakness}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase mb-0.5">Resistência</span>
                <span className="text-zinc-300 font-semibold">{card.resistance}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase mb-0.5">Custo de Recuo</span>
                <span className="text-zinc-300 font-semibold">
                  {card.retreatCost > 0 ? Array(card.retreatCost).fill('★').join(' ') : 'Free'}
                </span>
              </div>
            </div>
          )}

          {/* Bottom Action Section: Price & Cart */}
          <div className="mt-auto pt-4 border-t border-zinc-900 flex items-center justify-between gap-6">
            <div>
              <span className="text-[10px] text-zinc-500 font-mono tracking-widest block uppercase select-none">Valor Comercial</span>
              <span className="text-2xl md:text-3xl font-mono font-bold text-neon-green">
                R$ {card.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => onToggleFavorite?.(card.id)}
                className={`p-3.5 rounded-xl border transition-all duration-300 cursor-pointer flex items-center justify-center ${
                  card.isFavorited
                    ? 'bg-rose-950/40 border-rose-500 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-rose-500 hover:border-rose-500/50'
                }`}
                title={card.isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <Heart size={18} className={card.isFavorited ? 'fill-rose-500' : ''} />
              </button>

              <button
                onClick={() => {
                  onAddToCart(card);
                  onClose();
                }}
                className="px-6 py-3.5 bg-gradient-to-r from-neon-green to-emerald-600 hover:from-emerald-500 hover:to-neon-green text-cyber-dark font-display font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_0_20px_rgba(0,255,102,0.15)] hover:shadow-[0_0_30px_rgba(0,255,102,0.35)] hover:scale-[1.02] cursor-pointer"
              >
                <ShoppingCart size={16} />
                <span>Adicionar ao Carrinho</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Artwork Viewer */}
      {isFullScreen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 select-none"
          onClick={() => {
            setIsFullScreen(false);
            setIsZoomed(false);
          }}
        >
          {/* Cyber scanner lines for HUD theme */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
          <div className="scanline-moving opacity-10" />

          {/* Top HUD Controls */}
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-50 pointer-events-auto">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-neon-green animate-ping" />
              <span className="font-mono text-xs text-zinc-400 tracking-widest uppercase">
                DETECTOR HOLOGRÁFICO • RESOLUÇÃO MÁXIMA
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsZoomed(!isZoomed);
                }}
                className="p-2.5 bg-zinc-950/80 border border-zinc-800 hover:border-neon-purple rounded-xl text-zinc-400 hover:text-neon-purple transition-all cursor-pointer flex items-center gap-2 text-xs font-mono"
                title={isZoomed ? "Reduzir" : "Ampliar"}
              >
                {isZoomed ? <ZoomOut size={14} /> : <ZoomIn size={14} />}
                <span>{isZoomed ? "REDUZIR" : "AMPLIAR"}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFullScreen(false);
                  setIsZoomed(false);
                }}
                className="p-2.5 bg-zinc-950/80 border border-zinc-800 hover:border-rose-500 rounded-xl text-zinc-400 hover:text-rose-500 transition-all cursor-pointer"
                title="Fechar (Esc)"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Image Container */}
          <div 
            className="w-full h-full flex items-center justify-center overflow-auto pointer-events-auto p-8"
            onClick={() => {
              setIsFullScreen(false);
              setIsZoomed(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: isZoomed ? 1.35 : 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 26 }}
              className={`relative shadow-[0_0_80px_rgba(0,0,0,0.85)] rounded-3xl border border-zinc-800 overflow-hidden flex items-center justify-center ${
                isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed(!isZoomed);
              }}
              style={{
                maxWidth: isZoomed ? '95%' : '85%',
                maxHeight: isZoomed ? '95%' : '85%',
                aspectRatio: '734 / 1024',
              }}
            >
              <img
                src={card.imageUrl}
                alt={card.name}
                className="w-full h-full object-contain pointer-events-none"
                referrerPolicy="no-referrer"
              />
              
              {/* Grading stamp on artwork */}
              <div className="absolute top-6 left-6 px-3 py-1 bg-zinc-950/80 border border-neon-green/40 text-neon-green font-mono font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg select-none">
                <Award size={13} />
                <span>{card.condition}</span>
              </div>
            </motion.div>
          </div>

          {/* Bottom HUD Metadata */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-zinc-950/80 border border-zinc-900/95 p-4 rounded-2xl backdrop-blur-md z-40 select-none">
            <div className="flex items-center gap-4">
              <span className={`px-2 py-0.5 rounded border text-[9px] font-mono font-black uppercase ${typeColor.bg} ${typeColor.border} ${typeColor.text} ${typeColor.glow}`}>
                {card.type}
              </span>
              <div>
                <h3 className="font-display font-black text-base text-zinc-100 flex items-center gap-2">
                  {card.name}
                  {card.isHolo && <Sparkles size={14} className="text-neon-green animate-pulse" />}
                </h3>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
                  {card.japaneseName} • Ilustrador: {card.illustrator} • {card.rarity} • Num: {card.cardNumber}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-zinc-900 pt-3 md:pt-0">
              <div className="text-left md:text-right">
                <span className="text-[9px] text-zinc-500 font-mono block">VALOR ESTIMADO</span>
                <span className="text-xl font-mono font-bold text-neon-green">
                  R$ {card.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
