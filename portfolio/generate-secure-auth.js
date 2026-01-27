#!/usr/bin/env node

/**
 * Secure Password Hash Generator with AES-256-GCM Encryption
 * This encrypts your bcrypt hash so it's not stored in plaintext in .env
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

async function generateSecureAuth() {
  const args = process.argv.slice(2);
  const password = args[0];

  if (!password) {
    console.error('\n❌ Error: Please provide a password\n');
    console.log('Usage: node generate-secure-auth.js YourPassword');
    console.log('Example: node generate-secure-auth.js MySecureP@ssw0rd123\n');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters long');
    process.exit(1);
  }

  console.log('\n🔐 Generating secure authentication credentials...\n');

  const sessionPassword = crypto.randomBytes(32).toString('hex');
  
  const encryptionKey = crypto.randomBytes(32).toString('hex');
  
  console.log('⏳ Hashing password with bcrypt...');
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  console.log('✅ Password hashed');
  
  console.log('⏳ Encrypting hash with AES-256-GCM...');
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(encryptionKey, 'hex');
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(passwordHash, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  const encryptedHash = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  console.log('✅ Hash encrypted\n');

  console.log('⏳ Verifying encryption/decryption...');
  const [testIv, testAuthTag, testEncrypted] = encryptedHash.split(':');
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(testIv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(testAuthTag, 'hex'));
  let decrypted = decipher.update(testEncrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  if (decrypted === passwordHash) {
    console.log('✅ Encryption verified successfully\n');
  } else {
    console.error('❌ Verification failed!');
    process.exit(1);
  }

  console.log('⏳ Verifying password against hash...');
  const passwordVerified = await bcrypt.compare(password, passwordHash);
  if (passwordVerified) {
    console.log('✅ Password verification successful\n');
  } else {
    console.error('❌ Password verification failed!');
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ SECURE CREDENTIALS GENERATED');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('Add these to your .env.local file:\n');
  console.log('# Session encryption key (for cookie encryption)');
  console.log(`SESSION_PASSWORD=${sessionPassword}\n`);
  console.log('# Password hash encryption key (for hash decryption)');
  console.log(`HASH_ENCRYPTION_KEY=${encryptionKey}\n`);
  console.log('# Encrypted password hash (AES-256-GCM encrypted bcrypt hash)');
  console.log(`ADMIN_PASSWORD_HASH_ENCRYPTED=${encryptedHash}\n`);
  console.log('# Admin email');
  console.log(`ADMIN_EMAIL=admin@example.com\n`);
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('⚠️  SECURITY NOTES:');
  console.log('1. Keep HASH_ENCRYPTION_KEY secret - it decrypts your password hash');
  console.log('2. Both keys use AES-256 encryption (military-grade)');
  console.log('3. The encrypted hash uses GCM mode for authenticated encryption');
  console.log('4. Never commit .env.local to version control');
  console.log('5. Your login password is:', password);
  console.log('\n📝 Your bcrypt hash (for reference):');
  console.log(passwordHash);
  console.log('\n');
}

generateSecureAuth().catch(console.error);