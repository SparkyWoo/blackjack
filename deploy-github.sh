#!/bin/bash

# Build the project
npm run build

# Create a temporary directory for the gh-pages branch
mkdir -p tmp/gh-pages

# Copy the dist directory to the temporary directory
cp -r dist/* tmp/gh-pages/

# Switch to the gh-pages branch
git checkout -b gh-pages

# Remove all files except the .git directory
find . -maxdepth 1 ! -name .git ! -name tmp -exec rm -rf {} \;

# Copy the contents of the temporary directory to the root
cp -r tmp/gh-pages/* .

# Remove the temporary directory
rm -rf tmp

# Add all files to git
git add .

# Commit the changes
git commit -m "Deploy to GitHub Pages"

# Push to the gh-pages branch
git push -f origin gh-pages

# Switch back to the main branch
git checkout main

echo "Deployed to GitHub Pages!" 