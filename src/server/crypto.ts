import crypto from 'crypto'

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY_HEX || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex')
const ALGORITHM = 'aes-256-gcm'

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  // Format: iv|encrypted|authTag (all in hex)
  return `${iv.toString('hex')}|${encrypted}|${authTag.toString('hex')}`
}

export function decrypt(encryptedData: string): string {
  const parts = encryptedData.split('|')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format')
  }
  
  const iv = Buffer.from(parts[0], 'hex')
  const encrypted = parts[1]
  const authTag = Buffer.from(parts[2], 'hex')
  
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

export function hmac(text: string): string {
  return crypto
    .createHmac('sha256', ENCRYPTION_KEY)
    .update(text)
    .digest('hex')
}
