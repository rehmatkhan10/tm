import { useState } from "react";
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger 
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, Clock, Paperclip, FileText, History } from "lucide-react";
import { 
  useTask, useComments, useAddComment, useHistory, useUpdateTask, 
  useAttachments, useUploadAttachment 
} from "../hooks/use-task-details";
import { SubtaskList } from "./subtask-list";
import { toast } from "sonner";

export function TaskSheet({ taskId, children }: { taskId: string, children: React.ReactNode }) {
  const { data: task, isLoading } = useTask(taskId);
  const updateTask = useUpdateTask();
  
  // Local state for Timer input
  const [timeLimit, setTimeLimit] = useState<string>("");

  const handleUpdateTimer = async () => {
    if (!timeLimit) return;
    await updateTask.mutateAsync({ taskId, timeLimit: parseInt(timeLimit) });
    toast.success("Time limit updated");
    setTimeLimit("");
  };

  if (!taskId) return <>{children}</>;

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center justify-between">
            <span className="truncate pr-4">{task?.title || "Loading..."}</span>
            {task?.status && (
              <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                {task.status.replace('_', ' ')}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {task?.description || "No description provided."}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
        ) : (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
               <TabsTrigger value="subtasks">Subtasks</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* --- DETAILS TAB (Timer & Attachments) --- */}
            <TabsContent value="details" className="space-y-4 py-4">
             
               {/* Priority Section */}
               <div className="space-y-2">
                 <h3 className="text-sm font-medium">Priority</h3>
                 <Select defaultValue={task?.priority || "medium"} onValueChange={(value) => {
                   updateTask.mutate({ taskId, priority: value as "low" | "medium" | "high" });
                 }}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="low">Low</SelectItem>
                     <SelectItem value="medium">Medium</SelectItem>
                     <SelectItem value="high">High</SelectItem>
                   </SelectContent>
                 </Select>
               </div>

               <Separator />
              
              {/* Timer Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Time Limit
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-secondary/50 p-2 rounded-md text-sm">
                    {task?.timeLimit ? `${task.timeLimit} minutes allocated` : "No time limit set"}
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      placeholder="Mins" 
                      className="w-20" 
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(e.target.value)}
                    />
                    <Button variant="outline" size="sm" onClick={handleUpdateTimer}>Set</Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Attachments Section */}
              <AttachmentsSection taskId={taskId} />
            </TabsContent>

            {/* --- SUBTASKS TAB --- */}
            <TabsContent value="subtasks" className="space-y-4 py-4">
              <SubtaskList taskId={taskId} />
            </TabsContent>

            {/* --- COMMENTS TAB --- */}
            <TabsContent value="comments" className="h-[500px] flex flex-col">
              <CommentsSection taskId={taskId} />
            </TabsContent>

            {/* --- HISTORY TAB --- */}
            <TabsContent value="history">
              <HistorySection taskId={taskId} />
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}

// --- SUB-COMPONENTS ---

function CommentsSection({ taskId }: { taskId: string }) {
  const { data: comments, isLoading } = useComments(taskId);
  const addComment = useAddComment();
  const [text, setText] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await addComment.mutateAsync({ taskId, content: text });
    setText("");
  };

  if (isLoading) return <Loader2 className="animate-spin mx-auto mt-4" />;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 p-2 bg-secondary/30 rounded-md">
        {comments?.length === 0 && (
          <p className="text-muted-foreground text-sm text-center mt-10">No comments yet.</p>
        )}
        {comments?.map((c) => (
          <div key={c.id} className="flex gap-3 items-start p-2 rounded-lg hover:bg-secondary/50 transition">
            <Avatar className="h-9 w-9 border shadow">
              <AvatarImage src={c.user.image || undefined} />
              <AvatarFallback>{c.user.name ? c.user.name.substring(0, 2).toUpperCase() : "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base">{c.user.name}</span>
                <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-foreground mt-1 whitespace-pre-line">{c.content}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2 items-end bg-secondary/20 p-2 rounded-lg">
        <Textarea 
          placeholder="Write a comment..." 
          className="min-h-[40px] max-h-[80px] flex-1 resize-none border focus:ring-2 focus:ring-primary/40" 
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button type="submit" size="icon" disabled={addComment.isPending} variant="default" className="shadow">
          {addComment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}

function AttachmentsSection({ taskId }: { taskId: string }) {
  const { data: attachments } = useAttachments(taskId);
  const uploadAttachment = useUploadAttachment();
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
 try {
      setUploading(true);
      await uploadAttachment.mutateAsync({ taskId, file });
      toast.success('File uploaded');
    } catch (err) { // <--- Renamed and removed spaces
      console.error(err); // <--- Now it is "used", so the error goes away
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }

  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
        <Paperclip className="h-4 w-4" /> Attachments
      </h3>
      <div className="grid gap-2">
        {attachments?.length === 0 && (
          <p className="text-muted-foreground text-sm text-center">No attachments yet.</p>
        )}
        {attachments?.map((file) => (
          <div key={file.id} className="flex items-center justify-between p-2 border rounded-lg bg-secondary/30 hover:bg-secondary/50 transition">
            <div className="flex items-center gap-3 overflow-hidden">
              <FileText className="h-5 w-5 shrink-0 text-blue-500" />
              <div className="flex flex-col gap-1">
                {file.fileType.startsWith('image/') ? (
                  <img src={file.fileUrl} alt={file.fileName} className="h-14 w-24 object-cover rounded shadow" />
                ) : file.fileType === 'application/pdf' ? (
                  <iframe src={file.fileUrl} className="h-24 w-40 rounded shadow" title={file.fileName} />
                ) : (
                  <a href={file.fileUrl} target="_blank" rel="noreferrer" className="text-sm truncate hover:underline text-blue-600 font-medium">{file.fileName}</a>
                )}
                <span className="text-xs text-muted-foreground">{file.fileName}</span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground font-mono">{file.fileType}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-2 p-2 bg-secondary/20 rounded-lg mt-2">
        <label className="text-xs font-medium text-muted-foreground mb-1" htmlFor="file-upload">Upload a file from your device</label>
        <input id="file-upload" type="file" onChange={handleFileChange} className="text-sm" />
        {uploading && <div className="text-xs text-blue-600 font-semibold">Uploading...</div>}
      </div>
    </div>
  );
}

function HistorySection({ taskId }: { taskId: string }) {
  const { data: history, isLoading } = useHistory(taskId);

  if (isLoading) return <Loader2 className="animate-spin mx-auto mt-4" />;

  return (
    <div className="space-y-4 py-4">
      {history?.map((item) => (
        <div key={item.id} className="flex gap-3 text-sm">
          <History className="h-4 w-4 mt-1 text-muted-foreground" />
          <div>
            <p>
              <span className="font-semibold">{item.changedBy.name}</span>
              <span className="text-muted-foreground"> performed action: </span>
              <span className="font-medium capitalize">{item.changeType}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(item.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
      {history?.length === 0 && <p className="text-sm text-muted-foreground">No history recorded yet.</p>}
    </div>
  );
}