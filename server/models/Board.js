import mongoose from 'mongoose';

const boardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer'],
      default: 'editor'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  canvasData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  stickyNotes: [{
    id: String,
    text: String,
    color: {
      type: String,
      enum: ['yellow', 'pink', 'blue', 'green'],
      default: 'yellow'
    },
    position: {
      x: Number,
      y: Number
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  chatMessages: [{
    id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: 1000
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  shareCode: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Generate share code before saving
boardSchema.pre('save', function(next) {
  if (this.isNew && !this.shareCode) {
    this.shareCode = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);
  }
  next();
});

export default mongoose.model('Board', boardSchema);