import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Circle, Rect, FabricText, PencilBrush } from "fabric";
import { toast } from "sonner";

export interface WhiteboardCanvasProps {
  activeTool: "select" | "draw" | "rectangle" | "circle" | "text";
  activeColor: string;
  brushSize: number;
  onCanvasReady?: (canvas: FabricCanvas) => void;
}

export const WhiteboardCanvas = ({ 
  activeTool, 
  activeColor, 
  brushSize,
  onCanvasReady 
}: WhiteboardCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: window.innerWidth - 400, // Account for toolbar and chat
      height: window.innerHeight - 100,
      backgroundColor: "hsl(var(--canvas-bg))",
    });

    // Initialize the freeDrawingBrush
    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = activeColor;
    canvas.freeDrawingBrush.width = brushSize;

    setFabricCanvas(canvas);
    onCanvasReady?.(canvas);
    toast.success("Sync Sketch canvas ready!");

    // Handle window resize
    const handleResize = () => {
      canvas.setWidth(window.innerWidth - 400);
      canvas.setHeight(window.innerHeight - 100);
      canvas.renderAll();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === "draw";
    
    if (activeTool === "draw" && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = brushSize;
    }
  }, [activeTool, activeColor, brushSize, fabricCanvas]);

  const handleCanvasClick = (e: any) => {
    if (!fabricCanvas || activeTool === "select" || activeTool === "draw") return;

    const pointer = fabricCanvas.getPointer(e.e);

    if (activeTool === "rectangle") {
      const rect = new Rect({
        left: pointer.x - 50,
        top: pointer.y - 50,
        fill: activeColor,
        width: 100,
        height: 100,
        stroke: activeColor,
        strokeWidth: 2,
      });
      fabricCanvas.add(rect);
    } else if (activeTool === "circle") {
      const circle = new Circle({
        left: pointer.x - 50,
        top: pointer.y - 50,
        fill: activeColor,
        radius: 50,
        stroke: activeColor,
        strokeWidth: 2,
      });
      fabricCanvas.add(circle);
    } else if (activeTool === "text") {
      const text = new FabricText("Double click to edit", {
        left: pointer.x,
        top: pointer.y,
        fill: activeColor,
        fontSize: 20,
        fontFamily: "Inter, sans-serif",
        editable: true,
      });
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
    }
  };

  useEffect(() => {
    if (!fabricCanvas) return;

    const handleDoubleClick = (e: any) => {
      const target = e.target;
      if (target && target.type === 'text') {
        target.set({ editable: true });
        fabricCanvas.setActiveObject(target);
        fabricCanvas.renderAll();
      }
    };

    fabricCanvas.on('mouse:down', handleCanvasClick);
    fabricCanvas.on('mouse:dblclick', handleDoubleClick);

    return () => {
      fabricCanvas.off('mouse:down', handleCanvasClick);
      fabricCanvas.off('mouse:dblclick', handleDoubleClick);
    };
  }, [fabricCanvas, activeTool, activeColor]);

  return (
    <div className="flex-1 bg-canvas-bg overflow-hidden">
      <canvas 
        ref={canvasRef} 
        className="border border-border shadow-lg" 
        style={{ cursor: activeTool === "draw" ? "crosshair" : "default" }}
      />
    </div>
  );
};