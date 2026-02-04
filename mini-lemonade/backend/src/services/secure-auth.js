import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { dbRun, dbGet } from './database.js';

const SALT_ROUNDS = 10;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutos

// Hashear contraseña
export async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Verificar contraseña
export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Registrar usuario
export async function registerUser(name, email, password) {
  try {
    // Verificar si el email ya existe
    const existingUser = await dbGet(
      'SELECT id FROM auth_users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (existingUser) {
      throw new Error('Este email ya está registrado');
    }

    // Validar email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Email inválido');
    }

    // Validar contraseña
    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    if (name.length < 2) {
      throw new Error('El nombre debe tener al menos 2 caracteres');
    }

    // Hashear contraseña
    const hashedPassword = await hashPassword(password);
    const userId = uuidv4();

    // Guardar en BD
    await dbRun(
      `INSERT INTO auth_users (id, name, email, passwordHash, createdAt) 
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [userId, name, email.toLowerCase(), hashedPassword]
    );

    console.log(`✅ User registered: ${email}`);

    // Generar JWT
    const token = jwt.sign(
      { userId, email, name, iat: Math.floor(Date.now() / 1000) },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { userId, email, name, token };
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    throw error;
  }
}

// Login seguro con rate limiting
export async function loginUser(email, password) {
  try {
    // Validar inputs
    if (!email || !password) {
      throw new Error('Email y contraseña requeridos');
    }

    // Obtener usuario
    const user = await dbGet(
      'SELECT id, name, email, passwordHash, failedAttempts, lockedUntil FROM auth_users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (!user) {
      // Registrar intento fallido
      await recordFailedLogin(email.toLowerCase());
      throw new Error('Email o contraseña incorrectos');
    }

    // Verificar si está bloqueado
    if (user.lockedUntil) {
      const now = Date.now();
      const lockedUntil = parseInt(user.lockedUntil);
      
      if (now < lockedUntil) {
        const remainingMinutes = Math.ceil((lockedUntil - now) / 1000 / 60);
        throw new Error(`Cuenta bloqueada. Intenta en ${remainingMinutes} minuto(s)`);
      } else {
        // Desbloquear cuenta
        await dbRun(
          'UPDATE auth_users SET failedAttempts = 0, lockedUntil = NULL WHERE id = ?',
          [user.id]
        );
      }
    }

    // Verificar contraseña
    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      await recordFailedLogin(user.id);
      throw new Error('Email o contraseña incorrectos');
    }

    // Limpiar intentos fallidos
    await dbRun(
      'UPDATE auth_users SET failedAttempts = 0, lockedUntil = NULL, lastLogin = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    console.log(`✅ User logged in: ${email}`);

    // Generar JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name, iat: Math.floor(Date.now() / 1000) },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { userId: user.id, email: user.email, userName: user.name, token };
  } catch (error) {
    console.error('❌ Login error:', error.message);
    throw error;
  }
}

// Registrar intento fallido
async function recordFailedLogin(emailOrId) {
  try {
    const user = await dbGet(
      'SELECT id, failedAttempts, lockedUntil FROM auth_users WHERE email = ? OR id = ?',
      [emailOrId, emailOrId]
    );

    if (!user) return;

    const failedAttempts = (user.failedAttempts || 0) + 1;
    let lockedUntil = null;

    if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
      lockedUntil = Date.now() + LOCKOUT_TIME;
      console.warn(`🔒 User locked: ${emailOrId} (${failedAttempts} attempts)`);
    }

    await dbRun(
      'UPDATE auth_users SET failedAttempts = ?, lockedUntil = ? WHERE id = ?',
      [failedAttempts, lockedUntil ? lockedUntil.toString() : null, user.id]
    );
  } catch (error) {
    console.error('Error recording failed login:', error);
  }
}

// Verificar JWT
export function verifyJWT(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
}
