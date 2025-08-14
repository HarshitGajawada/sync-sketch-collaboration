# Collaborative Whiteboard

A real-time collaborative whiteboard application built with React (JavaScript), Node.js, Express, Socket.io, and MongoDB. Features include real-time drawing, sticky notes, chat, user authentication, and board management.

## Features

- **Real-time Collaboration**: Multiple users can draw and interact simultaneously
- **Drawing Tools**: Pencil, shapes (rectangle, circle), text, and color palette
- **Sticky Notes**: Add, edit, move, and delete colorful sticky notes
- **Team Chat**: Real-time messaging within each board
- **User Authentication**: Secure registration and login system
- **Board Management**: Create, join, and manage multiple boards
- **Share Boards**: Share boards with team members using share codes
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend (Client)
- React 18 (JavaScript)
- Vite (build tool)
- Socket.io Client (real-time communication)
- Fabric.js (canvas drawing)
- Tailwind CSS (styling)
- Shadcn/ui (UI components)
- React Router (navigation)
- React Query (state management)

### Backend (Server)
- Node.js
- Express.js
- Socket.io (real-time communication)
- MongoDB with Mongoose (database)
- JWT (authentication)
- bcryptjs (password hashing)
- CORS (cross-origin requests)

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd collaborative-whiteboard
```

### 2. Install Client Dependencies
```bash
cd client
npm install
```

### 3. Install Server Dependencies
```bash
cd ../server
npm install
```

### 4. Environment Setup

Create a `.env` file in the `server` directory:
```bash
cd server
cp .env.example .env
```

Update the `.env` file with your configuration:
```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/whiteboard
JWT_SECRET=your-super-secret-jwt-key-here
CLIENT_URL=http://localhost:5173
```

### 5. Start MongoDB

Make sure MongoDB is running on your system:
```bash
# If using local MongoDB
mongod

# Or if using MongoDB as a service
sudo systemctl start mongod
```

## Running the Application

### Development Mode

1. **Start the backend server:**
```bash
cd server
npm run dev
```
The server will run on http://localhost:8000

2. **Start the frontend development server:**
```bash
cd client
npm run dev
```
The frontend will run on http://localhost:5173

### Production Mode

1. **Build the frontend:**
```bash
cd client
npm run build
```

2. **Start the backend:**
```bash
cd server
npm start
```

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Dashboard**: View your boards and create new ones or join existing boards
3. **Create Board**: Click "Create Board" to start a new collaborative session
4. **Join Board**: Use a share code to join an existing board
5. **Collaborate**: 
   - Use drawing tools to sketch on the canvas
   - Add sticky notes for quick thoughts
   - Chat with team members in real-time
   - See other users' cursors and changes live

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Boards
- `GET /api/boards` - Get user's boards
- `POST /api/boards` - Create new board
- `GET /api/boards/:id` - Get specific board
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board
- `POST /api/boards/join/:shareCode` - Join board by share code

## Socket Events

### Client to Server
- `join-board` - Join a board room
- `leave-board` - Leave a board room
- `canvas-update` - Send canvas changes
- `sticky-note-add` - Add sticky note
- `sticky-note-update` - Update sticky note
- `sticky-note-delete` - Delete sticky note
- `chat-message` - Send chat message
- `cursor-move` - Send cursor position

### Server to Client
- `canvas-update` - Receive canvas changes
- `sticky-note-add` - Receive new sticky note
- `sticky-note-update` - Receive sticky note update
- `sticky-note-delete` - Receive sticky note deletion
- `chat-message` - Receive chat message
- `user-joined` - User joined the board
- `user-left` - User left the board
- `room-users` - Current users in the room
- `cursor-move` - Receive cursor position

## Project Structure

```
collaborative-whiteboard/
├── client/                      # Frontend application
│   ├── src/                    # React source code
│   │   ├── components/         # React components
│   │   │   ├── ui/            # Reusable UI components
│   │   │   └── whiteboard/    # Whiteboard-specific components
│   │   ├── contexts/          # React contexts
│   │   ├── pages/             # Page components
│   │   └── main.jsx          # Application entry point
│   ├── public/                # Static assets
│   ├── package.json          # Frontend dependencies
│   └── vite.config.ts        # Vite configuration
├── server/                     # Backend application
│   ├── models/                # MongoDB models
│   ├── routes/                # Express routes
│   ├── middleware/            # Express middleware
│   ├── package.json          # Backend dependencies
│   └── server.js             # Server entry point
└── README.md                  # Project documentation
```

## Development Scripts

### Root Level Commands
```bash
# Install all dependencies (client + server)
npm run install:all

# Run both client and server in development mode
npm run dev:all
```

### Client Commands
```bash
cd client
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Server Commands
```bash
cd server
npm run dev          # Start development server with nodemon
npm start            # Start production server
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**: Make sure MongoDB is running and the connection string is correct
2. **Socket Connection Failed**: Check if the backend server is running on the correct port
3. **CORS Issues**: Ensure the CLIENT_URL in the backend .env matches your frontend URL
4. **Authentication Issues**: Verify JWT_SECRET is set in the backend .env file

### Development Tips

- Use browser developer tools to monitor Socket.io connections
- Check MongoDB logs for database-related issues
- Monitor server logs for backend errors
- Use React Developer Tools for frontend debugging