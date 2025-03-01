<script setup lang="ts">
import { state, SEATS, initializeGame } from '@/store'
import { onMounted, ref } from 'vue'
import GameSeat from './GameSeat.vue'
import JoinDialog from './JoinDialog.vue'

const isLoading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    await initializeGame()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to initialize game'
  } finally {
    isLoading.value = false
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
      </div>
      
      <!-- Seats -->
      <div class="seats-container">
        <GameSeat 
          v-for="seat in SEATS" 
          :key="seat.id" 
          :seat="seat"
        />
      </div>
      
      <!-- Join button (only show if player is not in the game) -->
      <div v-if="!state.localPlayer" class="join-container">
        <button class="join-button" @click="openJoinDialog">
          Join Game
        </button>
      </div>
      
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