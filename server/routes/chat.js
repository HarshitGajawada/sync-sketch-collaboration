import express from 'express';
import Board from '../models/Board.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get chat messages for a board
router.get('/:boardId', authenticateToken, async (req, res) => {
  try {
    const { boardId } = req.params;
    
    const board = await Board.findById(boardId)
      .select('chatMessages')
      .lean();

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Get the last 50 messages (or all if less than 50)
    const messages = board.chatMessages.slice(-50);

    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      boardId: boardId,
      userId: msg.userId.toString(),
      username: msg.username,
      text: msg.text,
      timestamp: msg.createdAt
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;