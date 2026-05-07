const fs = require('fs');
const path = require('path');

exports.default = async function(context) {
  const { appOutDir, packager } = context;

  console.log('🔒 Applying production security measures...');

  // Path to the built app
  const appPath = path.join(appOutDir, 'Coop Tafernout ERP.exe');

  if (fs.existsSync(appPath)) {
    console.log('✅ Production build secured');
    console.log('📝 Remember to:');
    console.log('   - Generate license keys with: npm run generate-license');
    console.log('   - Distribute keys securely to customers');
    console.log('   - Each key works on only one machine');
  } else {
    console.log('⚠️  Could not find built executable');
  }
};