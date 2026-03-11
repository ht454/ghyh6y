#!/bin/bash

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Check if build was successful
if [ -d "dist" ]; then
    echo "✅ Build successful! Dist folder created."
    echo "📁 Contents of dist folder:"
    ls -la dist/
else
    echo "❌ Build failed! Dist folder not found."
    exit 1
fi

# Check for index.html
if [ -f "dist/index.html" ]; then
    echo "✅ index.html found in dist folder"
else
    echo "❌ index.html not found in dist folder"
    exit 1
fi

echo "🚀 Ready for deployment!" 