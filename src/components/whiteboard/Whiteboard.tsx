import { useState, useEffect } from "react";
import { Canvas as FabricCanvas } from "fabric";
import { supabase } from "@/integrations/supabase/client";
import { WhiteboardCanvas } from "./WhiteboardCanvas";
import { Toolbar } from "./Toolbar";
import { ChatWindow } from "./ChatWindow";
import { StickyNote } from "./StickyNote";
import { BoardSelector } from "./BoardSelector";
import { BoardMembers } from "./BoardMembers";
import { toast } from "sonner";

export interface StickyNoteData {
  id: string;
  text: string;
  color: "yellow" | "pink" | "blue" | "green";
  position: { x: number; y: number };
}

export const Whiteboard = () => {
  const [activeTool, setActiveTool] = useState<"select" | "draw" | "rectangle" | "circle" | "text">("select");
  const [activeColor, setActiveColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(2);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [stickyNotes, setStickyNotes] = useState<StickyNoteData[]>([]);
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);

  useEffect(() => {
    // Check URL for board parameter
    const urlParams = new URLSearchParams(window.location.search);
    const boardParam = urlParams.get('board');
    if (boardParam) {
      setCurrentBoardId(boardParam);
      handleJoinBoard(boardParam);
    }
  }, []);

  useEffect(() => {
    if (currentBoardId) {
      loadBoardData();
      saveBoardData();
    }
  }, [currentBoardId, stickyNotes, fabricCanvas]);

  const handleJoinBoard = async (boardId: string) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        toast.error("Please log in to join the board");
        return;
      }

      // Add user as member if not already
      const { error } = await supabase
        .from('board_members')
        .upsert({
          board_id: boardId,
          user_id: userData.user.id,
          role: 'editor'
        });

      if (error && !error.message.includes('duplicate')) {
        throw error;
      }

      toast.success("Joined board successfully!");
    } catch (error) {
      console.error('Error joining board:', error);
      toast.error("Failed to join board");
    }
  };

  const loadBoardData = async () => {
    if (!currentBoardId) return;

    try {
      const { data, error } = await supabase
        .from('boards')
        .select('canvas_data, sticky_notes')
        .eq('id', currentBoardId)
        .single();

      if (error) throw error;

      if (data.sticky_notes && Array.isArray(data.sticky_notes)) {
        setStickyNotes(data.sticky_notes as unknown as StickyNoteData[]);
      }

      if (data.canvas_data && fabricCanvas && typeof data.canvas_data === 'object') {
        fabricCanvas.loadFromJSON(data.canvas_data as Record<string, any>, () => {
          fabricCanvas.renderAll();
        });
      }
    } catch (error) {
      console.error('Error loading board data:', error);
    }
  };

  const saveBoardData = async () => {
    if (!currentBoardId || !fabricCanvas) return;

    try {
      const canvasData = fabricCanvas.toJSON();
      
      await supabase
        .from('boards')
        .update({
          canvas_data: canvasData,
          sticky_notes: stickyNotes as any
        })
        .eq('id', currentBoardId);
    } catch (error) {
      console.error('Error saving board data:', error);
    }
  };

  const handleCanvasReady = (canvas: FabricCanvas) => {
    setFabricCanvas(canvas);
  };

  const handleAddStickyNote = () => {
    const colors: Array<"yellow" | "pink" | "blue" | "green"> = ["yellow", "pink", "blue", "green"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newNote: StickyNoteData = {
      id: Date.now().toString(),
      text: "",
      color: randomColor,
      position: { 
        x: Math.random() * (window.innerWidth - 600) + 100, 
        y: Math.random() * (window.innerHeight - 300) + 100 
      },
    };

    setStickyNotes(prev => [...prev, newNote]);
    toast.success("Sticky note added!");
  };

  const handleUpdateStickyNote = (id: string, text: string) => {
    setStickyNotes(prev => 
      prev.map(note => 
        note.id === id ? { ...note, text } : note
      )
    );
  };

  const handleDeleteStickyNote = (id: string) => {
    setStickyNotes(prev => prev.filter(note => note.id !== id));
    toast.success("Sticky note deleted!");
  };

  const handleMoveStickyNote = (id: string, position: { x: number; y: number }) => {
    setStickyNotes(prev => 
      prev.map(note => 
        note.id === id ? { ...note, position } : note
      )
    );
  };

  const handleAddImage = () => {
    // This will be handled by the file input in the toolbar
    toast.info("Click the image button in the toolbar to upload an image!");
  };

  return (
    <div className="h-screen bg-gradient-to-br from-background via-canvas-bg to-muted flex flex-col overflow-hidden">
      {/* Header with Board Controls */}
      <div className="flex items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <BoardSelector
          currentBoardId={currentBoardId}
          onBoardChange={setCurrentBoardId}
        />
        <BoardMembers boardId={currentBoardId} />
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
          onAddImage={handleAddImage}
        />

        {/* Canvas Area */}
        <div className="flex-1 relative">
          <WhiteboardCanvas
            activeTool={activeTool}
            activeColor={activeColor}
            brushSize={brushSize}
            onCanvasReady={handleCanvasReady}
          />

          {/* Sticky Notes - lower z-index than chat */}
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

          {/* Chat Window - higher z-index */}
          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="pointer-events-auto">
              <ChatWindow
                isOpen={isChatOpen}
                onToggle={() => setIsChatOpen(!isChatOpen)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};