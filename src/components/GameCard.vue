<script setup lang="ts">
import type { Card } from '@/types'
import { computed } from 'vue'

const props = defineProps<{
  card: Card
  isDealerCard?: boolean
  isFaceDown?: boolean
}>()

// Get the card suit symbol
const suitSymbol = computed(() => {
  return props.card.suit
})

// Get the card value display
const valueDisplay = computed(() => {
  return props.card.rank
})

// Determine if the card is red (hearts or diamonds)
const isRedCard = computed(() => {
  return props.card.suit === '♥' || props.card.suit === '♦'
})
</script>

<template>
  <div 
    class="game-card" 
    :class="{ 
      'face-down': isFaceDown,
      'red-card': isRedCard && !isFaceDown,
      'dealer-card': isDealerCard
    }"
  >
    <div class="card-inner">
      <!-- Front of card -->
      <div class="card-front">
        <div class="card-corner top-left">
          <div class="card-value">{{ valueDisplay }}</div>
          <div class="card-suit">{{ suitSymbol }}</div>
        </div>
        
        <div class="card-center">
          <div class="card-suit center-suit">{{ suitSymbol }}</div>
        </div>
        
        <div class="card-corner bottom-right">
          <div class="card-value">{{ valueDisplay }}</div>
          <div class="card-suit">{{ suitSymbol }}</div>
        </div>
      </div>
      
      <!-- Back of card -->
      <div class="card-back">
        <div class="card-pattern"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-card {
  position: relative;
  width: 8rem;
  height: 11rem;
  perspective: 1000px;
  margin-right: -4rem;
  transition: transform 0.3s ease;
}

.game-card:last-child {
  margin-right: 0;
}

.game-card:hover {
  transform: translateY(-1rem);
  z-index: 10;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
  box-shadow: 0 0.4rem 0.8rem rgba(0, 0, 0, 0.2);
  border-radius: 0.8rem;
}

.face-down .card-inner {
  transform: rotateY(180deg);
}

.card-front, .card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 0.8rem;
  overflow: hidden;
}

.card-front {
  background-color: var(--color-white);
  color: var(--color-black);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.5rem;
}

.red-card .card-front {
  color: var(--color-red);
}

.card-back {
  background-color: var(--color-dark-blue);
  transform: rotateY(180deg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-pattern {
  width: 90%;
  height: 90%;
  border: 0.3rem solid var(--color-gold);
  border-radius: 0.5rem;
  background-image: repeating-linear-gradient(
    45deg,
    var(--color-gold) 0,
    var(--color-gold) 0.5rem,
    transparent 0.5rem,
    transparent 1rem
  );
}

.card-corner {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-weight: bold;
}

.top-left {
  align-self: flex-start;
}

.bottom-right {
  align-self: flex-end;
  transform: rotate(180deg);
}

.card-value {
  font-size: 2rem;
  line-height: 1;
}

.card-suit {
  font-size: 1.8rem;
  line-height: 1;
}

.card-center {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.center-suit {
  font-size: 5rem;
}

.dealer-card {
  z-index: 5;
}
</style> 