<script setup lang="ts">
import { state } from '@/store'
import { computed } from 'vue'
import { playerAction } from '@/api/supabase'
import PlayerBank from '@/components/PlayerBank.vue'

// Get the active hand for the local player
const activeHand = computed(() => {
  if (!state.localPlayer || !state.activePlayer) return null
  
  // Make sure this is the local player's turn
  if (state.localPlayer.id !== state.activePlayer.id) return null
  
  // Find the active hand
  return state.localPlayer.hands?.find(hand => hand.isActive)
})

// Check if player can hit
const canHit = computed(() => {
  if (!activeHand.value) return false
  
  // Can't hit if busted or has blackjack
  if (activeHand.value.isBusted || activeHand.value.isBlackjack) return false
  
  return true
})

// Check if player can stand
const canStand = computed(() => {
  if (!activeHand.value) return false
  
  // Can't stand if busted or has blackjack (auto-stands)
  if (activeHand.value.isBusted || activeHand.value.isBlackjack) return false
  
  return true
})

// Check if player can double down
const canDoubleDown = computed(() => {
  if (!activeHand.value || !state.localPlayer) return false
  
  // Can only double down with exactly 2 cards
  if (!activeHand.value.cards || activeHand.value.cards.length !== 2) return false
  
  // Can't double down if busted or has blackjack
  if (activeHand.value.isBusted || activeHand.value.isBlackjack) return false
  
  // Need enough money to double the bet
  return state.localPlayer.bank >= activeHand.value.bet
})

// Check if player can split
const canSplit = computed(() => {
  if (!activeHand.value || !state.localPlayer) return false
  
  // Can only split with exactly 2 cards
  if (!activeHand.value.cards || activeHand.value.cards.length !== 2) return false
  
  // Cards must have the same value
  if (activeHand.value.cards[0].value !== activeHand.value.cards[1].value) return false
  
  // Need enough money to match the bet
  return state.localPlayer.bank >= activeHand.value.bet
})

// Perform player action
async function performAction(action: 'hit' | 'stand' | 'double' | 'split') {
  if (!state.localPlayer || !state.activePlayer || !activeHand.value) return
  
  try {
    // Disable buttons during action
    state.isProcessingAction = true
    
    // Call the API to perform the action
    await playerAction(state.gameId, state.localPlayer.id, activeHand.value.id, action)
    
    console.log(`Player performed action: ${action}`)
  } catch (error) {
    console.error(`Error performing action ${action}:`, error)
  } finally {
    state.isProcessingAction = false
  }
}
</script>

<template>
  <div class="player-toolbar" v-if="activeHand">
    <button 
      class="action-button hit-button" 
      :disabled="!canHit || state.isProcessingAction" 
      @click="performAction('hit')"
    >
      Hit
    </button>
    
    <button 
      class="action-button stand-button" 
      :disabled="!canStand || state.isProcessingAction" 
      @click="performAction('stand')"
    >
      Stand
    </button>
    
    <button 
      class="action-button double-button" 
      :disabled="!canDoubleDown || state.isProcessingAction" 
      @click="performAction('double')"
    >
      Double
    </button>
    
    <button 
      class="action-button split-button" 
      :disabled="!canSplit || state.isProcessingAction" 
      @click="performAction('split')"
    >
      Split
    </button>
  </div>
  <PlayerBank />
</template>

<style scoped>
.player-toolbar {
  display: flex;
  gap: 0.8rem;
  background-color: rgba(from var(--color-dark-green) r g b / 0.8);
  padding: 1rem;
  border-radius: 0.8rem;
  box-shadow: 0 0.4rem 1rem rgba(0, 0, 0, 0.3);
}

.action-button {
  padding: 0.8rem 1.2rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1.4rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 6rem;
}

.action-button:hover:not(:disabled) {
  transform: translateY(-0.2rem);
  box-shadow: 0 0.3rem 0.5rem rgba(0, 0, 0, 0.2);
}

.action-button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: none;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hit-button {
  background-color: var(--color-green);
  color: var(--color-white);
}

.stand-button {
  background-color: var(--color-red);
  color: var(--color-white);
}

.double-button {
  background-color: var(--color-gold);
  color: var(--color-dark-green);
}

.split-button {
  background-color: var(--color-cyan);
  color: var(--color-dark-green);
}
</style>
