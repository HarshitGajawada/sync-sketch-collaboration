import { useState } from "react";
import { Canvas as FabricCanvas } from "fabric";
import { WhiteboardCanvas } from "./WhiteboardCanvas";
import { Toolbar } from "./Toolbar";
import { ChatWindow } from "./ChatWindow";
import { StickyNote } from "./StickyNote";
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
    <div className="h-screen bg-gradient-to-br from-background via-canvas-bg to-muted flex overflow-hidden">
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

        {/* Sticky Notes */}
        {stickyNotes.map(note => (
          <StickyNote
            key={note.id}
            id={note.id}
            text={note.text}
            color={note.color}
            position={note.position}
            onUpdate={handleUpdateStickyNote}
            onDelete={handleDeleteStickyNote}
            onMove={handleMoveStickyNote}
          />
        ))}

        {/* Chat Window */}
        <ChatWindow
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen(!isChatOpen)}
        />
      </div>
    </div>
  );
};