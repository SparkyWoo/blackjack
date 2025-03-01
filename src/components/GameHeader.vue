<script setup lang="ts">
import { state } from '@/store'
import { computed } from 'vue'

function toggleSound() {
  state.isMuted = !state.isMuted
  localStorage.setItem('isMuted', state.isMuted.toString())
}

const gameStatus = computed(() => {
  if (state.isLoading) return 'Loading...'
  if (state.error) return 'Error: ' + state.error
  if (state.isDealing) return 'Dealing...'
  if (state.isProcessingAction) return 'Processing...'
  if (state.activePlayer) return 'Game in progress'
  return 'Ready'
})

const statusClass = computed(() => {
  if (state.isLoading || state.isDealing || state.isProcessingAction) return 'status-processing'
  if (state.error) return 'status-error'
  if (state.activePlayer) return 'status-active'
  return 'status-ready'
})
</script>

<template>
  <header>
    <div class="header-left">
      <a
        class="github"
        aria-label="Source on GitHub"
        href="https://github.com/kevinleedrum/vlackjack"
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg role="presentation" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="currentColor"
            d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
          />
        </svg>
      </a>
    </div>
    
    <div class="game-title">
      <h1>Blackjack Live</h1>
      <div class="game-status" :class="statusClass">{{ gameStatus }}</div>
    </div>
    
    <div class="header-right">
      <button @click="toggleSound" aria-label="Toggle sound" class="sound-toggle">
        <svg
          v-if="!state.isMuted"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"
          />
          <path d="M16 9a5 5 0 0 1 0 6" />
          <path d="M19.364 18.364a9 9 0 0 0 0-12.728" />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M16 9a5 5 0 0 1 .95 2.293" />
          <path d="M19.364 5.636a9 9 0 0 1 1.889 9.96" />
          <path d="m2 2 20 20" />
          <path
            d="m7 7-.587.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298V11"
          />
          <path d="M9.828 4.172A.686.686 0 0 1 11 4.657v.686" />
        </svg>
      </button>
    </div>
  </header>
</template>

<style scoped>
header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  padding: 0.8rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  z-index: 100;
  box-shadow: 0 0.2rem 1rem rgba(0, 0, 0, 0.3);
}

.header-left, .header-right {
  display: flex;
  align-items: center;
}

.game-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

h1 {
  font-size: 2rem;
  font-weight: bold;
  color: var(--color-gold);
  margin: 0;
  text-shadow: 0 0.2rem 0.5rem rgba(0, 0, 0, 0.5);
}

.game-status {
  font-size: 1.2rem;
  margin-top: 0.3rem;
  padding: 0.2rem 0.8rem;
  border-radius: 1rem;
  background-color: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.status-ready {
  color: var(--color-cyan);
}

.status-active {
  color: var(--color-gold);
}

.status-processing {
  color: var(--color-white);
  animation: pulse 1.5s infinite;
}

.status-error {
  color: var(--color-red);
}

.github, .sound-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  height: 40px;
  width: 40px;
  color: var(--color-off-white);
  background-color: rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.sound-toggle {
  border: none;
  cursor: pointer;
}

@media (hover: hover) {
  .github:hover,
  .sound-toggle:hover {
    background-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    color: var(--color-white);
  }
}

.sound-toggle:focus-visible,
.sound-toggle:active,
.github:focus-visible,
.github:active {
  outline: 2px solid var(--color-cyan);
  color: var(--color-white);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@media (max-width: 600px) {
  h1 {
    font-size: 1.6rem;
  }
  
  .game-status {
    font-size: 1rem;
  }
  
  header {
    padding: 0.5rem 1rem;
    height: 60px;
  }
}
</style>
