import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Canvas as FabricCanvas } from "fabric";
import { WhiteboardCanvas } from "./WhiteboardCanvas";
import { Toolbar } from "./Toolbar";
import { ChatWindow } from "./ChatWindow";
import { StickyNote } from "./StickyNote";
import { BoardMembers } from "./BoardMembers";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2 } from "lucide-react";
import { toast } from "sonner";

export const Whiteboard = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { socket } = useSocket();
  
  const [activeTool, setActiveTool] = useState("select");
  const [activeColor, setActiveColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(2);
  const [fabricCanvas, setFabricCanvas] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [stickyNotes, setStickyNotes] = useState([]);
  const [board, setBoard] = useState(null);
  const [roomUsers, setRoomUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const isReceivingUpdateRef = useRef(false);
  const currentBoardRef = useRef(null);

  useEffect(() => {
    if (boardId) {
      fetchBoard();
    }
  }, [boardId]);

  useEffect(() => {
    if (!socket || !boardId) return;

    // Join board room
    socket.emit('join-board', boardId);
    currentBoardRef.current = boardId;
    
    // Set up event listeners
    socket.on('canvas-update', handleCanvasUpdate);
    socket.on('sticky-note-add', handleStickyNoteAdd);
    socket.on('sticky-note-update', handleStickyNoteUpdate);
    socket.on('sticky-note-delete', handleStickyNoteDelete);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('room-users', setRoomUsers);

    return () => {
      console.log('🔌 Cleaning up socket for board:', boardId);
      socket.off('canvas-update', handleCanvasUpdate);
      socket.off('sticky-note-add', handleStickyNoteAdd);
      socket.off('sticky-note-update', handleStickyNoteUpdate);
      socket.off('sticky-note-delete', handleStickyNoteDelete);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('room-users', setRoomUsers);
      
      socket.emit('leave-board', boardId);
      currentBoardRef.current = null;
    };
  }, [socket, boardId]);

  const fetchBoard = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/boards/${boardId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const boardData = await response.json();
        setBoard(boardData);
        setStickyNotes(boardData.stickyNotes || []);
        
        // Load canvas data if available
        if (boardData.canvasData && fabricCanvas) {
          console.log('Loading canvas data from database');
          isReceivingUpdateRef.current = true;
          fabricCanvas.loadFromJSON(boardData.canvasData, () => {
            fabricCanvas.renderAll();
            setTimeout(() => { isReceivingUpdateRef.current = false; }, 500);
          });
        }
      } else {
        toast.error('Failed to load board');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching board:', error);
      toast.error('Network error');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const saveBoard = async () => {
    if (!fabricCanvas || !board) return;

    try {
      const canvasData = fabricCanvas.toJSON();
      
      await fetch(`http://localhost:8000/api/boards/${boardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          canvasData,
          stickyNotes
        })
      });
    } catch (error) {
      console.error('Error saving board:', error);
    }
  };

  // Auto-save every 5 seconds
  useEffect(() => {
    const interval = setInterval(saveBoard, 5000);
    return () => clearInterval(interval);
  }, [fabricCanvas, stickyNotes]);

  const handleCanvasReady = (canvas) => {
    console.log('Canvas ready, setting up event listeners');
    setFabricCanvas(canvas);
    
    // Load existing canvas data if available
    if (board?.canvasData) {
      console.log('Loading existing canvas data');
      isReceivingUpdateRef.current = true;
      canvas.loadFromJSON(board.canvasData, () => {
        canvas.renderAll();
        setTimeout(() => { isReceivingUpdateRef.current = false; }, 500);
      });
    }
  };

  // Set up canvas event listeners when both canvas and socket are ready
  useEffect(() => {
    if (fabricCanvas && socket && boardId) {
      console.log('Setting up canvas event listeners with socket');
      
      const handlePathCreated = (e) => {
        if (!isReceivingUpdateRef.current) {
          // Assign unique ID to the path
          e.path.id = Date.now() + Math.random();
          
          socket.emit('canvas-update', {
            boardId,
            type: 'path:created',
            data: e.path.toObject()
          });
        }
      };

      const handleObjectAdded = (e) => {
        if (e.target.type !== 'path' && !isReceivingUpdateRef.current) {
          // Assign unique ID if not already present
          if (!e.target.id) {
            e.target.id = Date.now() + Math.random();
          }
          
          socket.emit('canvas-update', {
            boardId,
            type: 'object:added',
            data: e.target.toObject()
          });
        }
      };

      const handleObjectModified = (e) => {
        if (e.target.id && !isReceivingUpdateRef.current) {
          socket.emit('canvas-update', {
            boardId,
            type: 'object:modified',
            data: {
              id: e.target.id,
              changes: e.target.toObject()
            }
          });
        }
      };

      // Add event listeners
      fabricCanvas.on('path:created', handlePathCreated);
      fabricCanvas.on('object:added', handleObjectAdded);
      fabricCanvas.on('object:modified', handleObjectModified);

      // Cleanup function
      return () => {
        fabricCanvas.off('path:created', handlePathCreated);
        fabricCanvas.off('object:added', handleObjectAdded);
        fabricCanvas.off('object:modified', handleObjectModified);
      };
    }
  }, [fabricCanvas, socket, boardId]);

  const handleCanvasUpdate = (data) => {
    if (!fabricCanvas) return;

    isReceivingUpdateRef.current = true;

    // Handle different types of canvas updates from other users
    switch (data.type) {
      case 'path:created':
        // Add path from other user (free drawing)
        import('fabric').then(({ Path }) => {
          const path = new Path(data.data.path, data.data);
          path.id = data.data.id; // Preserve the ID
          fabricCanvas.add(path);
          fabricCanvas.renderAll();
          setTimeout(() => { isReceivingUpdateRef.current = false; }, 100);
        });
        break;
      case 'object:added':
        // Add object from other user (shapes, text, etc.)
        import('fabric').then(({ util }) => {
          util.enlivenObjects([data.data], (objects) => {
            objects.forEach(obj => {
              obj.id = data.data.id; // Preserve the ID
              fabricCanvas.add(obj);
            });
            fabricCanvas.renderAll();
            setTimeout(() => { isReceivingUpdateRef.current = false; }, 100);
          });
        });
        break;
      case 'object:modified':
        // Update existing object
        const obj = fabricCanvas.getObjects().find(o => o.id === data.data.id);
        if (obj) {
          obj.set(data.data.changes);
          fabricCanvas.renderAll();
        }
        setTimeout(() => { isReceivingUpdateRef.current = false; }, 100);
        break;
      case 'full-canvas':
        // Load complete canvas state
        fabricCanvas.loadFromJSON(data.data, () => {
          fabricCanvas.renderAll();
          setTimeout(() => { isReceivingUpdateRef.current = false; }, 100);
        });
        break;
      default:
        setTimeout(() => { isReceivingUpdateRef.current = false; }, 100);
    }
  };

  const handleAddStickyNote = () => {
    const colors = ["yellow", "pink", "blue", "green"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newNote = {
      id: Date.now().toString(),
      text: "",
      color: randomColor,
      position: { 
        x: Math.random() * (window.innerWidth - 600) + 100, 
        y: Math.random() * (window.innerHeight - 300) + 100 
      },
    };

    setStickyNotes(prev => [...prev, newNote]);
    
    if (socket) {
      socket.emit('sticky-note-add', {
        boardId,
        note: newNote
      });
    }
    
    toast.success("Sticky note added!");
  };

  const handleStickyNoteAdd = (data) => {
    setStickyNotes(prev => [...prev, data.note]);
  };

  const handleUpdateStickyNote = (id, text) => {
    setStickyNotes(prev => 
      prev.map(note => 
        note.id === id ? { ...note, text } : note
      )
    );

    if (socket) {
      socket.emit('sticky-note-update', {
        boardId,
        noteId: id,
        text
      });
    }
  };

  const handleStickyNoteUpdate = (data) => {
    setStickyNotes(prev => 
      prev.map(note => 
        note.id === data.noteId ? { ...note, text: data.text } : note
      )
    );
  };

  const handleDeleteStickyNote = (id) => {
    setStickyNotes(prev => prev.filter(note => note.id !== id));
    
    if (socket) {
      socket.emit('sticky-note-delete', {
        boardId,
        noteId: id
      });
    }
    
    toast.success("Sticky note deleted!");
  };

  const handleStickyNoteDelete = (data) => {
    setStickyNotes(prev => prev.filter(note => note.id !== data.noteId));
  };

  const handleMoveStickyNote = (id, position) => {
    setStickyNotes(prev => 
      prev.map(note => 
        note.id === id ? { ...note, position } : note
      )
    );
  };

  const handleUserJoined = (user) => {
    console.log('User joined event received:', user.username);
    setRoomUsers(prev => [...prev, user]);
    toast.success(`${user.username} joined the board`);
  };

  const handleUserLeft = (user) => {
    console.log('User left event received:', user.username);
    setRoomUsers(prev => prev.filter(u => u.userId !== user.userId));
    toast.info(`${user.username} left the board`);
  };

  const copyShareCode = () => {
    if (board?.shareCode) {
      navigator.clipboard.writeText(board.shareCode);
      toast.success('Share code copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-background via-canvas-bg to-muted flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="font-semibold">{board?.title}</h1>
            <p className="text-sm text-muted-foreground">{board?.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={copyShareCode}>
            <Share2 className="h-4 w-4 mr-2" />
            Share: {board?.shareCode}
          </Button>

          <BoardMembers users={roomUsers} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Toolbar */}
        <Toolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          activeColor={activeColor}
          onColorChange={setActiveColor}
          brushSize={brushSize}
          onBrushSizeChange={setBrushSize}
          fabricCanvas={fabricCanvas}
          onAddStickyNote={handleAddStickyNote}
        />

        {/* Canvas Area */}
        <div className="flex-1 relative">
          <WhiteboardCanvas
            activeTool={activeTool}
            activeColor={activeColor}
            brushSize={brushSize}
            onCanvasReady={handleCanvasReady}
          />

          {/* Sticky Notes */}
          <div className="absolute inset-0 pointer-events-none z-10">
            {stickyNotes.map(note => (
              <div key={note.id} className="pointer-events-auto">
                <StickyNote
                  id={note.id}
                  text={note.text}
                  color={note.color}
                  position={note.position}
                  onUpdate={handleUpdateStickyNote}
                  onDelete={handleDeleteStickyNote}
                  onMove={handleMoveStickyNote}
                />
              </div>
            ))}
          </div>

          {/* Chat Window */}
          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="pointer-events-auto">
              <ChatWindow
                isOpen={isChatOpen}
                onToggle={() => setIsChatOpen(!isChatOpen)}
                boardId={boardId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};