<script setup lang="ts">
import { state } from '@/store'
import { onMounted, computed } from 'vue'
import GameHand from '@/components/GameHand.vue'
import SvgSprite from '@/components/SvgSprite.vue'
import AnimatedBackground from '@/components/AnimatedBackground.vue'
import { playSound, Sounds, initSound } from '@/sound'
import PlayerToolbar from '@/components/PlayerToolbar.vue'
import TitleScreen from '@/components/TitleScreen.vue'
import GameHeader from '@/components/GameHeader.vue'
import GameTable from '@/components/GameTable.vue'
import PlayerStatus from '@/components/PlayerStatus.vue'

onMounted(() => {
  initSound()
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
