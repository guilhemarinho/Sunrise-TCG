export type PokemonType =
  | 'Grass'
  | 'Fire'
  | 'Water'
  | 'Lightning'
  | 'Psychic'
  | 'Fighting'
  | 'Darkness'
  | 'Metal'
  | 'Dragon'
  | 'Colorless';

export type CardRarity =
  | 'Secret Rare'
  | 'Ultra Rare'
  | 'Special Illustration Rare'
  | 'Illustration Rare'
  | 'Hyper Rare';

export interface CardAttack {
  name: string;
  cost: PokemonType[];
  damage: string;
  description: string;
}

export interface PokemonCard {
  id: string;
  name: string;
  japaneseName: string;
  type: PokemonType;
  rarity: CardRarity;
  price: number;
  hp: number;
  imageUrl: string;
  illustrator: string;
  attacks: CardAttack[];
  weakness: PokemonType | 'None';
  resistance: PokemonType | 'None';
  retreatCost: number;
  cardNumber: string;
  expansion: string;
  description: string;
  condition: 'PSA 10 Gem Mint' | 'PSA 9 Mint' | 'BGS 9.5 Gem Mint' | 'Ungraded Near-Mint+';
  isHolo: boolean;
  isFavorited?: boolean;
}

export interface CartItem {
  card: PokemonCard;
  quantity: number;
}

export interface SearchFilters {
  query: string;
  types: PokemonType[];
  rarities: CardRarity[];
  minPrice: number;
  maxPrice: number;
  minHp: number;
  maxHp: number;
  sortBy: 'price-asc' | 'price-desc' | 'hp-desc' | 'name-asc';
}
