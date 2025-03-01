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
export type GameState = {
  /** The game ID from Supabase */
  id?: string
  /** The shoe of cards */
  shoe: Card[]
  /** Number of cards played */
  cardsPlayed: number
  /** The players in the game, including the dealer */
  players: Player[]
  /** The player whose turn it is */
  activePlayer: Player | null
  /** The hand that is currently being played */
  activeHand: Hand | null
  /** Whether the dealer is dealing cards (preventing interaction) */
  isDealing: boolean
  /** Whether the dealer's hole card is face up */
  showDealerHoleCard: boolean
  /** Whether the sound is muted */
  isMuted: boolean
  /** Whether the game is over due to bankruptcy */
  isGameOver: boolean
  /** The download progress of the sound files */
  soundLoadProgress: number
  /** The local player (the user) */
  localPlayer: Player | null
  /** Whether the join dialog is shown */
  showJoinDialog: boolean
  /** The player name input */
  playerName: string
  /** The selected seat number */
  selectedSeat: number | null
  /** Whether the game is loading */
  isLoading: boolean
  /** Error message */
  error: string | null
}

// Seat type for UI
export type Seat = {
  id: number
  position: { top: string, left: string }
  label: string
}

export class Hand {
  id: number | string
  cards: Card[]
  bet: number
  result?: HandResult
  _calculatedTotal?: number

  constructor(bet = 0) {
    this.id = new Date().getTime() + Math.random()
    this.cards = []
    this.bet = bet
  }

  get total(): number {
    // If we have a pre-calculated total from the server, use that
    if (this._calculatedTotal !== undefined) {
      return this._calculatedTotal
    }
    
    // Otherwise calculate it
    let total = 0
    let addedHighAce = false
    for (const card of this.cards) {
      total += CardValue[card.rank as CardRank]
      if (card.rank === 'A' && !addedHighAce) {
        total += 10
        addedHighAce = true
      }
    }
    if (total > 21 && addedHighAce) total -= 10
    return total
  }

  set total(value: number) {
    this._calculatedTotal = value
  }

  get isBust(): boolean {
    return this.total > 21
  }

  get isBlackjack(): boolean {
    return this.total === 21 && this.cards.length === 2
  }

  reset() {
    this.cards = []
    this.bet = 0
    this.result = undefined
    this._calculatedTotal = undefined
  }
}
