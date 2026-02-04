import express from 'express';
import { loginUser, registerUser, verifyJWT } from '../services/secure-auth.js';

const router = express.Router();

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña requeridos' });
    }

    const user = await loginUser(email, password);

    res.cookie('sessionToken', user.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ 
      success: true, 
      token: user.token,
      userName: user.userName,
      message: 'Login exitoso'
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(401).json({ message: error.message });
  }
});

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    const user = await registerUser(name, email, password);

    res.cookie('sessionToken', user.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ 
      success: true, 
      token: user.token,
      userName: user.name,
      message: 'Registro exitoso'
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

// GET /auth/me
router.get('/me', (req, res) => {
  try {
    const token = req.cookies?.sessionToken || (req.headers.authorization?.startsWith('Bearer ') 
      ? req.headers.authorization.substring(7) 
      : null);

    if (!token) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const decoded = verifyJWT(token);
    res.json({ 
      userId: decoded.userId,
      email: decoded.email, 
      userName: decoded.name 
    });
  } catch (error) {
    res.status(401).json({ message: 'No autorizado' });
  }
});

// GET /auth/logout
router.get('/logout', (req, res) => {
  res.clearCookie('sessionToken');
  res.json({ message: 'Sesión cerrada' });
});

export default router;
