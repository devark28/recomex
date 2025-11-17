#!/bin/bash
set -e

echo "🎮 Recomex Client Installer"
echo ""

# Run system checks
./setup.sh

# Install binary
echo ""
echo "📦 Installing recomex-client..."
sudo cp recomex-client /usr/local/bin/
sudo chmod +x /usr/local/bin/recomex-client

echo ""
echo "✅ Installation complete!"
echo ""
echo "Usage:"
echo "  recomex-client register <token>"
echo "  recomex-client start"
