#!/bin/bash
# Build script to work around ajv dependency issues

# Set environment variables
export NODE_OPTIONS="--openssl-legacy-provider"
export GENERATE_SOURCEMAP=false

# Install specific versions to resolve conflicts
npm install --legacy-peer-deps

# Run the build
npm run build
