import { createClient } from '@supabase/supabase-js';
import type { Card, Hand } from '@/types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Game functions
export async function getOrCreateGame() {
  try {
    // Try to get an active game
    let { data: game, error } = await supabase
      .from('games')
      .select('*')
      .eq('is_game_over', false)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // If no active game, create one
    if (!game) {
      const { data: newGame, error: createError } = await supabase
        .from('games')
        .insert({})
        .select()
        .single();
      
      if (createError) throw createError;
      game = newGame;
    }

    return game;
  } catch (error) {
    console.error('Error in getOrCreateGame:', error);
    throw error;
  }
}

export async function updateGameState(gameId: string, gameState: any) {
  try {
    // Ensure shoe is properly stringified if it's an object
    if (gameState.shoe && typeof gameState.shoe !== 'string') {
      gameState.shoe = JSON.stringify(gameState.shoe);
    }

    const { data, error } = await supabase
      .from('games')
      .update(gameState)
      .eq('id', gameId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in updateGameState:', error);
    throw error;
  }
}

// Player functions
export async function joinGame(gameId: string, playerName: string, seatNumber: number) {
  try {
    // First check if the seat is already taken
    const { data: existingSeatPlayer } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId)
      .eq('seat_number', seatNumber)
      .eq('is_active', true)
      .single();
    
    if (existingSeatPlayer) {
      throw new Error(`Seat ${seatNumber} is already taken. Please choose another seat.`);
    }
    
    // Check if the name is already taken
    const { data: existingNamePlayer } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId)
      .eq('name', playerName)
      .eq('is_active', true)
      .single();
    
    if (existingNamePlayer) {
      throw new Error(`The name "${playerName}" is already taken. Please choose another name.`);
    }
    
    // Now try to insert the player
    const { data, error } = await supabase
      .from('players')
      .insert({
        game_id: gameId,
        name: playerName,
        seat_number: seatNumber,
        is_active: true,
        hands: JSON.stringify([]) // Ensure hands is properly stringified
      })
      .select()
      .single();

    if (error) {
      // If we still get a conflict error, provide a generic message
      if (error.code === '23505') { // PostgreSQL unique violation code
        throw new Error('This seat or name is already taken. Please try again with different values.');
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in joinGame:', error);
    throw error;
  }
}

export async function leaveGame(playerId: string) {
  try {
    const { data, error } = await supabase
      .from('players')
      .update({ is_active: false })
      .eq('id', playerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in leaveGame:', error);
    throw error;
  }
}

export async function getPlayers(gameId: string) {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId)
      .eq('is_active', true)
      .order('seat_number', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error in getPlayers:', error);
    throw error;
  }
}

export async function updatePlayerHands(playerId: string, hands: Hand[]) {
  try {
    // Ensure hands is properly stringified
    const handsJson = JSON.stringify(hands);

    const { data, error } = await supabase
      .from('players')
      .update({ hands: handsJson })
      .eq('id', playerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in updatePlayerHands:', error);
    throw error;
  }
}

export async function updatePlayerBank(playerId: string, bank: number) {
  try {
    const { data, error } = await supabase
      .from('players')
      .update({ bank })
      .eq('id', playerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in updatePlayerBank:', error);
    throw error;
  }
}

// Subscriptions
export function subscribeToGame(gameId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`game:${gameId}`)
    .on('postgres_changes', { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'games',
      filter: `id=eq.${gameId}`
    }, (payload) => {
      try {
        // Pass the payload.new directly, don't try to parse it
        callback(payload.new);
      } catch (error) {
        console.error('Error in game subscription callback:', error);
      }
    })
    .subscribe();
}

export function subscribeToPlayers(gameId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`players:${gameId}`)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'players',
      filter: `game_id=eq.${gameId}`
    }, (payload) => {
      try {
        // Pass the payload.new directly, don't try to parse it
        callback(payload.new);
      } catch (error) {
        console.error('Error in player subscription callback:', error);
      }
    })
    .subscribe();
} 