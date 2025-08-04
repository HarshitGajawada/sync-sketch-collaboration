import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { 
  MousePointer, 
  Pencil, 
  Square, 
  Circle, 
  Type, 
  Undo, 
  Redo, 
  Trash2,
  StickyNote,
  Image as ImageIcon
} from "lucide-react";

const colors = [
  "#000000", "#ff0000", "#00ff00", "#0000ff", 
  "#ffff00", "#ff00ff", "#00ffff", "#ffa500",
  "#800080", "#008000", "#ff1493", "#4169e1"
];

export const Toolbar = ({
  activeTool,
  onToolChange,
  activeColor,
  onColorChange,
  brushSize,
  onBrushSizeChange,
  fabricCanvas,
  onAddStickyNote
}) => {
  const handleUndo = () => {
    if (!fabricCanvas) return;
    // Simple undo implementation - in a real app you'd want a proper history system
    const objects = fabricCanvas.getObjects();
    if (objects.length > 0) {
      fabricCanvas.remove(objects[objects.length - 1]);
      fabricCanvas.renderAll();
    }
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "hsl(var(--canvas-bg))";
    fabricCanvas.renderAll();
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file || !fabricCanvas) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imgUrl = e.target?.result;
      const img = new Image();
      img.onload = () => {
        import('fabric').then(({ FabricImage }) => {
          const fabricImg = new FabricImage(img, {
            left: 100,
            top: 100,
            scaleX: 0.5,
            scaleY: 0.5,
          });
          fabricCanvas.add(fabricImg);
          fabricCanvas.renderAll();
        });
      };
      img.src = imgUrl;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-toolbar-bg border-r border-border p-4 w-80 shadow-[var(--shadow-tool)]">
      <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        Collaborative Whiteboard
      </h2>
      
      {/* Tools Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Tools</h3>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={activeTool === "select" ? "default" : "outline"}
            size="sm"
            onClick={() => onToolChange("select")}
            className="flex flex-col gap-1 h-12"
          >
            <MousePointer className="h-4 w-4" />
            <span className="text-xs">Select</span>
          </Button>
          <Button
            variant={activeTool === "draw" ? "default" : "outline"}
            size="sm"
            onClick={() => onToolChange("draw")}
            className="flex flex-col gap-1 h-12"
          >
            <Pencil className="h-4 w-4" />
            <span className="text-xs">Draw</span>
          </Button>
          <Button
            variant={activeTool === "rectangle" ? "default" : "outline"}
            size="sm"
            onClick={() => onToolChange("rectangle")}
            className="flex flex-col gap-1 h-12"
          >
            <Square className="h-4 w-4" />
            <span className="text-xs">Rectangle</span>
          </Button>
          <Button
            variant={activeTool === "circle" ? "default" : "outline"}
            size="sm"
            onClick={() => onToolChange("circle")}
            className="flex flex-col gap-1 h-12"
          >
            <Circle className="h-4 w-4" />
            <span className="text-xs">Circle</span>
          </Button>
          <Button
            variant={activeTool === "text" ? "default" : "outline"}
            size="sm"
            onClick={() => onToolChange("text")}
            className="flex flex-col gap-1 h-12"
          >
            <Type className="h-4 w-4" />
            <span className="text-xs">Text</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddStickyNote}
            className="flex flex-col gap-1 h-12"
          >
            <StickyNote className="h-4 w-4" />
            <span className="text-xs">Note</span>
          </Button>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Actions Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Actions</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleUndo}>
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleClear}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline" size="sm">
              <ImageIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Color Palette */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Colors</h3>
        <div className="grid grid-cols-4 gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                activeColor === color 
                  ? "border-primary ring-2 ring-primary/20 scale-110" 
                  : "border-gray-300 hover:scale-105"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Brush Size */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
          Brush Size: {brushSize}px
        </h3>
        <Slider
          value={[brushSize]}
          onValueChange={(value) => onBrushSizeChange(value[0])}
          max={50}
          min={1}
          step={1}
          className="w-full"
        />
      </div>
    </div>
  );
};