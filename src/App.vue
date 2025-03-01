<script setup lang="ts">
import { state, initializeGame, leaveGame } from '@/store'
import { onMounted, computed, ref, onBeforeUnmount } from 'vue'
import SvgSprite from '@/components/SvgSprite.vue'
import AnimatedBackground from '@/components/AnimatedBackground.vue'
import { playSound, Sounds, initSound } from '@/sound'
import TitleScreen from '@/components/TitleScreen.vue'
import GameHeader from '@/components/GameHeader.vue'
import GameTable from '@/components/GameTable.vue'
import PlayerStatus from '@/components/PlayerStatus.vue'
import JoinDialog from '@/components/JoinDialog.vue'

const isInitializing = ref(false)
const initError = ref<string | null>(null)
const inactivityTimer = ref<ReturnType<typeof globalThis.setTimeout> | null>(null)
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
    inactivityTimer.value = globalThis.setTimeout(() => {
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
    globalThis.clearTimeout(inactivityTimer.value);
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
  globalThis.addEventListener('beforeunload', handleBeforeUnload)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  // Remove event listeners
  globalThis.removeEventListener('beforeunload', handleBeforeUnload)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  
  // Clear any timers
  clearInactivityTimer()
  
  // Leave the game if the user is at a table
  if (state.localPlayer) {
    leaveGame()
  }
})

function onClickCapture(e: MouseEvent) {
  const target = e.target as HTMLButtonElement
  if (target?.tagName === 'BUTTON' && !target?.disabled) {
    playSound(Sounds.Click)
  }
}

// Function to reload the page
function reloadPage() {
  globalThis.location.reload()
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
      <button @click="reloadPage" class="retry-button">Retry</button>
    </div>
    
    <!-- Game content -->
    <GameTable v-else />
  </main>
  
  <!-- Player status component (only shown when player is in game) -->
  <PlayerStatus v-if="state.localPlayer" />
  
  <!-- Join dialog -->
  <JoinDialog v-if="state.showJoinDialog" />
  
  <!-- Title screen -->
  <TitleScreen />
</template>

<style scoped>
main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  padding: 8rem 2rem 2rem;
  position: relative;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  width: 100%;
  gap: 2rem;
  max-width: 600px;
  margin: 0 auto;
}

.loading-spinner {
  width: 5rem;
  height: 5rem;
  border: 0.5rem solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: var(--color-gold);
  animation: spin 1.5s ease-in-out infinite;
}

.loading-text, .error-message {
  color: var(--color-white);
  font-size: 2rem;
  text-align: center;
}

.error-message {
  color: var(--color-red);
  background-color: rgba(0, 0, 0, 0.5);
  padding: 2rem;
  border-radius: 1rem;
  max-width: 90%;
  border: 1px solid rgba(255, 0, 0, 0.3);
}

.retry-button {
  padding: 1rem 2.5rem;
  background-color: var(--color-gold);
  color: var(--color-dark-green);
  border: none;
  border-radius: 0.5rem;
  font-size: 1.6rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0.4rem 1rem rgba(0, 0, 0, 0.3);
}

.retry-button:hover {
  background-color: var(--color-light-gold);
  transform: translateY(-3px);
  box-shadow: 0 0.6rem 1.5rem rgba(0, 0, 0, 0.4);
}

.retry-button:active {
  transform: translateY(-1px);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  main {
    padding: 7rem 1rem 1rem;
  }
  
  .loading-text, .error-message {
    font-size: 1.8rem;
  }
  
  .retry-button {
    font-size: 1.4rem;
    padding: 0.8rem 2rem;
  }
}
</style>
