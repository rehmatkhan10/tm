import * as React from "react"
import { ChevronsUpDown, Plus, User, Users, Settings } from "lucide-react"
import { useNavigate, useSearch } from "@tanstack/react-router"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTeams, useCreateTeam } from "../hooks/use-teams"
import { MembersDialog } from "./members-dialog" // <--- Import the new dialog

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const navigate = useNavigate()
  const { data: teams } = useTeams()
  const createTeam = useCreateTeam()
  
  // State for "Create Team" dialog
  const [open, setOpen] = React.useState(false)
  const [newTeamName, setNewTeamName] = React.useState("")

  // State for "Manage Members" dialog
  const [showMembersDialog, setShowMembersDialog] = React.useState(false)
  
  // Get current teamId from URL
  const search = useSearch({ strict: false }) as { teamId?: string };
  const activeTeamId = search.teamId;

  const activeTeam = teams?.find(t => t.id === activeTeamId)

  const handleSwitch = (teamId?: string) => {
    navigate({
      to: "/dashboard",
      search: teamId ? { teamId } : {}, 
    })
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTeamName) return
    
    await createTeam.mutateAsync(newTeamName)
    setNewTeamName("")
    setOpen(false)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {activeTeam ? <Users className="size-4" /> : <User className="size-4" />}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeTeam ? activeTeam.name : "Personal Tasks"}
                </span>
                <span className="truncate text-xs">
                    {activeTeam ? "Team Workspace" : "Private Workspace"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Personal
            </DropdownMenuLabel>
            
            <DropdownMenuItem 
                onClick={() => handleSwitch(undefined)} 
                className="gap-2 p-2"
            >
              <div className="flex size-6 items-center justify-center rounded-sm border">
                <User className="size-4 shrink-0" />
              </div>
              Personal Tasks
              {!activeTeam && <DropdownMenuShortcut>✓</DropdownMenuShortcut>}
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Teams
            </DropdownMenuLabel>
            
            {teams?.map((team) => (
              <DropdownMenuItem
                key={team.id}
                onClick={() => handleSwitch(team.id)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border bg-indigo-500 text-white">
                  {team.name.substring(0, 1).toUpperCase()}
                </div>
                {team.name}
                {activeTeamId === team.id && <DropdownMenuShortcut>✓</DropdownMenuShortcut>}
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />

            {/* MANAGE MEMBERS BUTTON (Only shows if a team is selected) */}
            {activeTeamId && (
               <>
                 <DropdownMenuItem 
                    className="gap-2 p-2"
                    onSelect={(e) => {
                       e.preventDefault();
                       setShowMembersDialog(true);
                    }}
                 >
                   <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                     <Settings className="size-4" />
                   </div>
                   <div className="font-medium text-muted-foreground">Manage Members</div>
                 </DropdownMenuItem>
                 <DropdownMenuSeparator />
               </>
            )}
            
            {/* CREATE TEAM BUTTON */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <DropdownMenuItem 
                        className="gap-2 p-2" 
                        onSelect={(e) => e.preventDefault()}
                    >
                        <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                            <Plus className="size-4" />
                        </div>
                        <div className="font-medium text-muted-foreground">Create Team</div>
                    </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Team</DialogTitle>
                        <DialogDescription>
                            Add a new team to manage tasks together.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateTeam} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Team Name</Label>
                            <Input 
                                id="name" 
                                value={newTeamName}
                                onChange={(e) => setNewTeamName(e.target.value)}
                                placeholder="Acme Inc." 
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={createTeam.isPending}>
                                {createTeam.isPending ? "Creating..." : "Create Team"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      {/* RENDER THE MEMBERS DIALOG HERE */}
      {activeTeamId && (
        <MembersDialog 
           teamId={activeTeamId} 
           open={showMembersDialog} 
           onOpenChange={setShowMembersDialog} 
        />
      )}
    </SidebarMenu>
  )
}