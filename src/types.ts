import { CardSuits, CardValue } from '@/cards'

export type CardSuit = (typeof CardSuits)[number]
export type CardRank = keyof typeof CardValue
export type HandResult = 'win' | 'lose' | 'push' | 'blackjack' | 'bust'

export type Card = {
  rank: CardRank
  suit: CardSuit
  index: number
}

// Extended Player type for multiplayer
export type Player = {
  id?: string
  game_id?: string
  name: string
  seat_number?: number
  isDealer: boolean
  bank: number
  /** The player's hands (A player can have two hands after splitting) */
  hands: Hand[]
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

// Extended GameState type for multiplayer
export interface GameState {
  /** Game ID */
  id: string
  /** List of players in the game */
  players: Player[]
  /** Available seats */
  seats: Seat[]
  /** Selected seat for joining */
  selectedSeat: number | null
  /** Local player */
  localPlayer: Player | null
  /** Whether to show join dialog */
  showJoinDialog: boolean
  /** Whether the game is dealing cards */
  isDealing: boolean
  /** Currently active player */
  activePlayer: Player | null
  /** Currently active hand */
  activeHand: Hand | null
  /** Whether the game is loading */
  isLoading: boolean
  /** Error message */
  error: string | null
  /** Whether an action is being processed */
  isProcessingAction: boolean
  /** The shoe of cards */
  shoe: Card[]
  /** Number of cards played from the shoe */
  cardsPlayed: number
  /** Whether the game is over */
  isGameOver: boolean
}

// Seat type for UI
export type Seat = {
  id: number
  position: { top: string, left: string }
  label: string
}

export interface Hand {
  id: string | number
  cards: Card[]
  bet: number
  result?: HandResult
  total?: number
  isActive?: boolean
  isRevealed?: boolean
  isSplit?: boolean
  isBusted?: boolean
  isBlackjack?: boolean
}
