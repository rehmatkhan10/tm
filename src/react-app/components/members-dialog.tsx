import { useState } from "react";
import { useMembers, useInviteMember, useAllUsers } from "../hooks/use-members";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner"; 

interface MembersDialogProps {
  teamId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MembersDialog({ teamId, open, onOpenChange }: MembersDialogProps) {
  const { data: members, isLoading } = useMembers(teamId);
  const { data: allUsers } = useAllUsers(); // <--- Get list of all users
  const inviteMember = useInviteMember();
  
  const [selectedEmail, setSelectedEmail] = useState("");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmail) return;

    try {
      await inviteMember.mutateAsync({ teamId, email: selectedEmail });
      setSelectedEmail("");
      toast.success("User added to team!");
    } catch (error) {
      console.error(error); // <--- Add this line
      toast.error("Failed to add user.");
    }
  };

  // Filter out users who are already in the team so we don't invite them twice
  const availableUsers = allUsers?.filter(
      u => !members?.some(m => m.email === u.email)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Team</DialogTitle>
          <DialogDescription>
            Select a user to add them to this team.
          </DialogDescription>
        </DialogHeader>

        {/* Dropdown Form */}
        <form onSubmit={handleInvite} className="flex gap-2 mt-2">
          <div className="flex-1">
            <Select onValueChange={setSelectedEmail} value={selectedEmail}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a user..." />
                </SelectTrigger>
                <SelectContent>
                    {availableUsers?.map((user) => (
                        <SelectItem key={user.id} value={user.email}>
                            <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={user.image} />
                                    <AvatarFallback>{user.name.substring(0,1)}</AvatarFallback>
                                </Avatar>
                                <span>{user.name}</span>
                                <span className="text-xs text-muted-foreground ml-2">({user.email})</span>
                            </div>
                        </SelectItem>
                    ))}
                    {availableUsers?.length === 0 && (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                            No new users to add.
                        </div>
                    )}
                </SelectContent>
            </Select>
          </div>
          
          <Button type="submit" disabled={!selectedEmail || inviteMember.isPending}>
            {inviteMember.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          </Button>
        </form>

        <div className="mt-6 space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-xs">Team Members</h4>
          
          {isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="animate-spin" /></div>
          ) : (
            <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-1">
              {members?.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 rounded-lg border bg-card/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.image} />
                      <AvatarFallback>{member.name.substring(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wider bg-secondary px-2 py-1 rounded">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}