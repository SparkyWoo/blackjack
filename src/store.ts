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
  getPlayers as getPlayersApi,
  updatePlayerHands,
  updatePlayerBank,
  subscribeToGame,
  subscribeToPlayers,
  supabase
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

// Helper function to safely parse JSON or return the original object
function safeJsonParse(data: any) {
  if (!data) return null;
  
  // If it's already an object, return it
  if (typeof data !== 'string') return data;
  
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return null;
  }
}

// Helper function to safely stringify JSON
function safeJsonStringify(data: any) {
  if (!data) return null;
  
  // If it's already a string, return it
  if (typeof data === 'string') return data;
  
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Error stringifying JSON:', error);
    return null;
  }
}

export async function initializeGame() {
  try {
    state.isLoading = true
    state.error = null
    
    // Get or create a game
    const game = await getOrCreateGame()
    state.id = game.id
    
    // Set up game state from server
    if (game.shoe) {
      // Use safe parsing
      const parsedShoe = safeJsonParse(game.shoe);
      if (parsedShoe) {
        state.shoe = parsedShoe;
      } else {
        console.warn('Failed to parse shoe data, generating new shoe');
        // If parsing fails, generate a new shoe
        state.shoe = generateShoe(NUMBER_OF_DECKS);
      }
    } else {
      console.warn('No shoe data found, generating new shoe');
      state.shoe = generateShoe(NUMBER_OF_DECKS);
    }
    
    if (game.cards_played !== null && game.cards_played !== undefined) {
      state.cardsPlayed = game.cards_played
    } else {
      state.cardsPlayed = 0;
    }
    
    state.isGameOver = game.is_game_over || false
    
    try {
      // Get players
      const players = await getPlayersApi(game.id)
      
      // Set up players (excluding dealer)
      const gamePlayers = players.map(p => {
        let parsedHands = [new Hand()];
        
        if (p.hands) {
          // Use safe parsing
          const handsData = safeJsonParse(p.hands);
          
          // Convert plain objects to Hand instances
          if (Array.isArray(handsData)) {
            parsedHands = handsData.map(h => {
              const hand = new Hand(h.bet || 0)
              hand.id = h.id || hand.id
              hand.cards = h.cards || []
              hand.result = h.result
              if (h._calculatedTotal !== undefined) {
                hand.total = h._calculatedTotal
              }
              return hand
            })
          }
        }
        
        return {
          id: p.id,
          game_id: p.game_id,
          name: p.name,
          isDealer: false,
          bank: p.bank || STARTING_BANK,
          hands: parsedHands,
          seat_number: p.seat_number,
          is_active: p.is_active
        }
      })
      
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
    } catch (playerError) {
      console.error('Error loading players:', playerError);
      // If we can't load players, at least set up the dealer
      state.players = [{ 
        id: 'dealer',
        game_id: game.id,
        name: 'Dealer',
        isDealer: true, 
        bank: 0, 
        hands: [new Hand()],
        seat_number: 0,
        is_active: true
      }];
    }
    
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
    // Use safe parsing
    const parsedShoe = safeJsonParse(gameData.shoe);
    if (parsedShoe) {
      state.shoe = parsedShoe;
    }
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
    let parsedHands = [new Hand()];
    
    if (playerData.hands) {
      // Use safe parsing
      const handsData = safeJsonParse(playerData.hands);
      
      // Convert plain objects to Hand instances
      if (Array.isArray(handsData)) {
        parsedHands = handsData.map(h => {
          const hand = new Hand(h.bet || 0)
          hand.id = h.id || hand.id
          hand.cards = h.cards || []
          hand.result = h.result
          if (h._calculatedTotal !== undefined) {
            hand.total = h._calculatedTotal
          }
          return hand
        })
      }
    }
    
    const newPlayer = {
      id: playerData.id,
      game_id: playerData.game_id,
      name: playerData.name,
      isDealer: false,
      bank: playerData.bank || STARTING_BANK,
      hands: parsedHands,
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
    // Use safe parsing
    const parsedHands = safeJsonParse(playerData.hands);
    
    // Convert plain objects to Hand instances
    if (Array.isArray(parsedHands)) {
      player.hands = parsedHands.map(h => {
        const hand = new Hand(h.bet || 0)
        hand.id = h.id || hand.id
        hand.cards = h.cards || []
        hand.result = h.result
        if (h._calculatedTotal !== undefined) {
          hand.total = h._calculatedTotal
        }
        return hand
      })
    }
  }
  
  // If this is the local player, update local player reference
  if (state.localPlayer && player.id === state.localPlayer.id) {
    state.localPlayer = player
  }
}

// Add a new function to update the player's last_active timestamp
export async function updatePlayerActivity() {
  try {
    if (!state.id || !state.localPlayer?.id) {
      return
    }
    
    // Update the player's last_active timestamp
    await supabase
      .from('players')
      .update({ last_active: new Date().toISOString() })
      .eq('id', state.localPlayer.id)
  } catch (error) {
    console.error('Failed to update player activity:', error)
  }
}

export async function joinGame(playerName: string, seatNumber: number) {
  try {
    if (!state.id) {
      throw new Error('Game not initialized')
    }
    
    state.isLoading = true
    state.error = null
    
    // Validate inputs
    if (!playerName.trim()) {
      throw new Error('Please enter your name')
    }
    
    if (seatNumber === null) {
      throw new Error('Please select a seat')
    }
    
    // Check if the seat is already taken
    const seatTaken = state.players.some(player => 
      !player.isDealer && 
      player.seat_number === seatNumber && 
      player.is_active
    );
    
    if (seatTaken) {
      throw new Error(`Seat ${seatNumber} is already taken. Please choose another seat.`);
    }
    
    // Save player name to localStorage
    localStorage.setItem('playerName', playerName)
    
    // Join game via API
    const player = await joinGameApi(state.id, playerName, seatNumber)
    
    // Create local player object
    let parsedHands = [new Hand()]
    if (player.hands) {
      // Use safe parsing
      const handsData = safeJsonParse(player.hands);
      
      // Convert plain objects to Hand instances
      if (Array.isArray(handsData)) {
        parsedHands = handsData.map(h => {
          const hand = new Hand(h.bet || 0)
          hand.id = h.id || hand.id
          hand.cards = h.cards || []
          hand.result = h.result
          if (h._calculatedTotal !== undefined) {
            hand.total = h._calculatedTotal
          }
          return hand
        })
      }
    }
    
    const localPlayer = {
      id: player.id,
      game_id: player.game_id,
      name: player.name,
      isDealer: false,
      bank: player.bank || STARTING_BANK,
      hands: parsedHands,
      seat_number: player.seat_number,
      is_active: player.is_active
    }
    
    // Set local player
    state.localPlayer = localPlayer
    
    // Start heartbeat to update player activity
    startPlayerHeartbeat()
    
    // Close join dialog
    state.showJoinDialog = false
    state.selectedSeat = null
    
  } catch (error) {
    console.error('Failed to join game:', error)
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('duplicate key value') || 
          error.message.includes('already exists') ||
          error.message.includes('already taken')) {
        state.error = `Seat ${seatNumber} is already taken. Please choose another seat.`;
      } else {
        state.error = error.message;
      }
    } else {
      state.error = 'Failed to join game';
    }
    
    // Keep the dialog open when there's an error
    state.showJoinDialog = true
  } finally {
    state.isLoading = false
  }
}

// Heartbeat interval reference
let heartbeatInterval: ReturnType<typeof globalThis.setInterval> | null = null;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

// Start the player heartbeat
function startPlayerHeartbeat() {
  // Clear any existing heartbeat
  stopPlayerHeartbeat();
  
  // Start a new heartbeat
  heartbeatInterval = globalThis.setInterval(() => {
    if (state.localPlayer) {
      updatePlayerActivity();
    } else {
      stopPlayerHeartbeat();
    }
  }, HEARTBEAT_INTERVAL);
}

// Stop the player heartbeat
function stopPlayerHeartbeat() {
  if (heartbeatInterval !== null) {
    globalThis.clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

export async function leaveGame() {
  try {
    if (!state.id || !state.localPlayer) {
      return
    }
    
    state.isLoading = true
    state.error = null
    
    // Stop the heartbeat
    stopPlayerHeartbeat();
    
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
    shoe: safeJsonStringify(state.shoe),
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

// Add a function to get players
export async function getPlayers(gameId: string): Promise<Player[]> {
  try {
    if (!gameId) return [];
    
    const playersData = await getPlayersApi(gameId);
    
    // Update the players in the state (excluding dealer)
    const gamePlayers = playersData.map(p => {
      let parsedHands = [new Hand()];
      
      if (p.hands) {
        // Use safe parsing
        const handsData = safeJsonParse(p.hands);
        
        // Convert plain objects to Hand instances
        if (Array.isArray(handsData)) {
          parsedHands = handsData.map(h => {
            const hand = new Hand(h.bet || 0)
            hand.id = h.id || hand.id
            hand.cards = h.cards || []
            hand.result = h.result
            if (h._calculatedTotal !== undefined) {
              hand.total = h._calculatedTotal
            }
            return hand
          })
        }
      }
      
      return {
        id: p.id,
        game_id: p.game_id,
        name: p.name,
        isDealer: false,
        bank: p.bank || STARTING_BANK,
        hands: parsedHands,
        seat_number: p.seat_number,
        is_active: p.is_active
      } as Player;
    });
    
    // Keep the dealer
    const dealer = state.players.find(p => p.isDealer);
    
    if (dealer) {
      // Update players, keeping the dealer at the end
      state.players = [...gamePlayers, dealer];
    } else {
      // If no dealer exists, add one
      state.players = [
        ...gamePlayers,
        { 
          id: 'dealer',
          game_id: gameId,
          name: 'Dealer',
          isDealer: true, 
          bank: 0, 
          hands: [new Hand()],
          seat_number: 0,
          is_active: true
        } as Player
      ];
    }
    
    return gamePlayers;
  } catch (error) {
    console.error('Error getting players:', error);
    return [];
  }
}
