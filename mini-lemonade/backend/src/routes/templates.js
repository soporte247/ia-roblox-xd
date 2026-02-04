import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Get templates
router.get('/', (req, res) => {
  const templates = [
    {
      id: 'basic-attack',
      name: 'Basic Attack System',
      description: 'Simple attack with cooldown',
      type: 'attack',
      prompt: 'Create a basic attack system with 1 second cooldown and 10 damage',
    },
    {
      id: 'advanced-attack',
      name: 'Advanced Combat',
      description: 'Attack with combos and critical hits',
      type: 'attack',
      prompt: 'Create an advanced attack system with combo chains, critical hits (20% chance for 2x damage), and 0.5 second cooldown',
    },
    {
      id: 'simple-shop',
      name: 'Simple Shop',
      description: 'Basic shop with coins',
      type: 'shop',
      prompt: 'Create a simple shop system where players can buy items with coins',
    },
    {
      id: 'inventory',
      name: 'Inventory System',
      description: 'Player inventory with slots',
      type: 'inventory',
      prompt: 'Create an inventory system with 20 slots and item stacking',
    },
    {
      id: 'quest-system',
      name: 'Quest System',
      description: 'Mission and quest tracker',
      type: 'quest',
      prompt: 'Create a quest system with objectives, rewards, and progress tracking',
    },
  ];

  res.json({ templates });
});

export default router;
