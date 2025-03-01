<script setup lang="ts">
import { state } from '@/store'
import { ref } from 'vue'

const showTitleScreen = ref(true)

function startGame() {
  showTitleScreen.value = false
  state.showJoinDialog = true
}
</script>

<template>
  <transition name="fade">
    <section v-if="showTitleScreen" class="title-screen">
      <div class="background-pattern">
        <svg>
          <use href="#flourish" />
        </svg>
      </div>
      
      <div class="title-content">
        <div class="logo">
          <h1>Blackjack Live</h1>
          <p>Multiplayer Card Game</p>
        </div>
        
        <div class="game-features">
          <ul>
            <li>Real-time multiplayer gameplay</li>
            <li>Authentic casino rules</li>
            <li>Beautiful card animations</li>
            <li>Join or create tables</li>
          </ul>
        </div>
        
        <transition name="fade" mode="out-in">
          <div class="progress-container" v-if="state.isLoading">
            <div class="loading-spinner"></div>
            <p>Loading game assets...</p>
          </div>
          <button v-else @click="startGame" class="start-button">
            Play Now
          </button>
        </transition>
      </div>
      
      <footer class="title-footer">
        <p>© 2023 Blackjack Live | All Rights Reserved</p>
      </footer>
    </section>
  </transition>
</template>

<style scoped>
.title-screen {
  position: fixed;
  inset: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: linear-gradient(135deg, var(--color-dark-green) 0%, var(--color-dark-blue) 100%);
  z-index: 1000;
}

.background-pattern {
  position: absolute;
  inset: 0;
  overflow: hidden;
  opacity: 0.1;
}

.background-pattern svg {
  position: absolute;
  width: max(86rem, 125vw);
  aspect-ratio: 1;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: rotate 120s linear infinite;
}

.title-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rem;
  padding: 2rem;
  max-width: 800px;
  z-index: 2;
}

.logo {
  display: flex;
  flex-direction: column;
  align-items: center;
}

h1 {
  color: var(--color-gold);
  text-transform: uppercase;
  font-size: 6rem;
  letter-spacing: 0.25rem;
  font-weight: bold;
  margin: 0;
  text-shadow: 0 0.3rem 1rem rgba(0, 0, 0, 0.5);
  animation: glow 3s ease-in-out infinite alternate;
}

.logo p {
  text-transform: uppercase;
  margin: 1rem 0 0;
  color: var(--color-white);
  font-size: 2.5rem;
  font-weight: 300;
  letter-spacing: 0.1rem;
}

.game-features {
  margin: 2rem 0;
}

.game-features ul {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.game-features li {
  color: var(--color-cyan);
  font-size: 1.8rem;
  padding: 0.8rem 1.5rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 0.8rem;
  transition: all 0.3s ease;
}

.game-features li:hover {
  transform: translateY(-3px);
  background-color: rgba(255, 255, 255, 0.15);
}

.start-button {
  font-size: 2.5rem;
  padding: 1.5rem 3.5rem;
  background-color: var(--color-gold);
  color: var(--color-dark-green);
  border: none;
  border-radius: 0.8rem;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.3);
}

.start-button:hover {
  transform: translateY(-5px);
  box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.4);
  background-color: var(--color-light-gold);
}

.start-button:active {
  transform: translateY(-2px);
}

.progress-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  height: 8rem;
}

.loading-spinner {
  width: 4rem;
  height: 4rem;
  border: 0.5rem solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: var(--color-cyan);
  animation: spin 1s ease-in-out infinite;
}

.progress-container p {
  color: var(--color-white);
  font-size: 1.6rem;
}

.title-footer {
  position: absolute;
  bottom: 2rem;
  width: 100%;
  text-align: center;
}

.title-footer p {
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.4rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.8s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes rotate {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes glow {
  from {
    text-shadow: 0 0 0.5rem rgba(255, 215, 0, 0.5);
  }
  to {
    text-shadow: 0 0 2rem rgba(255, 215, 0, 0.8);
  }
}

@media (max-width: 768px) {
  h1 {
    font-size: 4rem;
  }
  
  .logo p {
    font-size: 2rem;
  }
  
  .game-features li {
    font-size: 1.6rem;
  }
  
  .start-button {
    font-size: 2rem;
    padding: 1.2rem 2.5rem;
  }
}

@media (max-width: 480px) {
  h1 {
    font-size: 3rem;
  }
  
  .logo p {
    font-size: 1.6rem;
  }
  
  .title-content {
    gap: 2rem;
  }
  
  .game-features li {
    font-size: 1.4rem;
    padding: 0.6rem 1rem;
  }
}
</style>
