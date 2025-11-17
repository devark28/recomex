#!/bin/bash

echo "🔧 Checking required CLI tools..."

# Check for required tools
REQUIRED_TOOLS=("pamixer" "brightnessctl" "playerctl")
MISSING_TOOLS=()

for tool in "${REQUIRED_TOOLS[@]}"; do
    if ! command -v "$tool" &> /dev/null; then
        MISSING_TOOLS+=("$tool")
    else
        echo "✅ $tool found"
    fi
done

if [ ${#MISSING_TOOLS[@]} -ne 0 ]; then
    echo ""
    echo "❌ Missing required tools: ${MISSING_TOOLS[*]}"
    echo ""
    echo "Install them with:"
    echo "sudo apt update"
    echo "sudo apt install pamixer brightnessctl playerctl"
    exit 1
else
    echo ""
    echo "✅ All required tools are installed!"
    echo ""
    echo "Next steps:"
    echo "1. npm run build"
    echo "2. npm run register -- <token>"
    echo "3. npm start"
fi