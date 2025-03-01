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
    console.log(`Attempting to join game: ${gameId} with name: ${playerName} and seat: ${seatNumber}`);
    
    // First check if the seat is already taken by an active player
    const { data: existingSeatPlayer, error: seatError } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId)
      .eq('seat_number', seatNumber)
      .eq('is_active', true)
      .maybeSingle();
    
    if (seatError) {
      console.error('Seat check error:', seatError);
      if (seatError.code !== 'PGRST116') {
        throw seatError;
      }
    }
    
    if (existingSeatPlayer) {
      console.log('Seat already taken:', existingSeatPlayer);
      throw new Error(`Seat ${seatNumber} is already taken. Please choose another seat.`);
    }
    
    // Check if the name is already taken by an active player
    const { data: existingNamePlayer, error: nameError } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId)
      .eq('name', playerName)
      .eq('is_active', true)
      .maybeSingle();
    
    if (nameError) {
      console.error('Name check error:', nameError);
      if (nameError.code !== 'PGRST116') {
        throw nameError;
      }
    }
    
    if (existingNamePlayer) {
      console.log('Name already taken:', existingNamePlayer);
      throw new Error(`The name "${playerName}" is already taken. Please choose another name.`);
    }
    
    // Check for inactive player with the same name or seat
    const { data: inactivePlayer, error: inactiveError } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId)
      .eq('is_active', false)
      .or(`name.eq.${playerName},seat_number.eq.${seatNumber}`)
      .maybeSingle();
    
    if (inactiveError && inactiveError.code !== 'PGRST116') {
      console.error('Inactive player check error:', inactiveError);
      throw inactiveError;
    }
    
    // Prepare empty hands array as a JSON string
    const emptyHands = "[]";
    
    // If there's an inactive player with the same name or seat, reactivate them
    if (inactivePlayer) {
      console.log('Found inactive player to reactivate:', inactivePlayer);
      
      const { data, error } = await supabase
        .from('players')
        .update({
          name: playerName,
          seat_number: seatNumber,
          is_active: true,
          hands: emptyHands,
          bank: 20, // Reset bank to default
          last_active: new Date().toISOString()
        })
        .eq('id', inactivePlayer.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error reactivating player:', error);
        throw error;
      }
      
      console.log('Player reactivated successfully:', data);
      return data;
    }
    
    // Otherwise, create a new player
    console.log('Creating new player with data:', {
      game_id: gameId,
      name: playerName,
      seat_number: seatNumber,
      is_active: true,
      hands: emptyHands,
      bank: 20
    });
    
    try {
      const { data, error } = await supabase
        .from('players')
        .insert({
          game_id: gameId,
          name: playerName,
          seat_number: seatNumber,
          is_active: true,
          hands: emptyHands,
          bank: 20,
          last_active: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Insert player error:', error);
        // If we still get a conflict error, provide a generic message
        if (error.code === '23505') { // PostgreSQL unique violation code
          throw new Error('This seat or name is already taken. Please try again with different values.');
        }
        throw error;
      }
      
      console.log('Player joined successfully:', data);
      return data;
    } catch (insertError: any) {
      console.error('Insert player error (caught):', insertError);
      
      // Handle 409 Conflict specifically
      if (insertError.status === 409 || (insertError.message && insertError.message.includes('Conflict'))) {
        // Try to find the conflicting player
        const { data: conflictPlayers } = await supabase
          .from('players')
          .select('*')
          .eq('game_id', gameId)
          .or(`name.eq.${playerName},seat_number.eq.${seatNumber}`);
        
        console.log('Conflict players found:', conflictPlayers);
        
        if (conflictPlayers && conflictPlayers.length > 0) {
          // Check if any of the conflicting players are inactive
          const inactiveConflictPlayer = conflictPlayers.find(p => !p.is_active);
          
          if (inactiveConflictPlayer) {
            console.log('Found inactive conflict player to reactivate:', inactiveConflictPlayer);
            
            // Reactivate the inactive player
            const { data: reactivatedPlayer, error: reactivateError } = await supabase
              .from('players')
              .update({
                name: playerName,
                seat_number: seatNumber,
                is_active: true,
                hands: emptyHands,
                bank: 20,
                last_active: new Date().toISOString()
              })
              .eq('id', inactiveConflictPlayer.id)
              .select()
              .single();
            
            if (reactivateError) {
              console.error('Error reactivating conflict player:', reactivateError);
              throw reactivateError;
            }
            
            console.log('Conflict player reactivated successfully:', reactivatedPlayer);
            return reactivatedPlayer;
          }
        }
        
        throw new Error(`The name "${playerName}" or seat ${seatNumber} is already taken. Please try different values.`);
      }
      
      throw insertError;
    }
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
    // Use GET request for selecting data
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
    let handsJson;
    
    try {
      handsJson = JSON.stringify(hands);
      
      // Validate that the JSON is valid
      JSON.parse(handsJson);
    } catch (error) {
      console.error('Error stringifying hands:', error);
      // Fallback to empty array if stringification fails
      handsJson = "[]";
    }

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

// Add a function to check database schema
export async function checkDatabaseSchema() {
  try {
    // Get table information
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'players' });
    
    if (tableError) {
      console.error('Error getting table info:', tableError);
      return { error: tableError };
    }
    
    // Get constraint information
    const { data: constraintInfo, error: constraintError } = await supabase
      .from('information_schema.table_constraints')
      .select('*')
      .eq('table_name', 'players');
    
    if (constraintError) {
      console.error('Error getting constraint info:', constraintError);
      return { error: constraintError, tableInfo };
    }
    
    return { tableInfo, constraintInfo };
  } catch (error) {
    console.error('Error checking database schema:', error);
    return { error };
  }
}

// Add a function to check for existing players
export async function checkExistingPlayers(gameId: string) {
  try {
    // Get all players for the game, including inactive ones
    const { data: allPlayers, error: allPlayersError } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId);
    
    if (allPlayersError) {
      console.error('Error getting all players:', allPlayersError);
      return { error: allPlayersError };
    }
    
    // Get only active players
    const { data: activePlayers, error: activePlayersError } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId)
      .eq('is_active', true);
    
    if (activePlayersError) {
      console.error('Error getting active players:', activePlayersError);
      return { error: activePlayersError, allPlayers };
    }
    
    return { allPlayers, activePlayers };
  } catch (error) {
    console.error('Error checking existing players:', error);
    return { error };
  }
}

// Add a debug function to diagnose issues
export async function debugJoinGame(gameId: string, playerName: string, seatNumber: number) {
  try {
    console.log('Debug: Starting join game process');
    
    // 1. Check for active players with the same seat
    const { data: seatPlayers, error: seatError } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId)
      .eq('seat_number', seatNumber);
    
    console.log('Debug: Players with same seat:', seatPlayers);
    if (seatError) console.error('Debug: Seat query error:', seatError);
    
    // 2. Check for active players with the same name
    const { data: namePlayers, error: nameError } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId)
      .eq('name', playerName);
    
    console.log('Debug: Players with same name:', namePlayers);
    if (nameError) console.error('Debug: Name query error:', nameError);
    
    // 3. Try a simple insert with minimal data
    try {
      const { data: testInsert, error: insertError } = await supabase
        .from('players')
        .insert({
          game_id: gameId,
          name: `${playerName}_test_${Date.now()}`,
          seat_number: 999,
          is_active: true
        })
        .select()
        .single();
      
      console.log('Debug: Test insert result:', testInsert);
      
      // Clean up test insert
      if (testInsert && testInsert.id) {
        await supabase
          .from('players')
          .delete()
          .eq('id', testInsert.id);
        
        console.log('Debug: Test insert cleaned up');
      }
    } catch (insertError) {
      console.error('Debug: Test insert error:', insertError);
    }
    
    // 4. Check table structure
    try {
      const { data: tableInfo } = await supabase
        .rpc('get_table_info', { table_name: 'players' });
      
      console.log('Debug: Table structure:', tableInfo);
    } catch (tableError) {
      console.error('Debug: Table info error:', tableError);
    }
    
    return {
      seatPlayers,
      namePlayers
    };
  } catch (error) {
    console.error('Debug: Overall error:', error);
    return { error };
  }
} 