import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

export interface StickyNoteProps {
  id: string;
  text: string;
  color: "yellow" | "pink" | "blue" | "green";
  position: { x: number; y: number };
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, position: { x: number; y: number }) => void;
}

const colorClasses = {
  yellow: "bg-sticky-yellow border-yellow-300",
  pink: "bg-sticky-pink border-pink-300",
  blue: "bg-sticky-blue border-blue-300",
  green: "bg-sticky-green border-green-300",
};

export const StickyNote = ({
  id,
  text,
  color,
  position,
  onUpdate,
  onDelete,
  onMove,
}: StickyNoteProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentText, setCurrentText] = useState(text);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleSave = () => {
    onUpdate(id, currentText);
    setIsEditing(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    onMove(id, {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);

  return (
    <Card
      className={`absolute w-48 h-32 p-2 cursor-move border-2 shadow-md transform rotate-1 hover:rotate-0 transition-transform ${colorClasses[color]}`}
      style={{
        left: position.x,
        top: position.y,
        zIndex: 1000,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(id)}
          className="h-6 w-6 p-0 hover:bg-red-200"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            className="h-16 text-sm resize-none bg-transparent border-none p-0 focus:ring-0"
            placeholder="Enter your note..."
            autoFocus
          />
          <div className="flex gap-1">
            <Button size="sm" onClick={handleSave} className="h-6 text-xs">
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="h-6 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="h-20 text-sm overflow-hidden cursor-text"
          onClick={() => setIsEditing(true)}
        >
          {text || "Click to edit..."}
        </div>
      )}
    </Card>
  );
};