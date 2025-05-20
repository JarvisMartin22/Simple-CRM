#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment of edge functions...${NC}"

# Make sure we're in the right directory
cd "$(dirname "$0")/.."

# Deploy gmail-contacts-preview function
echo -e "${YELLOW}Deploying gmail-contacts-preview function...${NC}"
if npx supabase functions deploy gmail-contacts-preview; then
  echo -e "${GREEN}Successfully deployed gmail-contacts-preview function${NC}"
else
  echo -e "${RED}Failed to deploy gmail-contacts-preview function${NC}"
  exit 1
fi

echo -e "${GREEN}All functions deployed successfully!${NC}" 