import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import express from 'express';
import { dbGet, dbRun } from '../services/database.js';

const router = express.Router();

// Servicios de autenticación inline
const ROBLOX_AUTH_URL = 'https://apis.roblox.com/oauth/v1/authorize';
const ROBLOX_TOKEN_URL = 'https://apis.roblox.com/oauth/v1/token';
const ROBLOX_USER_URL = 'https://apis.roblox.com/oauth/v1/user';

const generateState = () => uuidv4();

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

const upsertUser = async (userInfo) => {
  const userId = uuidv4();
  try {
    const existingUser = await dbGet(
      'SELECT id FROM users WHERE robloxId = ?',
      [userInfo.robloxId]
    );

    if (existingUser) {
      await dbRun(
        `UPDATE users SET displayName = ?, avatarUrl = ?, updatedAt = CURRENT_TIMESTAMP 
         WHERE robloxId = ?`,
        [userInfo.displayName, userInfo.avatarUrl, userInfo.robloxId]
      );
      return existingUser.id;
    } else {
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

const stateStore = new Map();

// Rutas
router.get('/roblox', (req, res) => {
  try {
    const state = generateState();
    stateStore.set(state, {
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000
    });
    const authUrl = getAuthorizationUrl(state);
    res.redirect(authUrl);
  } catch (error) {
    console.error('❌ Error initiating Roblox auth:', error);
    res.redirect('/?error=auth_init_failed');
  }
});

router.get('/roblox/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      if (error === 'access_denied') {
        return res.redirect('/?error=login_cancelled');
      }
      return res.redirect(`/?error=oauth_error&details=${error}`);
    }

    if (!code || !state) {
      return res.redirect('/?error=missing_params');
    }

    const stateData = stateStore.get(state);
    if (!stateData) {
      return res.redirect('/?error=invalid_state');
    }

    if (Date.now() > stateData.expiresAt) {
      stateStore.delete(state);
      return res.redirect('/?error=state_expired');
    }

    stateStore.delete(state);

    const tokenData = await exchangeCodeForToken(code);
    const userInfo = await getUserInfo(tokenData.access_token);
    const userId = await upsertUser(userInfo);
    const jwtToken = generateJWT(userId, userInfo.robloxId, userInfo.username);

    res.cookie('jwt', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    console.log(`✅ User authenticated: ${userInfo.username} (ID: ${userInfo.robloxId})`);
    res.redirect('/chat.html');
  } catch (error) {
    console.error('❌ Error in OAuth callback:', error);
    res.redirect(`/?error=callback_error&details=${encodeURIComponent(error.message)}`);
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.jwt || (req.headers.authorization?.startsWith('Bearer ') 
      ? req.headers.authorization.substring(7) 
      : null);

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await dbGet(
      `SELECT id, robloxId, username, displayName, avatarUrl, createdAt FROM users WHERE id = ?`,
      [decoded.userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('❌ Error fetching user info:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('jwt');
  res.json({ message: 'Logged out successfully' });
});

export default router;
