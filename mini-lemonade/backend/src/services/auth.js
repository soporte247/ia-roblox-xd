const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { dbRun, dbGet } = require('./database');

const ROBLOX_AUTH_URL = 'https://apis.roblox.com/oauth/v1/authorize';
const ROBLOX_TOKEN_URL = 'https://apis.roblox.com/oauth/v1/token';
const ROBLOX_USER_URL = 'https://apis.roblox.com/oauth/v1/user';

// Generar estado CSRF
const generateState = () => {
  return uuidv4();
};

// Obtener URL de autorización de Roblox
const getAuthorizationUrl = (state) => {
  const params = new URLSearchParams({
    client_id: process.env.ROBLOX_CLIENT_ID,
    redirect_uri: process.env.ROBLOX_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid profile',
    state: state
  });

  return `${ROBLOX_AUTH_URL}?${params.toString()}`;
};

// Intercambiar código por token
const exchangeCodeForToken = async (code) => {
  try {
    const response = await axios.post(ROBLOX_TOKEN_URL, {
      client_id: process.env.ROBLOX_CLIENT_ID,
      client_secret: process.env.ROBLOX_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.ROBLOX_REDIRECT_URI
    });

    return response.data;
  } catch (error) {
    console.error('❌ Error exchanging code:', error.response?.data || error.message);
    throw new Error('Failed to exchange authorization code for token');
  }
};

// Obtener información del usuario desde Roblox
const getUserInfo = async (accessToken) => {
  try {
    const response = await axios.get(ROBLOX_USER_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const { sub, preferred_username, name, picture } = response.data;

    return {
      robloxId: parseInt(sub),
      username: preferred_username,
      displayName: name,
      avatarUrl: picture
    };
  } catch (error) {
    console.error('❌ Error fetching user info:', error.response?.data || error.message);
    throw new Error('Failed to fetch user information from Roblox');
  }
};

// Crear o actualizar usuario en base de datos
const upsertUser = async (userInfo) => {
  const userId = uuidv4();
  
  try {
    // Verificar si el usuario ya existe
    const existingUser = await dbGet(
      'SELECT id FROM users WHERE robloxId = ?',
      [userInfo.robloxId]
    );

    if (existingUser) {
      // Actualizar usuario existente
      await dbRun(
        `UPDATE users SET displayName = ?, avatarUrl = ?, updatedAt = CURRENT_TIMESTAMP 
         WHERE robloxId = ?`,
        [userInfo.displayName, userInfo.avatarUrl, userInfo.robloxId]
      );
      return existingUser.id;
    } else {
      // Crear nuevo usuario
      await dbRun(
        `INSERT INTO users (id, robloxId, username, displayName, avatarUrl) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, userInfo.robloxId, userInfo.username, userInfo.displayName, userInfo.avatarUrl]
      );
      return userId;
    }
  } catch (error) {
    console.error('❌ Error upserting user:', error);
    throw new Error('Failed to create or update user');
  }
};

// Generar JWT
const generateJWT = (userId, robloxId, username) => {
  return jwt.sign(
    {
      userId,
      robloxId,
      username,
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Verificar JWT
const verifyJWT = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error('❌ JWT verification failed:', error.message);
    return null;
  }
};

module.exports = {
  generateState,
  getAuthorizationUrl,
  exchangeCodeForToken,
  getUserInfo,
  upsertUser,
  generateJWT,
  verifyJWT
};
