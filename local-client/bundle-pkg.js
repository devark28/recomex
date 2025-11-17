#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('📦 Building recomex-client binary...');

// Build TypeScript
console.log('🔨 Building TypeScript...');
execSync('npm run build', { stdio: 'inherit' });

// Build binary
console.log('📦 Creating binary...');
execSync('npx pkg package-pkg.json', { stdio: 'inherit' });

// Copy setup script and create simple installer
execSync('cp setup.sh bin/', { stdio: 'inherit' });

const installer = `#!/bin/bash
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
`;

fs.writeFileSync('bin/install.sh', installer);
execSync('chmod +x bin/install.sh');

// Create distribution archive
console.log('📦 Creating distribution archive...');
execSync('tar -czf recomex-client.tar.gz -C bin recomex-client setup.sh install.sh', { stdio: 'inherit' });

// Cleanup
fs.unlinkSync('package-pkg.json');

console.log('✅ Distribution ready: recomex-client.tar.gz');
console.log('📋 Contents:');
console.log('   - recomex-client (executable)');
console.log('   - setup.sh (system requirements check)');
console.log('   - install.sh (installer)');
console.log('');
console.log('🚀 Usage:');
console.log('   tar -xzf recomex-client.tar.gz');
console.log('   ./install.sh');