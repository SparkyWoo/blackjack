import { createClient } from '@supabase/supabase-js';
import type { Card, Hand } from '@/types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Game functions
export async function getOrCreateGame() {
  // Try to get an active game
  let { data: game } = await supabase
    .from('games')
    .select('*')
    .eq('is_game_over', false)
    .single();

  // If no active game, create one
  if (!game) {
    const { data: newGame } = await supabase
      .from('games')
      .insert({})
      .select()
      .single();
    
    game = newGame;
  }

  return game;
}

export async function updateGameState(gameId: string, gameState: any) {
  const { data, error } = await supabase
    .from('games')
    .update(gameState)
    .eq('id', gameId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Player functions
export async function joinGame(gameId: string, playerName: string, seatNumber: number) {
  const { data, error } = await supabase
    .from('players')
    .insert({
      game_id: gameId,
      name: playerName,
      seat_number: seatNumber,
      is_active: true
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function leaveGame(playerId: string) {
  const { data, error } = await supabase
    .from('players')
    .update({ is_active: false })
    .eq('id', playerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPlayers(gameId: string) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('game_id', gameId)
    .eq('is_active', true)
    .order('seat_number', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function updatePlayerHands(playerId: string, hands: Hand[]) {
  const { data, error } = await supabase
    .from('players')
    .update({ hands })
    .eq('id', playerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePlayerBank(playerId: string, bank: number) {
  const { data, error } = await supabase
    .from('players')
    .update({ bank })
    .eq('id', playerId)
    .select()
    .single();

  if (error) throw error;
  return data;
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
    }, callback)
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
    }, callback)
    .subscribe();
} 