import type { Card, Hand as HandInterface, HandResult } from '@/types'
import { calculateHandTotal } from '@/utils/cardUtils'

export class Hand implements HandInterface {
  id: string | number
  cards: Card[]
  bet: number
  result?: HandResult
  isActive?: boolean
  isRevealed?: boolean
  isSplit?: boolean
  isBusted?: boolean
  isBlackjack?: boolean

  constructor(bet: number = 0) {
    this.id = crypto.randomUUID ? crypto.randomUUID() : Date.now()
    this.cards = []
    this.bet = bet
    this.isActive = false
    this.isRevealed = false
    this.isSplit = false
    this.isBusted = false
    this.isBlackjack = false
  }

  get total(): number {
    return calculateHandTotal(this.cards)
  }

  reset(): void {
    this.cards = []
    this.bet = 0
    this.result = undefined
    this.isActive = false
    this.isRevealed = false
    this.isSplit = false
    this.isBusted = false
    this.isBlackjack = false
  }

  get isBust(): boolean {
    return this.total > 21
  }
} 