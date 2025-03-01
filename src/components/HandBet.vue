<template>
  <transition-group
    tag="div"
    name="chip"
    class="hand-bet"
    :class="{ 'is-win': isWin, 'is-loss': isLoss }"
  >
    <div 
      v-if="hand.bet > 0" 
      class="bet-amount"
      :class="{ 'is-win': isWin, 'is-loss': isLoss }"
      key="bet-amount"
    >
      {{ hand.bet }}
    </div>
    <svg 
      class="chip" 
      v-for="i in Math.min(hand.bet, 5)" 
      :key="`chip-${i}`"
      :style="{ transform: `translateX(${(i-1) * 5}px)` }"
    >
      <use href="#chip" />
    </svg>
  </transition-group>
</template>

<script lang="ts" setup>
import type { Hand } from '@/types'
import { computed } from 'vue'

const props = defineProps<{ hand: Hand }>()

const isLoss = computed(() => ['lose', 'bust'].includes(props.hand.result || ''))
const isWin = computed(() => ['push', 'win', 'blackjack'].includes(props.hand.result || ''))
</script>

<style scoped>
.hand-bet {
  position: absolute;
  bottom: -4.5rem;
  left: 0;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.bet-amount {
  font-size: 1.6rem;
  font-weight: bold;
  color: var(--color-white);
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 1rem;
  padding: 0.3rem 0.8rem;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
}

.bet-amount.is-win {
  color: var(--color-gold);
  animation: pulse-win 1s ease-in-out;
}

.bet-amount.is-loss {
  color: var(--color-red);
  animation: pulse-loss 1s ease-in-out;
}

.chip {
  height: 2.5rem;
  aspect-ratio: 1;
  color: var(--color-chip);
  transition: all 0.3s ease-in;
  filter: drop-shadow(0 0.2rem 0.3rem rgba(0, 0, 0, 0.5));
}

.is-win .chip {
  color: var(--color-gold);
}

.is-loss .chip {
  opacity: 0.5;
}

.chip-enter-active,
.chip-leave-active {
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  will-change: transform, opacity;
}

.chip-leave-to,
.is-win .chip-enter-from {
  transform: translate3d(0, -50vh, 0) rotate(180deg);
  opacity: 0;
}

.chip-enter-from,
.is-win .chip-leave-to {
  transform: translate3d(0, 50vh, 0) rotate(-180deg);
  opacity: 0;
}

@keyframes pulse-win {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

@keyframes pulse-loss {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(0.9); }
}
</style>
