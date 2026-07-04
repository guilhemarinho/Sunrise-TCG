import React from 'react';
import { PokemonCard } from '../types';
import { TYPE_COLORS } from './SearchPanel';
import { X, Heart, ShoppingCart, Eye, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WishlistPanelProps {
  isOpen: boolean;
  onClose: () => void;
  favoritedCards: PokemonCard[];
  onToggleFavorite: (cardId: string) => void;
  onAddToCart: (card: PokemonCard) => void;
  onSelectCard: (card: PokemonCard) => void;
}

export default function WishlistPanel({
  isOpen,
  onClose,
  favoritedCards,
  onToggleFavorite,
  onAddToCart,
  onSelectCard,
}: WishlistPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-cyber-darker/80 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
          />

          {/* Panel Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            id="wishlist-panel"
            className="relative z-10 w-full max-w-md bg-cyber-dark border-l border-zinc-800 h-full flex flex-col shadow-[-10px_0_30px_rgba(188,19,254,0.05)]"
          >
            {/* Panel Header */}
            <div className="p-5 border-b border-zinc-900 flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <Heart className="text-rose-500 fill-rose-500" size={20} />
                <h2 className="font-display font-bold text-zinc-100 text-lg uppercase tracking-wider">
                  Favoritos ({favoritedCards.length})
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-zinc-500 hover:text-neon-purple border border-transparent hover:border-zinc-800 rounded transition-colors cursor-pointer"
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {favoritedCards.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none">
                  <div className="w-12 h-12 rounded-full bg-cyber-card border border-zinc-800 flex items-center justify-center text-rose-500/30 mb-4 animate-pulse">
                    <Heart size={22} />
                  </div>
                  <h3 className="text-zinc-300 font-display font-medium text-base mb-1">Nenhum favorito ainda</h3>
                  <p className="text-zinc-500 text-xs max-w-xs leading-relaxed">
                    Navegue pela nossa coleção e marque as suas cartas favoritas com o coração para salvá-las aqui.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {favoritedCards.map((card) => {
                    const colors = TYPE_COLORS[card.type] || TYPE_COLORS.Colorless;
                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={card.id}
                        className="p-3.5 bg-cyber-card/80 border border-zinc-900 rounded-xl flex gap-3 items-center group relative overflow-hidden"
                      >
                        {/* Shimmer line */}
                        <div className="absolute inset-y-0 left-0 w-1 bg-rose-500 opacity-75" />

                        {/* Thumbnail image with clickable view */}
                        <div 
                          className="relative cursor-pointer flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
                          onClick={() => {
                            onSelectCard(card);
                            onClose();
                          }}
                        >
                          <img
                            src={card.imageUrl}
                            alt={card.name}
                            className="w-14 h-18 object-cover rounded-md border border-zinc-950 select-none"
                            referrerPolicy="no-referrer"
                          />
                          {card.isHolo && (
                            <div className="absolute -top-1 -left-1 text-neon-green bg-cyber-dark/80 rounded-full p-0.5 border border-neon-green/30">
                              <Sparkles size={8} />
                            </div>
                          )}
                        </div>

                        {/* Info details */}
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => {
                          onSelectCard(card);
                          onClose();
                        }}>
                          <h4 className="font-display font-bold text-xs text-zinc-100 truncate group-hover:text-rose-400 transition-colors flex items-center gap-1">
                            {card.name}
                          </h4>
                          <span className="text-[10px] font-mono text-zinc-500 block leading-none mb-1.5 truncate">
                            {card.condition} • {card.cardNumber}
                          </span>
                          <span className="font-mono text-xs font-semibold text-neon-green">
                            R$ {card.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* Controls: Remove Favorite & Add to Cart */}
                        <div className="flex flex-col items-end gap-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            {/* View Button */}
                            <button
                              onClick={() => {
                                onSelectCard(card);
                                onClose();
                              }}
                              className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded border border-zinc-800 bg-cyber-dark/50 transition-all cursor-pointer"
                              title="Visualizar detalhes"
                            >
                              <Eye size={12} />
                            </button>

                            {/* Add to Cart */}
                            <button
                              onClick={() => {
                                onAddToCart(card);
                              }}
                              className="text-neon-green hover:text-cyber-dark p-1.5 rounded border border-zinc-800 hover:bg-neon-green bg-cyber-dark/50 transition-all cursor-pointer"
                              title="Adicionar ao carrinho"
                            >
                              <ShoppingCart size={12} />
                            </button>

                            {/* Remove from Wishlist */}
                            <button
                              onClick={() => onToggleFavorite(card.id)}
                              className="text-rose-500/60 hover:text-rose-500 p-1.5 rounded border border-zinc-800 hover:border-rose-500/30 bg-cyber-dark/50 hover:bg-rose-950/10 transition-all cursor-pointer"
                              title="Remover dos favoritos"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
