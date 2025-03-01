<script setup lang="ts">
import { state, joinGame } from '@/store'
import { ref, watch } from 'vue'

const playerName = ref('')
const isSubmitting = ref(false)
const error = ref<string | null>(null)

// Watch for changes in the state error
watch(() => state.error, (newError) => {
  if (newError) {
    error.value = newError
  }
})

// Watch for dialog visibility
watch(() => state.showJoinDialog, (isVisible) => {
  if (isVisible) {
    // Reset form when dialog opens
    error.value = null
  }
})

async function handleSubmit() {
  if (!playerName.value.trim()) {
    error.value = 'Please enter your name'
    return
  }
  
  if (state.selectedSeat === null) {
    error.value = 'Please select a seat'
    return
  }
  
  try {
    isSubmitting.value = true
    error.value = null
    
    await joinGame(playerName.value, state.selectedSeat)
    
    // Reset form after successful submission
    playerName.value = ''
  } catch (e) {
    console.error('Error joining game:', e)
    error.value = e instanceof Error ? e.message : 'Failed to join game'
  } finally {
    isSubmitting.value = false
  }
}

function closeDialog() {
  state.showJoinDialog = false
  state.selectedSeat = null
  error.value = null
}
</script>

<template>
  <div v-if="state.showJoinDialog" class="dialog-overlay">
    <div class="dialog">
      <div class="dialog-header">
        <h2>Join Game</h2>
        <button class="close-button" @click="closeDialog">×</button>
      </div>
      
      <div class="dialog-content">
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="playerName">Your Name</label>
            <input 
              id="playerName" 
              v-model="playerName" 
              type="text" 
              placeholder="Enter your name"
              :disabled="isSubmitting"
              autocomplete="off"
            >
          </div>
          
          <div class="form-group">
            <label>Selected Seat</label>
            <div class="seat-display">
              {{ state.selectedSeat !== null ? `Seat ${state.selectedSeat}` : 'No seat selected' }}
            </div>
            <div class="seat-help">
              Click on an available seat on the table to select it
            </div>
          </div>
          
          <div v-if="error" class="error-message">
            {{ error }}
          </div>
          
          <div class="form-actions">
            <button 
              type="button" 
              class="cancel-button" 
              @click="closeDialog"
              :disabled="isSubmitting"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              class="join-button" 
              :disabled="isSubmitting || state.selectedSeat === null"
            >
              <span v-if="isSubmitting" class="spinner"></span>
              <span v-else>Join Game</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
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
  z-index: 1000;
}

.dialog {
  background-color: var(--color-dark-blue);
  border-radius: 1rem;
  width: 90%;
  max-width: 50rem;
  box-shadow: 0 0.5rem 2rem rgba(0, 0, 0, 0.5);
  overflow: hidden;
  animation: dialogAppear 0.3s ease-out;
}

.dialog-header {
  background-color: var(--color-dark-green);
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 0.2rem solid var(--color-gold);
}

.dialog-header h2 {
  color: var(--color-gold);
  margin: 0;
  font-size: 2.4rem;
}

.close-button {
  background: none;
  border: none;
  color: var(--color-white);
  font-size: 2.4rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-button:hover {
  color: var(--color-gold);
}

.dialog-content {
  padding: 2rem;
}

.form-group {
  margin-bottom: 2rem;
}

.form-group label {
  display: block;
  color: var(--color-white);
  margin-bottom: 0.8rem;
  font-size: 1.6rem;
}

.form-group input {
  width: 100%;
  padding: 1.2rem;
  background-color: rgba(255, 255, 255, 0.1);
  border: 0.1rem solid var(--color-gold);
  border-radius: 0.5rem;
  color: var(--color-white);
  font-size: 1.6rem;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-cyan);
  box-shadow: 0 0 0.5rem var(--color-cyan);
}

.seat-display {
  padding: 1.2rem;
  background-color: rgba(255, 255, 255, 0.1);
  border: 0.1rem solid var(--color-gold);
  border-radius: 0.5rem;
  color: var(--color-white);
  font-size: 1.6rem;
}

.seat-help {
  margin-top: 0.8rem;
  color: var(--color-light-gray);
  font-size: 1.4rem;
  font-style: italic;
}

.error-message {
  background-color: rgba(255, 0, 0, 0.2);
  border: 0.1rem solid var(--color-red);
  color: var(--color-red);
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 2rem;
  font-size: 1.4rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1.5rem;
}

.cancel-button, .join-button {
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  font-size: 1.6rem;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-button {
  background-color: transparent;
  border: 0.1rem solid var(--color-light-gray);
  color: var(--color-light-gray);
}

.cancel-button:hover:not(:disabled) {
  border-color: var(--color-white);
  color: var(--color-white);
}

.join-button {
  background-color: var(--color-gold);
  border: none;
  color: var(--color-dark-green);
  font-weight: bold;
  min-width: 12rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.join-button:hover:not(:disabled) {
  background-color: var(--color-light-gold);
  transform: translateY(-0.2rem);
}

.join-button:disabled, .cancel-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 0.3rem solid rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  border-top-color: var(--color-dark-green);
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes dialogAppear {
  from {
    opacity: 0;
    transform: translateY(-3rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 