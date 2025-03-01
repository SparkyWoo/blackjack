<script setup lang="ts">
import { state, initializeGame, leaveGame } from '@/store'
import { onMounted, computed, ref, onBeforeUnmount } from 'vue'
import GameHand from '@/components/GameHand.vue'
import SvgSprite from '@/components/SvgSprite.vue'
import AnimatedBackground from '@/components/AnimatedBackground.vue'
import { playSound, Sounds, initSound } from '@/sound'
import PlayerToolbar from '@/components/PlayerToolbar.vue'
import TitleScreen from '@/components/TitleScreen.vue'
import GameHeader from '@/components/GameHeader.vue'
import GameTable from '@/components/GameTable.vue'
import PlayerStatus from '@/components/PlayerStatus.vue'

const isInitializing = ref(false)
const initError = ref<string | null>(null)
const inactivityTimer = ref<number | null>(null)
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

// Handle browser close/refresh
function handleBeforeUnload(event: BeforeUnloadEvent) {
  // If the user is at a table, leave it
  if (state.localPlayer) {
    // We don't need to await this since the browser is closing anyway
    leaveGame()
    
    // Show a confirmation dialog (some browsers may ignore this)
    event.preventDefault()
    event.returnValue = ''
    return ''
  }
}

// Handle visibility change (tab switching, minimizing)
function handleVisibilityChange() {
  if (document.hidden && state.localPlayer) {
    // User switched tabs or minimized browser
    // Start a timer to leave the game after inactivity
    clearInactivityTimer();
    inactivityTimer.value = window.setTimeout(() => {
      if (state.localPlayer) {
        console.log('Leaving game due to inactivity');
        leaveGame();
      }
    }, INACTIVITY_TIMEOUT);
  } else {
    // User returned to the tab
    clearInactivityTimer();
  }
}

// Clear the inactivity timer
function clearInactivityTimer() {
  if (inactivityTimer.value !== null) {
    window.clearTimeout(inactivityTimer.value);
    inactivityTimer.value = null;
  }
}

onMounted(async () => {
  // Initialize sound
  initSound()
  
  // Initialize game
  try {
    isInitializing.value = true
    await initializeGame()
  } catch (error) {
    console.error('Failed to initialize game:', error)
    initError.value = error instanceof Error ? error.message : 'Failed to initialize game'
  } finally {
    isInitializing.value = false
  }
  
  // Add event listeners
  window.addEventListener('beforeunload', handleBeforeUnload)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  // Remove event listeners
  window.removeEventListener('beforeunload', handleBeforeUnload)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  
  // Clear any timers
  clearInactivityTimer()
  
  // Leave the game if the user is at a table
  if (state.localPlayer) {
    leaveGame()
  }
})

// Determine if we should show the game table or the game board
const showGameBoard = computed(() => {
  return state.localPlayer && state.activePlayer;
})

function onClickCapture(e: MouseEvent) {
  const target = e.target as HTMLButtonElement
  if (target?.tagName === 'BUTTON' && !target?.disabled) {
    playSound(Sounds.Click)
  }
}
</script>

<template>
  <SvgSprite />
  <AnimatedBackground />
  <GameHeader />
  
  <main @click.capture="onClickCapture">
    <!-- Loading state -->
    <div v-if="isInitializing" class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading game...</div>
    </div>
    
    <!-- Error state -->
    <div v-else-if="initError" class="error-container">
      <div class="error-message">{{ initError }}</div>
      <button @click="window.location.reload()">Retry</button>
    </div>
    
    <!-- Game content -->
    <template v-else>
      <!-- Show game table when not in active play -->
      <GameTable v-if="!showGameBoard" />
      
      <!-- Show game board during active play -->
      <template v-else>
        <section
          class="player"
          v-for="(player, p) in state.players"
          :key="p"
          :class="{ dealer: player.isDealer, active: player === state.activePlayer }"
        >
          <GameHand v-for="hand in player.hands" :hand="hand" :player="player" :key="hand.id" />
        </section>
        <PlayerToolbar v-if="state.localPlayer && state.localPlayer === state.activePlayer" />
      </template>
    </template>
  </main>
  
  <!-- Player status component -->
  <PlayerStatus />
  
  <TitleScreen />
</template>

<style scoped>
main {
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  gap: 8rem;
  padding-bottom: 8rem;
  height: 100%;
  padding: 2rem 1rem 1rem 1rem;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  width: 100%;
  gap: 2rem;
}

.loading-spinner {
  width: 5rem;
  height: 5rem;
  border: 0.5rem solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: var(--color-gold);
  animation: spin 1s ease-in-out infinite;
}

.loading-text, .error-message {
  color: var(--color-white);
  font-size: 2rem;
  text-align: center;
}

.error-message {
  color: var(--color-red);
  background-color: rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 0.5rem;
  max-width: 80%;
}

.error-container button {
  padding: 1rem 2rem;
  background-color: var(--color-gold);
  color: var(--color-dark);
  border: none;
  border-radius: 0.5rem;
  font-size: 1.6rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.error-container button:hover {
  background-color: var(--color-light-gold);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

section.player {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8rem;
  min-height: 11.2rem;
}
section.player:not(.dealer) {
  flex-grow: 1;
}
section.player.dealer {
  z-index: -1;
}
section.player.active {
  position: relative;
}
section.player.active::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border: 0.3rem solid var(--color-gold);
  border-radius: 1rem;
  box-shadow: 0 0 1rem var(--color-gold);
  animation: pulse 1.5s infinite;
  pointer-events: none;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
  100% {
    opacity: 0.6;
    transform: scale(1);
  }
}
</style>
