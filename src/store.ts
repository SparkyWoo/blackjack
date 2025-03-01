import { generateShoe, shuffle } from '@/cards'
import type { GameState, HandResult, Player, Seat } from './types'
import { computed, nextTick, reactive } from 'vue'
import { Sounds, playSound } from './sound'
import { Hand } from './types'
import { 
  getOrCreateGame, 
  updateGameState, 
  joinGame as joinGameApi, 
  leaveGame as leaveGameApi,
  getPlayers,
  updatePlayerHands,
  updatePlayerBank,
  subscribeToGame,
  subscribeToPlayers
} from './api/supabase'

const MINIMUM_BET = 1
const STARTING_BANK = 20
const NUMBER_OF_DECKS = 6
/** Reshuffle once less than 25% of the cards are left */
const SHUFFLE_THRESHOLD = 0.25
const INITIAL_PLAYERS: Player[] = [
  { name: 'Player', isDealer: false, bank: STARTING_BANK, hands: [new Hand()] },
  { name: 'Dealer', isDealer: true, bank: 0, hands: [new Hand()] },
]

// Define available seats
export const SEATS: Seat[] = [
  { id: 1, position: { top: '70%', left: '30%' }, label: 'Seat 1' },
  { id: 2, position: { top: '70%', left: '50%' }, label: 'Seat 2' },
  { id: 3, position: { top: '70%', left: '70%' }, label: 'Seat 3' },
]

export const state = reactive<GameState>({
  shoe: generateShoe(NUMBER_OF_DECKS),
  cardsPlayed: 0,
  players: INITIAL_PLAYERS,
  activePlayer: null,
  activeHand: null,
  isDealing: true,
  showDealerHoleCard: false,
  isGameOver: false,
  isMuted: localStorage.getItem('isMuted') === 'true',
  soundLoadProgress: 0,
  
  // Multiplayer state
  id: undefined,
  localPlayer: null,
  showJoinDialog: false,
  playerName: localStorage.getItem('playerName') || '',
  selectedSeat: null,
  isLoading: false,
  error: null,
})

// Computed Properties

export const dealer = computed(() => state.players[state.players.length - 1])

const dealerHasBlackjack = computed(() => {
  return dealer.value.hands[0].isBlackjack
})

const dealerTotal = computed(() => dealer.value.hands[0].total)

const nextPlayer = computed(() => {
  if (!state.activePlayer || state.activePlayer === dealer.value) return null
  return state.players[state.players.indexOf(state.activePlayer) + 1]
})

export const canDoubleDown = computed(() => {
  if (state.isDealing) return false
  if ((state.activePlayer?.bank ?? 0) < (state.activeHand?.bet ?? 0)) return false
  return state.activeHand?.cards.length === 2 && state.activePlayer?.hands.length === 1
})

export const canSplit = computed(() => {
  if (state.isDealing) return false
  if ((state.activePlayer?.bank ?? 0) < (state.activeHand?.bet ?? 0)) return false
  return (
    state.activeHand?.cards.length === 2 &&
    state.activePlayer?.hands.length === 1 &&
    state.activeHand?.cards[0].rank === state.activeHand!.cards[1].rank
  )
})

export const isLocalPlayerActive = computed(() => {
  return state.localPlayer && state.activePlayer && 
         state.localPlayer.id === state.activePlayer.id
})

export const resetBank = () => {
  state.players.forEach((p) => (p.bank = STARTING_BANK))
}

// Multiplayer Functions

export async function initializeGame() {
  try {
    state.isLoading = true
    state.error = null
    
    // Get or create a game
    const game = await getOrCreateGame()
    state.id = game.id
    
    // Set up game state from server
    if (game.shoe) {
      state.shoe = JSON.parse(game.shoe)
    }
    
    if (game.cards_played !== null) {
      state.cardsPlayed = game.cards_played
    }
    
    state.isGameOver = game.is_game_over || false
    
    // Get players
    const players = await getPlayers(game.id)
    
    // Set up players (excluding dealer)
    const gamePlayers = players.map(p => ({
      id: p.id,
      game_id: p.game_id,
      name: p.name,
      isDealer: false,
      bank: p.bank || STARTING_BANK,
      hands: p.hands ? JSON.parse(p.hands) : [new Hand()],
      seat_number: p.seat_number,
      is_active: p.is_active
    }))
    
    // Add dealer
    gamePlayers.push({ 
      id: 'dealer',
      game_id: game.id,
      name: 'Dealer',
      isDealer: true, 
      bank: 0, 
      hands: [new Hand()],
      seat_number: 0,
      is_active: true
    })
    
    state.players = gamePlayers
    
    // Set up subscriptions
    subscribeToGame(game.id, handleGameChange)
    subscribeToPlayers(game.id, handlePlayerChange)
    
  } catch (error) {
    console.error('Failed to initialize game:', error)
    state.error = error instanceof Error ? error.message : 'Failed to initialize game'
  } finally {
    state.isLoading = false
  }
}

function handleGameChange(gameData: any) {
  if (!gameData) return
  
  // Update game state
  if (gameData.shoe) {
    state.shoe = JSON.parse(gameData.shoe)
  }
  
  if (gameData.cards_played !== null) {
    state.cardsPlayed = gameData.cards_played
  }
  
  state.isGameOver = gameData.is_game_over || false
}

function handlePlayerChange(playerData: any) {
  if (!playerData) return
  
  // Find player in state
  const playerIndex = state.players.findIndex(p => p.id === playerData.id)
  
  if (playerIndex === -1 && !playerData.is_active) {
    // Player left and is no longer active, nothing to do
    return
  }
  
  if (playerIndex === -1 && playerData.is_active) {
    // New player joined
    const newPlayer = {
      id: playerData.id,
      game_id: playerData.game_id,
      name: playerData.name,
      isDealer: false,
      bank: playerData.bank || STARTING_BANK,
      hands: playerData.hands ? JSON.parse(playerData.hands) : [new Hand()],
      seat_number: playerData.seat_number,
      is_active: playerData.is_active
    }
    
    // Insert before dealer
    state.players.splice(state.players.length - 1, 0, newPlayer)
    
    // Play sound for new player
    playSound(Sounds.Bet)
    
    return
  }
  
  // Update existing player
  const player = state.players[playerIndex]
  
  if (!playerData.is_active) {
    // Player left
    state.players.splice(playerIndex, 1)
    return
  }
  
  // Update player data
  player.bank = playerData.bank || player.bank
  
  if (playerData.hands) {
    player.hands = JSON.parse(playerData.hands)
  }
  
  // If this is the local player, update local player reference
  if (state.localPlayer && player.id === state.localPlayer.id) {
    state.localPlayer = player
  }
}

export async function joinGame(playerName: string, seatNumber: number) {
  try {
    if (!state.id) {
      throw new Error('Game not initialized')
    }
    
    state.isLoading = true
    state.error = null
    
    // Save player name to localStorage
    localStorage.setItem('playerName', playerName)
    
    // Join game via API
    const player = await joinGameApi(state.id, playerName, seatNumber)
    
    // Create local player object
    const localPlayer = {
      id: player.id,
      game_id: player.game_id,
      name: player.name,
      isDealer: false,
      bank: player.bank || STARTING_BANK,
      hands: player.hands ? JSON.parse(player.hands) : [new Hand()],
      seat_number: player.seat_number,
      is_active: player.is_active
    }
    
    // Set local player
    state.localPlayer = localPlayer
    
    // Close join dialog
    state.showJoinDialog = false
    state.selectedSeat = null
    
  } catch (error) {
    console.error('Failed to join game:', error)
    throw error
  } finally {
    state.isLoading = false
  }
}

export async function leaveGame() {
  try {
    if (!state.id || !state.localPlayer) {
      return
    }
    
    state.isLoading = true
    state.error = null
    
    // Leave game via API
    await leaveGameApi(state.localPlayer.id!)
    
    // Clear local player
    state.localPlayer = null
    
  } catch (error) {
    console.error('Failed to leave game:', error)
    state.error = error instanceof Error ? error.message : 'Failed to leave game'
  } finally {
    state.isLoading = false
  }
}

// Sync game state with server
async function syncGameState() {
  if (!state.id) return
  
  await updateGameState(state.id, {
    shoe: JSON.stringify(state.shoe),
    cards_played: state.cardsPlayed,
    is_game_over: state.isGameOver
  })
}

// Sync player hands with server
async function syncPlayerHands(player: Player) {
  if (!state.id || !player.id) return
  
  await updatePlayerHands(player.id, player.hands)
}

// Sync player bank with server
async function syncPlayerBank(player: Player) {
  if (!state.id || !player.id) return
  
  await updatePlayerBank(player.id, player.bank)
}

// Functions

/** Play a round of blackjack.  Reset hands, reshuffle, place bets, deal cards, and play the first turn. */
export async function playRound() {
  if (checkForGameOver()) return
  state.players.forEach((p) => (p.hands = [new Hand()]))
  state.showDealerHoleCard = false
  await placeBet(state.players[0], state.players[0].hands[0], MINIMUM_BET)
  await dealRound()
  
  // Sync game state after dealing
  await syncGameState()
  
  // Sync player hands
  for (const player of state.players) {
    if (!player.isDealer && player.id) {
      await syncPlayerHands(player)
    }
  }
  
  if (dealerHasBlackjack.value) return endRound()
  playTurn(state.players[0])
}

/** If the player is bankrupt, end the game. */
function checkForGameOver(): boolean {
  if (state.players[0].bank < MINIMUM_BET) {
    playSound(Sounds.GameOver)
    state.isGameOver = true
    syncGameState()
    return true
  }
  return false
}

/** Draw a card from the shoe. */
function drawCard() {
  reshuffleIfNeeded()
  state.cardsPlayed++
  return state.shoe.shift()
}

/** Reshuffle the shoe if less than 25% of the cards are left. */
function reshuffleIfNeeded() {
  const remainingPercentage = 1 - state.cardsPlayed / (NUMBER_OF_DECKS * 52)
  if (remainingPercentage > SHUFFLE_THRESHOLD) return
  state.shoe = shuffle(state.shoe)
  state.cardsPlayed = 0
  syncGameState()
}

/** Deal two cards to each player */
async function dealRound() {
  for (let i = 0; i < 2; i++) {
    for (const player of state.players) {
      player.hands[0].cards.push(drawCard()!)
      playSound(Sounds.Deal)
      await sleep(600)
    }
  }
}

/** Place a bet for the player. */
async function placeBet(player: Player, hand: Hand, amount: number) {
  state.isDealing = true
  await nextTick()
  player.bank -= amount
  hand.bet += amount
  playSound(Sounds.Bet)
  
  // Sync player bank
  if (!player.isDealer && player.id) {
    await syncPlayerBank(player)
  }
  
  await sleep()
}

/** Start a player's turn by making them the active player and starting their first hand. */
function playTurn(player: Player) {
  state.activePlayer = player
  if (player.isDealer) return playDealerHand(player.hands[0])
  playHand(player.hands[0])
}

/** Set a hand as the active hand. End immediately if the player has blackjack. Deal additional cards to split hands. */
async function playHand(hand: Hand): Promise<void> {
  state.isDealing = true
  state.activeHand = hand
  if (await checkForBlackjack(hand)) return
  if (hand.cards.length === 1) {
    // Newly split hand
    await hit()
    if (hand.cards[0].rank === 'A') return endHand() // Player cannot hit after splitting aces
  }
  state.isDealing = false
}

/** Check if the player has blackjack. If so, award the player and end the hand. */
async function checkForBlackjack(hand: Hand): Promise<boolean> {
  if (hand.isBlackjack) {
    hand.result = 'blackjack'
    await sleep(100)
    playSound(Sounds.BlackjackBoom)
    await sleep(500)
    playSound(Sounds.Blackjack)
    await sleep(1200)
    hand.bet *= 3
    
    // Sync player hands
    if (state.activePlayer && !state.activePlayer.isDealer && state.activePlayer.id) {
      await syncPlayerHands(state.activePlayer)
    }
    
    endHand()
    return true
  }
  return false
}

/** Play the dealer's hand. */
async function playDealerHand(hand: Hand) {
  state.isDealing = true
  state.activeHand = hand
  await revealDealerHoleCard()
  const allPlayersDone = state.players.every(
    (p) => p.isDealer || p.hands.every((h: Hand) => !!h.result),
  )
  if (allPlayersDone) return endRound()
  if (dealerTotal.value < 17) {
    await hit()
    if (!dealer.value.hands[0].result) return playDealerHand(hand)
  }
  endRound()
}

/** Deal one more card to the active hand, and check for 21 or a bust. */
export async function hit() {
  state.isDealing = true
  state.activeHand!.cards.push(drawCard()!)
  playSound(Sounds.Deal)
  
  // Sync player hands
  if (state.activePlayer && !state.activePlayer.isDealer && state.activePlayer.id) {
    await syncPlayerHands(state.activePlayer)
  }
  
  if (await checkForTwentyOne(state.activeHand!)) return
  if (await checkForBust(state.activeHand!)) return
  await sleep()
  if (!state.activePlayer?.isDealer) state.isDealing = false
}

/** Check if the player has 21.  If so, end the hand. */
async function checkForTwentyOne(hand: Hand): Promise<boolean> {
  if (hand.total === 21) {
    if (!state.activePlayer?.isDealer) playSound(Sounds.GoodHit)
    await sleep()
    endHand()
    return true
  }
  return false
}

/** Check if the player has busted.  If so, end the hand. */
async function checkForBust(hand: Hand): Promise<boolean> {
  if (hand.isBust) {
    if (!state.activePlayer?.isDealer) playSound(Sounds.BadHit)
    await sleep()
    state.activeHand = null
    await sleep(300)
    hand.result = 'bust'
    if (!state.activePlayer?.isDealer) playSound(Sounds.Bust)
    
    // Sync player hands
    if (state.activePlayer && !state.activePlayer.isDealer && state.activePlayer.id) {
      await syncPlayerHands(state.activePlayer)
    }
    
    endHand()
    return true
  }
  return false
}

/** Split the active hand into two hands, and restart the player's turn. */
export async function split(): Promise<void> {
  if (!canSplit.value) return
  state.isDealing = true
  const bet = state.activeHand!.bet
  const splitHands = [new Hand(bet), new Hand(0)]
  splitHands[0].cards = state.activeHand!.cards.slice(0, 1)
  splitHands[1].cards = state.activeHand!.cards.slice(1)
  state.activeHand = null
  await sleep()
  state.activePlayer!.hands = splitHands
  await placeBet(state.activePlayer!, state.activePlayer!.hands[1], bet)
  
  // Sync player hands and bank
  if (state.activePlayer && !state.activePlayer.isDealer && state.activePlayer.id) {
    await syncPlayerHands(state.activePlayer)
    await syncPlayerBank(state.activePlayer)
  }
  
  playTurn(state.activePlayer!)
}

/** Double the bet for the active hand, and hit only once. */
export async function doubleDown(): Promise<void> {
  if (!canDoubleDown.value) return
  await placeBet(state.activePlayer!, state.activeHand!, state.activeHand!.bet)
  await hit()
  
  // Sync player hands and bank
  if (state.activePlayer && !state.activePlayer.isDealer && state.activePlayer.id) {
    await syncPlayerHands(state.activePlayer)
    await syncPlayerBank(state.activePlayer)
  }
  
  endHand()
}

/** Advance to the next hand or player. */
export async function endHand() {
  const isSplit = state.activePlayer && state.activePlayer.hands.length > 1
  if (isSplit && state.activePlayer?.hands[1].cards.length === 1) {
    return playHand(state.activePlayer?.hands[1])
  }
  if (nextPlayer.value) playTurn(nextPlayer.value)
}

/** Determine any remaining results, settle bets, collect winnings, and reset hands before starting a new round. */
async function endRound() {
  state.isDealing = true
  if (!state.showDealerHoleCard) await revealDealerHoleCard()
  if (dealerHasBlackjack.value) playSound(Sounds.DealerBlackjack)
  state.activeHand = null
  state.activePlayer = null
  await determineResults()
  await settleBets()
  await collectWinnings()
  await resetHands()
  
  // Sync game state
  await syncGameState()
  
  // Sync player data
  for (const player of state.players) {
    if (!player.isDealer && player.id) {
      await syncPlayerHands(player)
      await syncPlayerBank(player)
    }
  }
  
  playRound()
}

/** Reveal the dealer's hole card. */
async function revealDealerHoleCard() {
  if (state.showDealerHoleCard) return
  await sleep()
  playSound(Sounds.Deal)
  state.showDealerHoleCard = true
  await sleep()
}

/** Determine the result for each hand (e.g. win, lose, push, blackjack, bust). */
async function determineResults() {
  for (const player of state.players) {
    if (player.isDealer) continue
    for (const hand of player.hands) {
      if (hand.result) continue
      if (dealerTotal.value > 21) hand.result = 'win'
      else if (dealerTotal.value === hand.total) hand.result = 'push'
      else if (dealerTotal.value < hand.total) hand.result = 'win'
      else hand.result = 'lose'
      playSoundForResult(hand.result)
      await sleep()
    }
  }
}

/** Play a sound for the result of a hand. */
function playSoundForResult(result: HandResult) {
  if (result === 'win') {
    playSound(Sounds.Win)
  } else if (result === 'push') {
    playSound(Sounds.Push)
  } else if (!dealerHasBlackjack.value) {
    playSound(Sounds.Lose)
  }
}

/** Add each hand's winnings to the hand's bet amount (so it can be collected later).*/
async function settleBets() {
  let total = 0
  for (const player of state.players) {
    if (player.isDealer) continue
    for (const hand of player.hands) {
      // Blackjack is paid out immediately, so it is not handled here
      if (hand.result === 'win') hand.bet *= 2
      if (['lose', 'bust'].includes(hand.result!)) hand.bet = 0
      total += hand.bet
    }
  }
  playSound(total > 1 ? Sounds.ChipUp : Sounds.ChipDown)
  await sleep()
}

/** Collect the total winnings (from each hand's bet) and add it to the player's bank. */
async function collectWinnings() {
  for (const player of state.players) {
    if (player.isDealer) continue
    const total = player.hands.reduce((acc: number, hand: Hand) => acc + hand.bet, 0)
    player.bank += total
    if (total > 0) playSound(Sounds.Bank)
    for (const hand of player.hands) hand.bet = 0
    
    // Sync player bank
    if (player.id) {
      await syncPlayerBank(player)
    }
  }
  await sleep(300)
}

/** Reset all hands to an initial state. */
async function resetHands() {
  for (const player of state.players) {
    for (const hand of player.hands) {
      state.shoe.push(...hand.cards)
      hand.reset()
    }
    
    // Sync player hands
    if (!player.isDealer && player.id) {
      await syncPlayerHands(player)
    }
  }
  await sleep()
}

/** Sleep for a given number of milliseconds. This paces the game and gives time for animations and sounds. */
function sleep(ms: number = 900) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
