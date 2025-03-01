# Blackjack Live

A multiplayer online blackjack game built with Vue 3, TypeScript, and Supabase.

## Features

- Real-time multiplayer gameplay
- Persistent game state across sessions
- Player seat selection
- Real-time updates when players join or leave
- Classic blackjack rules and gameplay

## Prerequisites

- Node.js 16+ and npm
- A Supabase account (free tier works fine)

## Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd blackjack_live
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a Supabase project:
   - Go to [Supabase](https://supabase.com/) and create a new project
   - Note your project URL and anon key

4. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Supabase URL and anon key:
     ```
     VITE_SUPABASE_URL=your-supabase-url
     VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
     ```

5. Set up the database schema:
   - Go to the SQL Editor in your Supabase dashboard
   - Run the SQL from `supabase/schema.sql`

6. Start the development server:
   ```
   npm run dev
   ```

7. Open your browser and navigate to `http://localhost:5173`

## How to Play

1. When you first open the game, you'll see the game table with available seats.
2. Click "Join Game" to enter your name and select a seat.
3. Once seated, you'll be able to play blackjack with other players who join.
4. The game follows standard blackjack rules:
   - Try to get as close to 21 as possible without going over
   - Face cards are worth 10, Aces are worth 1 or 11
   - You can Hit, Stand, Double Down, or Split (when applicable)
   - Dealer must hit on 16 or less and stand on 17 or more

## Deployment

To deploy the game:

1. Build the production version:
   ```
   npm run build
   ```

2. Deploy the contents of the `dist` directory to your hosting provider of choice.

## Technologies Used

- Vue 3 with Composition API
- TypeScript
- Vite
- Supabase (PostgreSQL database with real-time capabilities)
- CSS3 with animations

## License

MIT
