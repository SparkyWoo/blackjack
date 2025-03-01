<script setup lang="ts">
import { state, joinGame } from '@/store'
import { ref } from 'vue'

const isSubmitting = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  if (!state.playerName.trim()) {
    errorMessage.value = 'Please enter your name'
    return
  }
  
  if (state.selectedSeat === null) {
    errorMessage.value = 'Please select a seat'
    return
  }
  
  try {
    isSubmitting.value = true
    errorMessage.value = ''
    await joinGame(state.playerName, state.selectedSeat)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to join game'
  } finally {
    isSubmitting.value = false
  }
}

function closeDialog() {
  state.showJoinDialog = false
  state.selectedSeat = null
  errorMessage.value = ''
}
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
              :disabled="isSubmitting"
              autofocus
            />
          </div>
          
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
          
          <div class="dialog-buttons">
            <button type="button" @click="closeDialog" :disabled="isSubmitting">Cancel</button>
            <button type="submit" :disabled="isSubmitting">
              {{ isSubmitting ? 'Joining...' : 'Join Game' }}
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