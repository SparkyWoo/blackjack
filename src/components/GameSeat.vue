<script setup lang="ts">
import type { Seat } from '@/types'
import { state } from '@/store'

defineProps<{
  seat: Seat
}>()

function selectSeat(seatId: number) {
  if (state.localPlayer) return // Already seated
  if (state.selectedSeat === seatId) {
    state.selectedSeat = null
  } else {
    state.selectedSeat = seatId
    state.showJoinDialog = true
  }
}

// Find player for this seat
const getPlayerForSeat = (seatId: number) => {
  return state.players.find(p => p.seat_number === seatId && !p.isDealer)
}
</script>

<template>
  <div 
    class="seat" 
    :class="{ 
      'seat-occupied': getPlayerForSeat(seat.id), 
      'seat-selected': state.selectedSeat === seat.id && !getPlayerForSeat(seat.id),
      'seat-active': state.activePlayer?.seat_number === seat.id
    }"
    :style="seat.position"
    @click="selectSeat(seat.id)"
  >
    <div v-if="getPlayerForSeat(seat.id)" class="player-info">
      <div class="player-name">{{ getPlayerForSeat(seat.id)?.name }}</div>
      <div class="player-bank">{{ getPlayerForSeat(seat.id)?.bank }} chips</div>
    </div>
    <div v-else-if="!state.localPlayer" class="seat-empty">
      {{ seat.label }}
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
</style> 