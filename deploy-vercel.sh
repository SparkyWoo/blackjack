#!/bin/bash

# Build the project
npm run build

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel --prod 