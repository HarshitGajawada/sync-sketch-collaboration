import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Users, Calendar, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const Dashboard = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [newBoard, setNewBoard] = useState({ title: '', description: '' });
  const [shareCode, setShareCode] = useState('');
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBoards();
  }, []);

  // Refresh boards when component becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchBoards();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const fetchBoards = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/boards', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBoards(data);
      } else {
        toast.error('Failed to fetch boards');
      }
    } catch (error) {
      console.error('Error fetching boards:', error);
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const createBoard = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:8000/api/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newBoard)
      });

      if (response.ok) {
        const board = await response.json();
        setBoards(prev => [board, ...prev]);
        setCreateDialogOpen(false);
        setNewBoard({ title: '', description: '' });
        toast.success('Board created successfully!');
        navigate(`/board/${board._id}`);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to create board');
      }
    } catch (error) {
      console.error('Error creating board:', error);
      toast.error('Network error');
    }
  };

  const joinBoard = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`http://localhost:8000/api/boards/join/${shareCode}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const board = await response.json();
        setBoards(prev => [board, ...prev]);
        setJoinDialogOpen(false);
        setShareCode('');
        toast.success('Joined board successfully!');
        navigate(`/board/${board._id}`);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to join board');
      }
    } catch (error) {
      console.error('Error joining board:', error);
      toast.error('Network error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-canvas-bg to-muted">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Collaborative Whiteboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.username}!</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Board
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Board</DialogTitle>
                <DialogDescription>
                  Create a new collaborative whiteboard for your team.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={createBoard} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Board Title</Label>
                  <Input
                    id="title"
                    value={newBoard.title}
                    onChange={(e) => setNewBoard(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter board title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={newBoard.description}
                    onChange={(e) => setNewBoard(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter board description"
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full">Create Board</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Join Board
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join Board</DialogTitle>
                <DialogDescription>
                  Enter a share code to join an existing board.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={joinBoard} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shareCode">Share Code</Label>
                  <Input
                    id="shareCode"
                    value={shareCode}
                    onChange={(e) => setShareCode(e.target.value)}
                    placeholder="Enter share code"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Join Board</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Boards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => (
            <Card 
              key={board._id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/board/${board._id}`)}
            >
              <CardHeader>
                <CardTitle className="truncate">{board.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {board.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {board.members?.length || 0} members
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(board.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Share code: <code className="bg-muted px-1 rounded">{board.shareCode}</code>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {boards.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No boards yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first board or join an existing one to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;