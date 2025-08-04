import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

export const BoardMembers = ({ users = [] }) => {
  const getInitials = (username) => {
    return username ? username.substring(0, 2).toUpperCase() : "??";
  };

  const getRandomColor = (username) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500", 
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-orange-500"
    ];
    
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Users className="h-4 w-4 text-muted-foreground" />
        <Badge variant="secondary" className="text-xs">
          {users.length} online
        </Badge>
      </div>
      
      <div className="flex -space-x-2">
        {users.slice(0, 5).map((user) => (
          <Avatar key={user.userId} className="h-8 w-8 border-2 border-background">
            <AvatarFallback className={`text-white text-xs ${getRandomColor(user.username)}`}>
              {getInitials(user.username)}
            </AvatarFallback>
          </Avatar>
        ))}
        
        {users.length > 5 && (
          <Avatar className="h-8 w-8 border-2 border-background">
            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
              +{users.length - 5}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
};