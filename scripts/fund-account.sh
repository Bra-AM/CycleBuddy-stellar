#!/bin/bash

# Get the account address from command line or use default
ACCOUNT=${1:-GA7KP5DVLIHLUHDY3XPL7MA4M4PMNLADYI547GQVWAGEP6OJUYOS35P3}

echo "Funding account $ACCOUNT using Friendbot..."
curl "https://friendbot.stellar.org?addr=$ACCOUNT"

echo -e "\nAccount funded successfully! You can now deploy contracts." 