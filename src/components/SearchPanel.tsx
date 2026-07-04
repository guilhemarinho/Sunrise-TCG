import React from 'react';
import { SearchFilters, PokemonType, CardRarity } from '../types';
import { Search, X, SlidersHorizontal, Sparkles, Flame, ShieldAlert, Coins } from 'lucide-react';
import { POPULAR_SEARCHES, SETS } from '../data';

interface SearchPanelProps {
  filters: SearchFilters;
  setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>;
  onReset: () => void;
}

const POKEMON_TYPES: PokemonType[] = [
  'Dragon', 'Fire', 'Psychic', 'Darkness', 'Lightning', 
  'Water', 'Grass', 'Metal', 'Fighting', 'Colorless'
];

const CARD_RARITIES: CardRarity[] = [
  'Secret Rare', 'Special Illustration Rare', 'Illustration Rare', 'Hyper Rare', 'Ultra Rare'
];

// Aesthetic helper for type colors
export const TYPE_COLORS: Record<PokemonType, { bg: string; border: string; text: string; glow: string }> = {
  Fire: { bg: 'bg-red-950/40', border: 'border-red-500/40', text: 'text-red-400', glow: 'shadow-[0_0_10px_rgba(239,68,68,0.2)]' },
  Water: { bg: 'bg-blue-950/40', border: 'border-blue-500/40', text: 'text-blue-400', glow: 'shadow-[0_0_10px_rgba(59,130,246,0.2)]' },
  Grass: { bg: 'bg-green-950/40', border: 'border-green-500/40', text: 'text-green-400', glow: 'shadow-[0_0_10px_rgba(34,197,94,0.2)]' },
  Lightning: { bg: 'bg-yellow-950/40', border: 'border-yellow-500/40', text: 'text-yellow-400', glow: 'shadow-[0_0_10px_rgba(234,179,8,0.2)]' },
  Psychic: { bg: 'bg-fuchsia-950/40', border: 'border-fuchsia-500/40', text: 'text-fuchsia-400', glow: 'shadow-[0_0_10px_rgba(217,70,239,0.2)]' },
  Fighting: { bg: 'bg-amber-950/40', border: 'border-amber-700/40', text: 'text-amber-500', glow: 'shadow-[0_0_10px_rgba(180,83,9,0.2)]' },
  Darkness: { bg: 'bg-purple-950/40', border: 'border-purple-900/40', text: 'text-purple-400', glow: 'shadow-[0_0_10px_rgba(168,85,247,0.2)]' },
  Metal: { bg: 'bg-slate-900/40', border: 'border-slate-500/40', text: 'text-slate-400', glow: 'shadow-[0_0_10px_rgba(148,163,184,0.2)]' },
  Dragon: { bg: 'bg-amber-900/30', border: 'border-amber-500/50', text: 'text-amber-400', glow: 'shadow-[0_0_10px_rgba(245,158,11,0.3)]' },
  Colorless: { bg: 'bg-zinc-900/40', border: 'border-zinc-500/40', text: 'text-zinc-400', glow: 'shadow-[0_0_10px_rgba(113,113,122,0.2)]' },
};

export default function SearchPanel({ filters, setFilters, onReset }: SearchPanelProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, query: e.target.value }));
  };

  const toggleType = (type: PokemonType) => {
    setFilters(prev => {
      const active = prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type];
      return { ...prev, types: active };
    });
  };

  const toggleRarity = (rarity: CardRarity) => {
    setFilters(prev => {
      const active = prev.rarities.includes(rarity)
        ? prev.rarities.filter(r => r !== rarity)
        : [...prev.rarities, rarity];
      return { ...prev, rarities: active };
    });
  };

  const handleSliderChange = (key: 'minPrice' | 'maxPrice' | 'minHp' | 'maxHp', val: number) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, sortBy: e.target.value as any }));
  };

  const handlePopularClick = (tag: string) => {
    // If tag is a rarity
    if (CARD_RARITIES.includes(tag as any)) {
      setFilters(prev => ({
        ...prev,
        rarities: prev.rarities.includes(tag as any) ? prev.rarities : [...prev.rarities, tag as any]
      }));
    }
    // If tag is a type
    else if (POKEMON_TYPES.includes(tag as any)) {
      setFilters(prev => ({
        ...prev,
        types: prev.types.includes(tag as any) ? prev.types : [...prev.types, tag as any]
      }));
    }
    // Else treat as text query
    else {
      setFilters(prev => ({ ...prev, query: tag }));
    }
  };

  const hasActiveFilters = 
    filters.query !== '' || 
    filters.types.length > 0 || 
    filters.rarities.length > 0 || 
    filters.minPrice > 50 || 
    filters.maxPrice < 5000 || 
    filters.minHp > 50;

  return (
    <div id="search-container" className="w-full bg-cyber-gray/95 border border-zinc-800/80 rounded-xl p-5 md:p-6 shadow-neon-dual backdrop-blur-md relative overflow-hidden">
      {/* Background scanline simulation for search console */}
      <div className="absolute inset-0 bg-dots-pattern opacity-40 pointer-events-none" />
      <div className="scanline-moving opacity-30" />

      {/* Primary Search Row */}
      <div className="flex flex-col md:flex-row gap-4 relative z-10 items-stretch">
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
            <Search size={18} />
          </span>
          <input
            id="main-search-input"
            type="text"
            value={filters.query}
            onChange={handleQueryChange}
            placeholder="Buscar por nome da carta, ataques, raridade ou descrição..."
            className="w-full bg-cyber-dark border border-zinc-800 focus:border-neon-green/80 rounded-lg py-3.5 pl-11 pr-4 text-zinc-100 placeholder-zinc-500 font-sans outline-none focus:ring-1 focus:ring-neon-green/50 transition-all duration-300 shadow-inner"
          />
          {filters.query && (
            <button
              onClick={() => setFilters(prev => ({ ...prev, query: '' }))}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-neon-purple p-0.5 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {/* Advanced Toggle */}
          <button
            id="btn-advanced-filters"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className={`px-4 rounded-lg border flex items-center gap-2 font-display text-sm font-medium transition-all duration-300 cursor-pointer ${
              isAdvancedOpen 
                ? 'bg-neon-purple/10 border-neon-purple text-neon-purple shadow-[0_0_10px_rgba(188,19,254,0.15)]' 
                : 'bg-cyber-dark/55 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filtros</span>
          </button>

          {/* Sort Selection */}
          <div className="relative">
            <select
              id="sort-select"
              value={filters.sortBy}
              onChange={handleSortChange}
              className="h-full bg-cyber-dark/90 border border-zinc-800 text-zinc-300 rounded-lg px-3 py-2 pr-8 font-sans text-sm outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green/30 appearance-none cursor-pointer hover:border-zinc-700 transition-all"
            >
              <option value="price-desc">Preço: Maior primeiro</option>
              <option value="price-asc">Preço: Menor primeiro</option>
              <option value="hp-desc">HP: Maior primeiro</option>
              <option value="name-asc">Nome: A-Z</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-500">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="px-3 rounded-lg border border-red-500/30 bg-red-950/10 hover:bg-red-500/20 text-red-400 text-xs font-display flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Limpar todos os filtros"
            >
              <X size={14} />
              <span className="hidden md:inline">Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* Popular Searches */}
      <div className="flex flex-wrap items-center gap-2 mt-3.5 text-xs relative z-10">
        <span className="text-zinc-500 font-display flex items-center gap-1 select-none">
          <Sparkles size={12} className="text-neon-green" />
          Buscas populares:
        </span>
        {POPULAR_SEARCHES.map(tag => (
          <button
            key={tag}
            onClick={() => handlePopularClick(tag)}
            className="px-2.5 py-1 bg-cyber-dark border border-zinc-800 hover:border-neon-green hover:text-neon-green text-zinc-400 rounded-md transition-all duration-200 cursor-pointer text-[11px] font-mono"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Advanced Filters Expandable Container */}
      {isAdvancedOpen && (
        <div id="advanced-filters-panel" className="mt-6 pt-5 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10 animate-fadeIn">
          
          {/* Column 1: Types */}
          <div className="col-span-1 md:col-span-6">
            <h4 className="text-xs font-display font-semibold tracking-wider text-neon-green uppercase mb-3 flex items-center gap-1.5">
              <Flame size={12} />
              Filtrar por Tipo
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {POKEMON_TYPES.map(type => {
                const isActive = filters.types.includes(type);
                const colors = TYPE_COLORS[type];
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`px-2 py-1.5 rounded-lg border text-center font-display text-xs font-medium cursor-pointer transition-all duration-300 flex items-center justify-center gap-1.5 ${
                      isActive
                        ? `${colors.bg} ${colors.border} ${colors.text} ${colors.glow} scale-[1.03] font-semibold border-opacity-100`
                        : 'bg-cyber-dark/40 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-current animate-pulse' : 'bg-zinc-600'}`} />
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 2: Rarity */}
          <div className="col-span-1 md:col-span-3">
            <h4 className="text-xs font-display font-semibold tracking-wider text-neon-purple uppercase mb-3 flex items-center gap-1.5">
              <ShieldAlert size={12} />
              Filtrar por Raridade
            </h4>
            <div className="flex flex-col gap-2">
              {CARD_RARITIES.map(rarity => {
                const isActive = filters.rarities.includes(rarity);
                return (
                  <button
                    key={rarity}
                    onClick={() => toggleRarity(rarity)}
                    className={`px-3 py-2 rounded-lg border text-left font-display text-xs font-medium cursor-pointer transition-all duration-200 flex items-center justify-between ${
                      isActive
                        ? 'bg-neon-purple/10 border-neon-purple text-neon-purple shadow-[0_0_8px_rgba(188,19,254,0.1)]'
                        : 'bg-cyber-dark/40 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <span>{rarity}</span>
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px] ${
                      isActive ? 'border-neon-purple bg-neon-purple text-cyber-dark font-bold' : 'border-zinc-700 bg-cyber-dark'
                    }`}>
                      {isActive && '✓'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 3: Sliders */}
          <div className="col-span-1 md:col-span-3 flex flex-col gap-5">
            {/* Price Filter */}
            <div>
              <h4 className="text-xs font-display font-semibold tracking-wider text-zinc-400 uppercase mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Coins size={12} className="text-neon-green" />
                  Preço Máximo
                </span>
                <span className="font-mono text-neon-green text-[11px]">
                  R$ {filters.maxPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </h4>
              <div className="px-1.5">
                <input
                  type="range"
                  min="50"
                  max="5000"
                  step="50"
                  value={filters.maxPrice}
                  onChange={(e) => handleSliderChange('maxPrice', Number(e.target.value))}
                  className="w-full accent-neon-green bg-zinc-800 rounded-lg appearance-none h-1.5 cursor-pointer outline-none"
                />
                <div className="flex justify-between text-[10px] text-zinc-600 font-mono mt-1 select-none">
                  <span>R$ 50</span>
                  <span>R$ 5.000+</span>
                </div>
              </div>
            </div>

            {/* HP Filter */}
            <div>
              <h4 className="text-xs font-display font-semibold tracking-wider text-zinc-400 uppercase mb-3 flex items-center justify-between">
                <span>Mínimo de HP</span>
                <span className="font-mono text-neon-purple text-[11px]">
                  {filters.minHp} HP
                </span>
              </h4>
              <div className="px-1.5">
                <input
                  type="range"
                  min="50"
                  max="340"
                  step="10"
                  value={filters.minHp}
                  onChange={(e) => handleSliderChange('minHp', Number(e.target.value))}
                  className="w-full accent-neon-purple bg-zinc-800 rounded-lg appearance-none h-1.5 cursor-pointer outline-none"
                />
                <div className="flex justify-between text-[10px] text-zinc-600 font-mono mt-1 select-none">
                  <span>50 HP</span>
                  <span>340 HP</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
