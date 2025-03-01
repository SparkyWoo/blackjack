<script setup lang="ts">
import { state, leaveGame } from '@/store'
import { computed } from 'vue'

const playerName = computed(() => state.localPlayer?.name || 'Guest')
const playerBank = computed(() => state.localPlayer?.bank || 0)
const playerSeat = computed(() => state.localPlayer?.seat_number || 0)
const isPlayerTurn = computed(() => {
  return state.localPlayer && state.activePlayer && 
         state.localPlayer.id === state.activePlayer.id
})

async function handleLeaveGame() {
  if (confirm('Are you sure you want to leave the game?')) {
    await leaveGame()
  }
}
</script>

<template>
  <div class="player-status" v-if="state.localPlayer">
    <div class="player-info">
      <div class="player-name">{{ playerName }}</div>
      <div class="player-seat">Seat {{ playerSeat }}</div>
      <div class="player-bank">Bank: ${{ playerBank }}</div>
    </div>
    
    <div class="player-turn-indicator" :class="{ active: isPlayerTurn }">
      {{ isPlayerTurn ? 'Your Turn' : 'Waiting...' }}
    </div>
    
    <button class="leave-button" @click="handleLeaveGame">
      Leave Game
    </button>
  </div>
</template>

<style scoped>
.player-status {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background-color: var(--color-dark-cyan);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 0 1rem rgba(0, 0, 0, 0.5);
  z-index: 10;
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.player-name {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--color-white);
}

.player-seat {
  font-size: 1.4rem;
  color: var(--color-gold);
  font-style: italic;
}

.player-bank {
  font-size: 1.6rem;
  color: var(--color-gold);
}

.player-turn-indicator {
  font-size: 1.4rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  text-align: center;
  background-color: var(--color-dark-green);
  color: var(--color-white);
  transition: all 0.3s;
}

.player-turn-indicator.active {
  background-color: var(--color-gold);
  color: var(--color-dark-green);
  font-weight: bold;
  animation: pulse 1.5s infinite;
}

.leave-button {
  font-size: 1.4rem;
  padding: 0.8rem;
  background-color: var(--color-red);
  color: var(--color-white);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.leave-button:hover {
  background-color: #ff3333;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}
</style> 