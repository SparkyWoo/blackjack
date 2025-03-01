<script setup lang="ts">
import type { Hand, Player } from '@/types'
import { computed } from 'vue'
import { state } from '@/store'
import GameCard from './GameCard.vue'
import { CardValue } from '@/cards'

const props = defineProps<{
  hand: Hand
  player: Player
}>()

// Check if this is the dealer's hand
const isDealerHand = computed(() => {
  return props.player.isDealer
})

// Check if this is the active hand
const isActiveHand = computed(() => {
  return props.hand.isActive
})

// Check if this hand is split
const isSplitHand = computed(() => {
  return props.hand.isSplit
})

// Calculate the total value of the hand
const handTotal = computed(() => {
  if (!props.hand.cards || props.hand.cards.length === 0) return 0
  
  // For dealer's hand, only show the value of the first card if not all cards are revealed
  if (isDealerHand.value && !props.hand.isRevealed && props.hand.cards.length > 1) {
    // Use the CardValue mapping to get the value from the rank
    return CardValue[props.hand.cards[0].rank]
  }
  
  return props.hand.total
})

// Determine if we should show the hand result
const showResult = computed(() => {
  return props.hand.result && props.hand.isRevealed
})

// Get the appropriate result text
const resultText = computed(() => {
  switch (props.hand.result) {
    case 'blackjack':
      return 'Blackjack!'
    case 'win':
      return 'Win!'
    case 'lose':
      return 'Lose'
    case 'push':
      return 'Push'
    case 'bust':
      return 'Bust'
    default:
      return ''
  }
})

// Get the appropriate result class
const resultClass = computed(() => {
  switch (props.hand.result) {
    case 'blackjack':
    case 'win':
      return 'result-win'
    case 'lose':
    case 'bust':
      return 'result-lose'
    case 'push':
      return 'result-push'
    default:
      return ''
  }
})
</script>

<template>
  <div 
    class="game-hand" 
    :class="{ 
      'active-hand': isActiveHand, 
      'split-hand': isSplitHand,
      'dealer-hand': isDealerHand
    }"
  >
    <!-- Cards in the hand -->
    <transition-group name="card-deal" tag="div" class="cards-container">
      <GameCard 
        v-for="(card, index) in hand.cards" 
        :key="card.index || index" 
        :card="card" 
        :is-dealer-card="isDealerHand" 
        :is-face-down="isDealerHand && index > 0 && !hand.isRevealed" 
        :style="{ zIndex: index + 1 }"
      />
    </transition-group>
    
    <!-- Hand result (win/lose/push/etc.) -->
    <div v-if="showResult" class="hand-result" :class="resultClass">
      {{ resultText }}
    </div>
    
    <!-- Hand total value -->
    <div class="hand-total" v-if="hand.cards && hand.cards.length > 0">
      {{ handTotal }}
    </div>
    
    <!-- Bet amount -->
    <div class="bet-amount" v-if="hand.bet && !isDealerHand">
      Bet: {{ hand.bet }}
    </div>
  </div>
</template>

<style scoped>
.game-hand {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 1rem;
  min-height: 15rem;
}

.cards-container {
  display: flex;
  position: relative;
  min-height: 15rem;
  min-width: 10rem;
}

.active-hand {
  transform: translateY(-1rem);
  transition: transform 0.3s ease;
}

.active-hand::after {
  content: '';
  position: absolute;
  bottom: -1.5rem;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 1rem solid transparent;
  border-right: 1rem solid transparent;
  border-bottom: 1rem solid var(--color-cyan);
  animation: pulse 1.5s infinite;
}

.split-hand {
  margin: 0 2rem;
}

.dealer-hand {
  margin-bottom: 2rem;
}

.hand-result {
  position: absolute;
  top: -3rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 1.8rem;
  font-weight: bold;
  white-space: nowrap;
  animation: fadeIn 0.5s ease-in-out;
  z-index: 10;
}

.result-win {
  background-color: var(--color-gold);
  color: var(--color-dark-green);
}

.result-lose {
  background-color: var(--color-red);
  color: var(--color-white);
}

.result-push {
  background-color: var(--color-cyan);
  color: var(--color-dark-green);
}

.hand-total {
  position: absolute;
  bottom: -3rem;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(from var(--color-dark-green) r g b / 0.8);
  color: var(--color-white);
  padding: 0.3rem 0.8rem;
  border-radius: 0.5rem;
  font-size: 1.6rem;
  font-weight: bold;
}

.bet-amount {
  position: absolute;
  bottom: -5.5rem;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(from var(--color-gold) r g b / 0.8);
  color: var(--color-dark-green);
  padding: 0.3rem 0.8rem;
  border-radius: 0.5rem;
  font-size: 1.4rem;
  font-weight: bold;
}

/* Card dealing animation */
.card-deal-enter-active {
  transition: all 0.5s ease;
}

.card-deal-leave-active {
  transition: all 0.3s ease;
}

.card-deal-enter-from {
  opacity: 0;
  transform: translateY(-50px) rotate(-10deg);
}

.card-deal-leave-to {
  opacity: 0;
  transform: translateY(50px) rotate(10deg);
}

@keyframes pulse {
  0% {
    transform: translateX(-50%) scale(1);
  }
  50% {
    transform: translateX(-50%) scale(1.2);
  }
  100% {
    transform: translateX(-50%) scale(1);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
