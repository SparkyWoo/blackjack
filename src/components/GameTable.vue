<script setup lang="ts">
import { state, SEATS, initializeGame, getPlayers, dealer, isLocalPlayerActive } from '@/store'
import { onMounted, ref, onBeforeUnmount, computed } from 'vue'
import GameSeat from './GameSeat.vue'
import JoinDialog from './JoinDialog.vue'
import GameHand from './GameHand.vue'
import PlayerToolbar from './PlayerToolbar.vue'
import PlayerStatus from './PlayerStatus.vue'

const isLoading = ref(true)
const error = ref<string | null>(null)
let refreshInterval: ReturnType<typeof globalThis.setInterval> | null = null;
const REFRESH_INTERVAL = 10000; // 10 seconds

// Function to refresh players
async function refreshPlayers() {
  if (!state.id) return;
  
  try {
    await getPlayers(state.id);
  } catch (e) {
    console.error('Error refreshing players:', e);
  }
}

// Computed property to check if the local player is in the game
const isLocalPlayerInGame = computed(() => {
  return !!state.localPlayer;
});

// Computed property to check if the game is in progress
const isGameInProgress = computed(() => {
  return state.players.some(player => player.hands.some(hand => hand.cards.length > 0));
});

onMounted(async () => {
  try {
    await initializeGame()
    
    // Set up periodic refresh of players
    refreshInterval = globalThis.setInterval(refreshPlayers, REFRESH_INTERVAL);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to initialize game'
  } finally {
    isLoading.value = false
  }
})

onBeforeUnmount(() => {
  // Clear the refresh interval
  if (refreshInterval) {
    globalThis.clearInterval(refreshInterval);
    refreshInterval = null;
  }
})

function openJoinDialog() {
  state.showJoinDialog = true
}
</script>

<template>
  <div class="game-table">
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Loading game...</p>
    </div>
    
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="initializeGame">Retry</button>
    </div>
    
    <template v-else>
      <!-- Dealer area -->
      <div class="dealer-area">
        <div class="dealer-label">Dealer</div>
        <!-- Display dealer's hand -->
        <GameHand 
          v-if="dealer && dealer.hands && dealer.hands.length > 0" 
          :hand="dealer.hands[0]" 
          :player="dealer" 
        />
      </div>
      
      <!-- Seats -->
      <div class="seats-container">
        <GameSeat 
          v-for="seat in SEATS" 
          :key="seat.id" 
          :seat="seat"
        />
      </div>
      
      <!-- Player controls (only show if local player is active) -->
      <div v-if="isLocalPlayerInGame && isGameInProgress && isLocalPlayerActive" class="player-controls">
        <PlayerToolbar />
      </div>
      
      <!-- Join button (only show if player is not in the game) -->
      <div v-if="!isLocalPlayerInGame" class="join-container">
        <button class="join-button" @click="openJoinDialog">
          Join Game
        </button>
      </div>
      
      <!-- Player status component -->
      <PlayerStatus v-if="isLocalPlayerInGame" />
      
      <!-- Join dialog -->
      <JoinDialog />
    </template>
  </div>
</template>

<style scoped>
.game-table {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: var(--color-dark-green);
  border-radius: 50%;
  box-shadow: 0 0 2rem rgba(0, 0, 0, 0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.dealer-area {
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dealer-label {
  font-size: 2.4rem;
  color: var(--color-white);
  margin-bottom: 1rem;
  text-shadow: 0 0 0.5rem rgba(0, 0, 0, 0.5);
}

.seats-container {
  position: absolute;
  width: 100%;
  height: 100%;
}

.join-container {
  position: absolute;
  bottom: 10%;
  left: 50%;
  transform: translateX(-50%);
}

.join-button {
  font-size: 2rem;
  padding: 1rem 2rem;
  background-color: var(--color-gold);
  color: var(--color-dark-green);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.join-button:hover {
  background-color: var(--color-light-gold);
  transform: scale(1.05);
}

.player-controls {
  position: absolute;
  bottom: 10%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.player-status {
  position: absolute;
  top: 2%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  padding: 0.5rem 1.5rem;
  border-radius: 2rem;
  z-index: 5;
}

.player-status-label {
  color: var(--color-white);
  font-size: 1.6rem;
}

.player-name {
  font-weight: bold;
  color: var(--color-gold);
}

.loading, .error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-white);
  font-size: 2rem;
}

.spinner {
  width: 5rem;
  height: 5rem;
  border: 0.5rem solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: var(--color-white);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 2rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  color: var(--color-red);
  text-align: center;
}

.error button {
  margin-top: 2rem;
  font-size: 1.8rem;
  padding: 0.8rem 1.6rem;
  background-color: var(--color-gold);
  color: var(--color-dark-green);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
}
</style> 