import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Users, UserPlus, Mail } from "lucide-react";

interface BoardMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

interface BoardMembersProps {
  boardId: string | null;
}

export const BoardMembers = ({ boardId }: BoardMembersProps) => {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (boardId) {
      fetchMembers();
      subscribeToMembers();
    }
  }, [boardId]);

  const fetchMembers = async () => {
    if (!boardId) return;

    try {
      const { data, error } = await supabase
        .from('board_members')
        .select('*')
        .eq('board_id', boardId)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const subscribeToMembers = () => {
    if (!boardId) return;

    const channel = supabase
      .channel('board-members-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'board_members',
          filter: `board_id=eq.${boardId}`
        },
        () => {
          fetchMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim() || !boardId) return;

    setLoading(true);
    try {
      // For now, we'll just copy the invite link
      // In a real app, you'd send an email invitation
      const inviteUrl = `${window.location.origin}?board=${boardId}&invite=true`;
      await navigator.clipboard.writeText(inviteUrl);
      
      toast.success("Invite link copied to clipboard! Share it with your collaborator.");
      setInviteEmail("");
      setIsInviteOpen(false);
    } catch (error) {
      console.error('Error creating invite:', error);
      toast.error("Failed to create invite");
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-primary text-primary-foreground';
      case 'editor':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!boardId) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Member Avatars */}
      <div className="flex -space-x-2">
        {members.slice(0, 3).map((member) => (
          <Avatar key={member.id} className="w-8 h-8 border-2 border-background">
            <AvatarImage src={undefined} />
            <AvatarFallback className="text-xs">
              {getInitials(`User ${member.user_id.slice(0, 8)}`)}
            </AvatarFallback>
          </Avatar>
        ))}
        {members.length > 3 && (
          <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
            +{members.length - 3}
          </div>
        )}
      </div>

      {/* Members Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Users className="h-4 w-4" />
            {members.length}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Board Members ({members.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={undefined} />
                    <AvatarFallback>
                      {getInitials(`User ${member.user_id.slice(0, 8)}`)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      User {member.user_id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge className={getRoleColor(member.role)}>
                  {member.role}
                </Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Button */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Collaborator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                Cancel
              </Button>
              <Button onClick={inviteMember} disabled={loading}>
                {loading ? "Creating..." : "Copy Invite Link"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};