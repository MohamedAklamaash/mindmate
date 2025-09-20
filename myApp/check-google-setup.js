#!/usr/bin/env node

// Simple test script to verify Google OAuth setup
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Google OAuth Configuration...\n');

// Load .env file
const envPath = path.join(__dirname, '.env');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.log('❌ Could not read .env file');
  process.exit(1);
}

// Parse environment variables
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

// Check environment variables
const androidId = envVars.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const iosId = envVars.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const webId = envVars.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

console.log('📱 Android Client ID:', androidId && androidId !== 'your_android_client_id_here' ? '✅ Set' : '❌ Not set');
console.log('🍎 iOS Client ID:', iosId && iosId !== 'your_ios_client_id_here' ? '✅ Set' : '❌ Not set');
console.log('🌐 Web Client ID:', webId && webId !== 'your_web_client_id_here' ? '✅ Set' : '❌ Not set');

const hasAnyId = (androidId && androidId !== 'your_android_client_id_here') ||
                 (iosId && iosId !== 'your_ios_client_id_here') ||
                 (webId && webId !== 'your_web_client_id_here');

console.log('\n🎯 Overall Status:', hasAnyId ? '✅ Ready for Google Sign-In' : '❌ Google OAuth not configured');

if (!hasAnyId) {
  console.log('\n📖 Next Steps:');
  console.log('1. Follow GOOGLE_OAUTH_SETUP.md for setup instructions');
  console.log('2. Add your client IDs to the .env file');
  console.log('3. Restart your Expo development server');
  console.log('4. Test Google Sign-In functionality');
} else {
  console.log('\n🚀 Ready to test Google Sign-In!');
}

console.log('\n💡 Tip: Check the console logs in your app for detailed client ID status');