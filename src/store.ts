import { generateShoe, shuffle } from '@/cards'
import type { GameState, HandResult, Player, Seat } from './types'
import { computed, reactive } from 'vue'
import { Sounds, playSound } from './sound'
import { Hand } from './models/Hand'
import { 
  getOrCreateGame, 
  updateGameState, 
  joinGame as joinGameApi, 
  leaveGame as leaveGameApi,
  getPlayers as getPlayersApi,
  updatePlayerHands,
  updatePlayerBank,
  subscribeToGame,
  subscribeToPlayers,
  playerAction
} from './api/supabase'

// Constants
const MINIMUM_BET = 1
const STARTING_BANK = 20
const NUMBER_OF_DECKS = 6
const SHUFFLE_THRESHOLD = 0.25

// Define available seats
export const SEATS: Seat[] = [
  { id: 1, position: { top: '80%', left: '20%' }, label: 'Seat 1' },
  { id: 2, position: { top: '80%', left: '50%' }, label: 'Seat 2' },
  { id: 3, position: { top: '80%', left: '80%' }, label: 'Seat 3' },
  { id: 4, position: { top: '50%', left: '85%' }, label: 'Seat 4' },
  { id: 5, position: { top: '20%', left: '80%' }, label: 'Seat 5' },
  { id: 6, position: { top: '20%', left: '20%' }, label: 'Seat 6' },
  { id: 7, position: { top: '50%', left: '15%' }, label: 'Seat 7' },
]

// Initialize players
const initialPlayers: Player[] = []

// Create reactive state
export const state = reactive<GameState>({
  id: '',
  players: initialPlayers,
  seats: SEATS,
  selectedSeat: null,
  localPlayer: null,
  showJoinDialog: false,
  isDealing: false,
  activePlayer: null,
  activeHand: null,
  isLoading: false,
  error: null,
  isProcessingAction: false,
  shoe: generateShoe(NUMBER_OF_DECKS),
  cardsPlayed: 0,
  isGameOver: false
})

// Computed properties
export const dealer = computed(() => {
  return state.players.find(p => p.isDealer) || null
})

export const isLocalPlayerActive = computed(() => {
  return state.localPlayer && state.activePlayer && state.localPlayer.id === state.activePlayer.id
})

// Join game function
export async function joinGame(playerName: string, seatNumber: number) {
  if (!state.id) {
    console.error('Game not initialized')
    return
  }
  
  try {
    state.isLoading = true
    state.error = null
    
    // Call API to join game
    const player = await joinGameApi(state.id, playerName, seatNumber)
    
    if (player) {
      // Set local player
      state.localPlayer = player
      
      // Add player to players list if not already there
      if (!state.players.find(p => p.id === player.id)) {
        state.players.push(player)
      }
      
      // Reset selected seat and close dialog
      state.selectedSeat = null
      state.showJoinDialog = false
      
      console.log('Player joined:', player)
    }
  } catch (error) {
    console.error('Error joining game:', error)
    state.error = error instanceof Error ? error.message : 'Failed to join game'
  } finally {
    state.isLoading = false
  }
}

// Leave game function
export async function leaveGame() {
  if (!state.localPlayer || !state.localPlayer.id) {
    console.error('No local player or player ID')
    return
  }
  
  try {
    state.isLoading = true
    state.error = null
    
    // Call API to leave game
    await leaveGameApi(state.localPlayer.id)
    
    // Remove player from players array
    state.players = state.players.filter(p => p.id !== state.localPlayer?.id)
    
    // Reset local player
    state.localPlayer = null
    
    console.log('Player left the game')
  } catch (error) {
    console.error('Error leaving game:', error)
    state.error = error instanceof Error ? error.message : 'Failed to leave game'
  } finally {
    state.isLoading = false
  }
}

// Initialize game
export async function initializeGame() {
  try {
    state.isLoading = true
    state.error = null
    
    // Get or create game
    const { game, players } = await getOrCreateGame()
    
    if (game) {
      state.id = game.id
      
      // Set up players
      state.players = players
      
      console.log('Game initialized:', game)
    }
  } catch (error) {
    console.error('Error initializing game:', error)
    state.error = error instanceof Error ? error.message : 'Failed to initialize game'
  } finally {
    state.isLoading = false
  }
}

// Get players
export async function getPlayers(gameId: string) {
  try {
    const players = await getPlayersApi(gameId)
    
    if (players) {
      // Update players in state
      state.players = players
      
      // Update local player reference if needed
      if (state.localPlayer) {
        const updatedLocalPlayer = players.find(p => p.id === state.localPlayer?.id)
        if (updatedLocalPlayer) {
          state.localPlayer = updatedLocalPlayer
        }
      }
    }
    
    return players
  } catch (error) {
    console.error('Error getting players:', error)
    throw error
  }
}
