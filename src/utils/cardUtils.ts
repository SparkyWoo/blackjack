import type { Card } from '@/types'
import { CardValue } from '@/cards'

/**
 * Calculate the total value of a hand
 * Aces are counted as 11 unless that would cause a bust, in which case they count as 1
 */
export function calculateHandTotal(cards: Card[]): number {
  if (!cards || cards.length === 0) return 0
  
  let total = 0
  let aces = 0
  
  // First pass: count all non-ace cards and count aces
  for (const card of cards) {
    if (card.rank === 'A') {
      aces++
    } else {
      total += CardValue[card.rank]
    }
  }
  
  // Second pass: add aces
  for (let i = 0; i < aces; i++) {
    // Add 11 for an ace unless it would cause a bust
    if (total + 11 <= 21) {
      total += 11
    } else {
      total += 1
    }
  }
  
  return total
} 