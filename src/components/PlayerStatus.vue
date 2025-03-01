<script setup lang="ts">
import { state, leaveGame, isLocalPlayerActive } from '@/store'
import { computed } from 'vue'

const playerName = computed(() => state.localPlayer?.name || 'Guest')
const playerBank = computed(() => state.localPlayer?.bank || 0)
const playerSeat = computed(() => state.localPlayer?.seat_number || 0)

async function handleLeaveGame() {
  if (confirm('Are you sure you want to leave the game?')) {
    await leaveGame()
  }
}
</script>

<template>
  <div class="player-status">
    <div class="player-info">
      <div class="player-name">{{ playerName }}</div>
      <div class="player-details">
        <span class="player-seat">Seat {{ playerSeat }}</span>
        <span class="player-bank">{{ playerBank }} chips</span>
      </div>
    </div>
    
    <div class="player-actions">
      <button 
        class="leave-button" 
        @click="handleLeaveGame"
        :disabled="state.isProcessingAction"
      >
        Leave Game
      </button>
    </div>
    
    <div v-if="isLocalPlayerActive" class="turn-indicator">
      Your Turn
    </div>
  </div>
</template>

<style scoped>
.player-status {
  display: flex;
  align-items: center;
  background-color: rgba(from var(--color-dark-blue) r g b / 0.8);
  padding: 1rem 2rem;
  border-radius: 0.8rem;
  box-shadow: 0 0.4rem 1rem rgba(0, 0, 0, 0.3);
  position: relative;
}

.player-info {
  flex: 1;
}

.player-name {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--color-gold);
  margin-bottom: 0.3rem;
}

.player-details {
  display: flex;
  gap: 1.5rem;
  font-size: 1.4rem;
  color: var(--color-white);
}

.player-seat {
  color: var(--color-cyan);
}

.player-bank {
  color: var(--color-light-gold);
}

.player-actions {
  margin-left: 2rem;
}

.leave-button {
  background-color: var(--color-red);
  color: var(--color-white);
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 1.4rem;
  cursor: pointer;
  transition: all 0.2s;
}

.leave-button:hover:not(:disabled) {
  background-color: var(--color-dark-red);
  transform: translateY(-0.2rem);
}

.leave-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.turn-indicator {
  position: absolute;
  top: -2.5rem;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--color-cyan);
  color: var(--color-dark-green);
  padding: 0.5rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 1.6rem;
  font-weight: bold;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: translateX(-50%) scale(1);
  }
  50% {
    transform: translateX(-50%) scale(1.05);
  }
  100% {
    transform: translateX(-50%) scale(1);
  }
}
</style> 