import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, FolderOpen, Users, Share, Copy } from "lucide-react";

interface Board {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface BoardSelectorProps {
  currentBoardId: string | null;
  onBoardChange: (boardId: string) => void;
}

export const BoardSelector = ({ currentBoardId, onBoardChange }: BoardSelectorProps) => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBoardsOpen, setIsBoardsOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);

  useEffect(() => {
    fetchBoards();
  }, []);

  useEffect(() => {
    if (currentBoardId) {
      const board = boards.find(b => b.id === currentBoardId);
      setCurrentBoard(board || null);
    }
  }, [currentBoardId, boards]);

  const fetchBoards = async () => {
    try {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setBoards(data || []);
    } catch (error) {
      console.error('Error fetching boards:', error);
      toast.error("Failed to load boards");
    }
  };

  const createBoard = async () => {
    if (!newBoardName.trim()) {
      toast.error("Board name is required");
      return;
    }

    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        toast.error("Please log in to create a board");
        return;
      }

      const { data, error } = await supabase
        .from('boards')
        .insert({
          name: newBoardName.trim(),
          description: newBoardDescription.trim(),
          created_by: userData.user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add the creator as the owner
      await supabase
        .from('board_members')
        .insert({
          board_id: data.id,
          user_id: userData.user.id,
          role: 'owner'
        });

      toast.success("Board created successfully!");
      setNewBoardName("");
      setNewBoardDescription("");
      setIsCreateOpen(false);
      fetchBoards();
      onBoardChange(data.id);
    } catch (error) {
      console.error('Error creating board:', error);
      toast.error("Failed to create board");
    } finally {
      setLoading(false);
    }
  };

  const selectBoard = (boardId: string) => {
    onBoardChange(boardId);
    setIsBoardsOpen(false);
  };

  const shareBoard = async () => {
    if (!currentBoardId) return;
    
    const shareUrl = `${window.location.origin}?board=${currentBoardId}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Board link copied to clipboard!");
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="flex items-center gap-2 p-4 bg-card border-b border-border">
      <Dialog open={isBoardsOpen} onOpenChange={setIsBoardsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            {currentBoard ? currentBoard.name : "Select Board"}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select or Create Board</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 max-h-96 overflow-y-auto">
            {boards.map((board) => (
              <div
                key={board.id}
                className={`p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                  currentBoardId === board.id ? 'border-primary bg-accent' : 'border-border'
                }`}
                onClick={() => selectBoard(board.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{board.name}</h3>
                    {board.description && (
                      <p className="text-sm text-muted-foreground mt-1">{board.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Updated {new Date(board.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  {currentBoardId === board.id && (
                    <Badge variant="secondary">Current</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Board
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Board Name</label>
              <Input
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Enter board name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (Optional)</label>
              <Textarea
                value={newBoardDescription}
                onChange={(e) => setNewBoardDescription(e.target.value)}
                placeholder="Describe your board"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createBoard} disabled={loading}>
                {loading ? "Creating..." : "Create Board"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {currentBoard && (
        <Button variant="ghost" size="sm" onClick={shareBoard} className="gap-2">
          <Share className="h-4 w-4" />
          Share
        </Button>
      )}
    </div>
  );
};