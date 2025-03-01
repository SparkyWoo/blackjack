<script setup lang="ts">
import { state, joinGame } from '@/store'
import { ref, watch } from 'vue'
import { debugJoinGame } from '@/api/supabase'

const isSubmitting = ref(false)
const debugInfo = ref<any>(null)
const showDebugInfo = ref(false)

async function handleSubmit() {
  if (!state.playerName.trim()) {
    state.error = 'Please enter your name'
    return
  }
  
  if (state.selectedSeat === null) {
    state.error = 'Please select a seat'
    return
  }
  
  try {
    isSubmitting.value = true
    state.error = null
    await joinGame(state.playerName, state.selectedSeat)
  } catch (error) {
    // Error is now handled in the joinGame function
    console.error('Error in handleSubmit:', error)
  } finally {
    isSubmitting.value = false
  }
}

async function runDebug() {
  if (!state.id || !state.playerName.trim() || state.selectedSeat === null) {
    state.error = 'Please enter your name and select a seat'
    return
  }
  
  try {
    isSubmitting.value = true
    state.error = null
    debugInfo.value = await debugJoinGame(state.id, state.playerName, state.selectedSeat)
    showDebugInfo.value = true
  } catch (error) {
    console.error('Error in debug:', error)
    if (error instanceof Error) {
      state.error = `Debug error: ${error.message}`
    } else {
      state.error = 'Debug error occurred'
    }
  } finally {
    isSubmitting.value = false
  }
}

function closeDialog() {
  // Don't show the dialog if player is already in the game
  if (state.localPlayer) {
    state.showJoinDialog = false
    state.selectedSeat = null
    state.error = null
    showDebugInfo.value = false
    return
  }
  
  state.showJoinDialog = false
  state.selectedSeat = null
  state.error = null
  showDebugInfo.value = false
}

// Add a watch to close the dialog if player is already in the game
watch(() => state.localPlayer, (newValue) => {
  if (newValue) {
    state.showJoinDialog = false
  }
})
</script>

<template>
  <transition name="fade">
    <div v-if="state.showJoinDialog" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog">
        <h2>Join Game</h2>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="playerName">Your Name</label>
            <input 
              id="playerName" 
              v-model="state.playerName" 
              type="text" 
              placeholder="Enter your name"
              :disabled="isSubmitting || state.isLoading"
              autofocus
            />
          </div>
          
          <div v-if="state.error" class="error-message">
            {{ state.error }}
          </div>
          
          <div v-if="showDebugInfo" class="debug-info">
            <h3>Debug Information</h3>
            <pre>{{ JSON.stringify(debugInfo, null, 2) }}</pre>
          </div>
          
          <div class="dialog-buttons">
            <button type="button" @click="closeDialog" :disabled="isSubmitting || state.isLoading">Cancel</button>
            <button 
              type="button" 
              @click="runDebug" 
              :disabled="isSubmitting || state.isLoading"
              class="debug-button"
            >
              Debug
            </button>
            <button type="submit" :disabled="isSubmitting || state.isLoading">
              {{ isSubmitting || state.isLoading ? 'Joining...' : 'Join Game' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.dialog {
  background-color: var(--color-dark-cyan);
  border-radius: 1rem;
  padding: 2rem;
  width: 90%;
  max-width: 40rem;
  box-shadow: 0 0 2rem rgba(0, 0, 0, 0.5);
  max-height: 90vh;
  overflow-y: auto;
}

h2 {
  color: var(--color-white);
  font-size: 3rem;
  margin: 0 0 2rem 0;
  text-align: center;
}

.form-group {
  margin-bottom: 2rem;
}

label {
  display: block;
  color: var(--color-white);
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

input {
  width: 100%;
  padding: 1rem;
  font-size: 1.8rem;
  border: none;
  border-radius: 0.5rem;
  background-color: var(--color-white);
}

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.error-message {
  color: var(--color-red);
  font-size: 1.6rem;
  margin-bottom: 1.5rem;
  padding: 0.5rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
}

.debug-info {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  max-height: 30vh;
  overflow-y: auto;
}

.debug-info h3 {
  color: var(--color-white);
  font-size: 1.8rem;
  margin: 0 0 1rem 0;
}

.debug-info pre {
  color: var(--color-white);
  font-size: 1.4rem;
  white-space: pre-wrap;
  word-break: break-all;
}

.debug-button {
  background-color: var(--color-dark-green) !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 