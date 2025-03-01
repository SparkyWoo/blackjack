<script setup lang="ts">
import type { Seat } from '@/types'
import { state } from '@/store'
import { computed } from 'vue'
import GameHand from './GameHand.vue'

const props = defineProps<{
  seat: Seat
}>()

// Find player for this seat
const getPlayerForSeat = (seatId: number) => {
  return state.players.find(p => p.seat_number === seatId && !p.isDealer && p.is_active)
}

// Check if seat is occupied
const isSeatOccupied = computed(() => {
  return !!getPlayerForSeat(props.seat.id)
})

// Get the player in this seat (if any)
const seatPlayer = computed(() => {
  return getPlayerForSeat(props.seat.id)
})

// Check if this is the local player's seat
const isLocalPlayerSeat = computed(() => {
  return state.localPlayer && state.localPlayer.seat_number === props.seat.id
})

// Check if player can select this seat
const canSelectSeat = computed(() => {
  // Can't select if already seated or if seat is occupied
  return !state.localPlayer && !isSeatOccupied.value
})

function selectSeat(seatId: number) {
  // Don't allow selection if already seated or if seat is occupied
  if (!canSelectSeat.value) {
    return
  }
  
  if (state.selectedSeat === seatId) {
    state.selectedSeat = null
  } else {
    state.selectedSeat = seatId
    state.showJoinDialog = true
  }
}
</script>

<template>
  <div 
    class="seat" 
    :class="{ 
      'seat-occupied': isSeatOccupied, 
      'seat-selected': state.selectedSeat === seat.id && !isSeatOccupied,
      'seat-active': state.activePlayer?.seat_number === seat.id,
      'seat-unavailable': isSeatOccupied && !state.localPlayer,
      'local-player-seat': isLocalPlayerSeat
    }"
    :style="seat.position"
    @click="selectSeat(seat.id)"
  >
    <div v-if="isSeatOccupied" class="player-info">
      <div class="player-name">{{ seatPlayer?.name }}</div>
      <div class="player-bank">{{ seatPlayer?.bank }} chips</div>
    </div>
    <div v-else-if="canSelectSeat" class="seat-empty">
      {{ seat.label }}
    </div>
    <div v-if="isSeatOccupied && !isLocalPlayerSeat" class="seat-status">
      Taken
    </div>
    <div v-if="isLocalPlayerSeat" class="seat-status you-indicator">
      You
    </div>
    
    <!-- Display player's hand if seat is occupied -->
    <div v-if="isSeatOccupied && seatPlayer && seatPlayer.hands && seatPlayer.hands.length > 0" class="player-hand">
      <GameHand 
        v-for="(hand, index) in seatPlayer.hands" 
        :key="hand.id || index" 
        :hand="hand" 
        :player="seatPlayer" 
      />
    </div>
  </div>
</template>

<style scoped>
.seat {
  position: absolute;
  width: 10rem;
  height: 10rem;
  border-radius: 50%;
  background-color: rgba(from var(--color-off-white) r g b / 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  transform: translate(-50%, -50%);
  z-index: 1;
}

.seat-empty {
  color: var(--color-white);
  opacity: 0.7;
  font-size: 1.5rem;
  text-align: center;
}

.seat-occupied {
  background-color: rgba(from var(--color-off-white) r g b / 0.4);
  cursor: default;
}

.seat-unavailable {
  cursor: not-allowed;
  position: relative;
}

.local-player-seat {
  background-color: rgba(from var(--color-gold) r g b / 0.3);
  box-shadow: 0 0 1.5rem var(--color-gold);
}

.seat-status {
  position: absolute;
  bottom: -2.5rem;
  background-color: rgba(from var(--color-red) r g b / 0.7);
  color: var(--color-white);
  padding: 0.3rem 0.8rem;
  border-radius: 0.5rem;
  font-size: 1.2rem;
  white-space: nowrap;
}

.you-indicator {
  background-color: rgba(from var(--color-gold) r g b / 0.7);
  color: var(--color-dark-green);
  font-weight: bold;
}

.seat-selected {
  background-color: rgba(from var(--color-gold) r g b / 0.4);
  box-shadow: 0 0 1rem var(--color-gold);
}

.seat-active {
  background-color: rgba(from var(--color-cyan) r g b / 0.4);
  box-shadow: 0 0 1rem var(--color-cyan);
}

.player-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-white);
  text-align: center;
}

.player-name {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.player-bank {
  font-size: 1.4rem;
}

.player-hand {
  position: absolute;
  top: -12rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
}
</style> 