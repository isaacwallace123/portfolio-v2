"use server";

import crypto from "crypto";
import bcrypt from "bcrypt";
import { createSession, destroySession } from "./session";
import type { LoginActionState, User } from "@/features/auth/user";
import { loginSchema } from "../lib/validation";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@example.com";

/**
 * Decrypt the password hash using AES-256-GCM
 */
function decryptPasswordHash(encryptedHash: string, encryptionKey: string): string {
  try {
    const [ivHex, authTagHex, encrypted] = encryptedHash.split(':');
    
    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted hash format');
    }
    
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(encryptionKey, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Failed to decrypt password hash:', error);
    throw new Error('Hash decryption failed');
  }
}

/**
 * Get the password hash - supports multiple formats for backward compatibility
 */
function getPasswordHash(): string {
  // Priority 1: Encrypted hash (most secure)
  const encryptedHash = process.env.ADMIN_PASSWORD_HASH_ENCRYPTED;
  const encryptionKey = process.env.HASH_ENCRYPTION_KEY;
  
  if (encryptedHash && encryptionKey) {
    try {
      return decryptPasswordHash(encryptedHash, encryptionKey);
    } catch (error) {
      console.error('Using encrypted hash but decryption failed:', error);
      throw error;
    }
  }
  
  // Priority 2: Base64 encoded (for migration)
  const base64Hash = process.env.ADMIN_PASSWORD_HASH_BASE64;
  if (base64Hash) {
    try {
      return Buffer.from(base64Hash, 'base64').toString('utf-8');
    } catch (e) {
      console.error("Failed to decode base64 hash");
    }
  }
  
  // Priority 3: Plain hash (least secure, for backward compatibility)
  const plainHash = process.env.ADMIN_PASSWORD_HASH ?? "";
  if (plainHash && !plainHash.startsWith('$2')) {
    // Hash is corrupted by env variable parsing, try to reconstruct
    return '$2b$12$' + plainHash;
  }
  
  return plainHash;
}

const ADMIN_PASSWORD_HASH = getPasswordHash();

function invalid(): LoginActionState {
  return { success: false, error: "Invalid email or password" };
}

export async function loginAction(
  _prev: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  try {
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔐 Secure Login Attempt");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Email:", email);
    console.log("Expected:", ADMIN_EMAIL.toLowerCase());
    console.log("Hash method:", process.env.ADMIN_PASSWORD_HASH_ENCRYPTED ? "AES-256-GCM" : 
                                 process.env.ADMIN_PASSWORD_HASH_BASE64 ? "Base64" : "Plain");
    console.log("Hash valid:", ADMIN_PASSWORD_HASH.startsWith('$2'));
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Validate input
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      console.log("❌ Validation failed");
      return { success: false, error: "Please enter a valid email and password" };
    }

    // Check hash is valid
    if (!ADMIN_PASSWORD_HASH || ADMIN_PASSWORD_HASH.length < 50) {
      console.error("❌ Invalid password hash configuration");
      return { 
        success: false, 
        error: "Server configuration error." 
      };
    }

    // Check session password
    if (!process.env.SESSION_PASSWORD) {
      console.error("❌ SESSION_PASSWORD not set");
      return { 
        success: false, 
        error: "Server configuration error." 
      };
    }

    // Verify email
    if (email !== ADMIN_EMAIL.toLowerCase()) {
      console.log("❌ Email mismatch");
      await new Promise(resolve => setTimeout(resolve, 1000));
      return invalid();
    }

    // Verify password against bcrypt hash
    console.log("🔍 Verifying password...");
    const isPasswordValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    console.log("Result:", isPasswordValid ? "✅ SUCCESS" : "❌ FAILED");

    if (!isPasswordValid) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return invalid();
    }

    // Create session
    const user: User = {
      id: "admin-1",
      email: ADMIN_EMAIL,
      role: "admin",
      createdAt: new Date().toISOString(),
    };

    await createSession(user);
    console.log("✅ Login successful");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    return { success: true };
  } catch (error) {
    console.error("❌ Login error:", error);
    return { 
      success: false, 
      error: "An unexpected error occurred. Please try again." 
    };
  }
}

export async function logoutAction() {
  try {
    await destroySession();
  } catch (error) {
    console.error("Logout error:", error);
  }
}