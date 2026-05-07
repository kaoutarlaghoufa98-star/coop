#!/usr/bin/env node

const crypto = require('crypto');

// Generate a random 6-digit numeric license key
function generateLicenseKey() {
  let key = '';

  for (let i = 0; i < 6; i++) {
    key += Math.floor(Math.random() * 10);
  }

  return key;
}

// Generate multiple keys
function generateMultipleKeys(count = 1) {
  const keys = [];
  for (let i = 0; i < count; i++) {
    keys.push(generateLicenseKey());
  }
  return keys;
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const count = parseInt(args[0]) || 1;

  console.log('🔑 Coop Tafernout ERP - Générateur de clés de licence\n');
  console.log(`Génération de ${count} clé(s) de licence:\n`);

  const keys = generateMultipleKeys(count);
  keys.forEach((key, index) => {
    console.log(`${index + 1}. ${key}`);
  });

  console.log('\n⚠️  IMPORTANT: Conservez ces clés en lieu sûr!');
  console.log('Chaque clé peut être utilisée sur une seule machine.');
}

module.exports = { generateLicenseKey, generateMultipleKeys };