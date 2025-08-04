import express from 'express';
import Board from '../models/Board.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all boards for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ]
    })
    .populate('owner', 'username email')
    .populate('members.user', 'username email')
    .sort({ updatedAt: -1 });

    res.json(boards);
  } catch (error) {
    console.error('Error fetching boards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single board
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('members.user', 'username email');

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Check if user has access
    const hasAccess = board.owner._id.toString() === req.user._id.toString() ||
                     board.members.some(member => member.user._id.toString() === req.user._id.toString()) ||
                     board.isPublic;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(board);
  } catch (error) {
    console.error('Error fetching board:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new board
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, isPublic } = req.body;

    const board = new Board({
      title,
      description,
      owner: req.user._id,
      isPublic: isPublic || false,
      members: [{
        user: req.user._id,
        role: 'owner'
      }]
    });

    await board.save();
    await board.populate('owner', 'username email');
    await board.populate('members.user', 'username email');

    res.status(201).json(board);
  } catch (error) {
    console.error('Error creating board:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update board
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Check if user is owner or editor
    const userMember = board.members.find(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (!userMember || (userMember.role !== 'owner' && userMember.role !== 'editor')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { title, description, canvasData, stickyNotes } = req.body;

    if (title !== undefined) board.title = title;
    if (description !== undefined) board.description = description;
    if (canvasData !== undefined) board.canvasData = canvasData;
    if (stickyNotes !== undefined) board.stickyNotes = stickyNotes;

    await board.save();
    await board.populate('owner', 'username email');
    await board.populate('members.user', 'username email');

    res.json(board);
  } catch (error) {
    console.error('Error updating board:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join board by share code
router.post('/join/:shareCode', authenticateToken, async (req, res) => {
  try {
    const board = await Board.findOne({ shareCode: req.params.shareCode });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Check if user is already a member
    const existingMember = board.members.find(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (existingMember) {
      return res.status(400).json({ error: 'Already a member of this board' });
    }

    // Add user as member
    board.members.push({
      user: req.user._id,
      role: 'editor'
    });

    await board.save();
    await board.populate('owner', 'username email');
    await board.populate('members.user', 'username email');

    res.json(board);
  } catch (error) {
    console.error('Error joining board:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete board
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Only owner can delete
    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only owner can delete board' });
    }

    await Board.findByIdAndDelete(req.params.id);
    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    console.error('Error deleting board:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;