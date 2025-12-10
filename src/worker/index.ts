import { zValidator } from "@hono/zod-validator";
// FIX: Unified import with 'sql' and 'desc' included
import { and, eq, isNull, ne, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { z } from "zod";
import { member, task, taskStatusEnum, taskPriorityEnum, team, invitation, user as userTable, comment, attachment, taskVersion, subtask } from "./db/schema";
import { getAuth } from "./lib/auth";
import { getAuthUser } from "./lib/get-auth-user";

interface Env {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  ATTACHMENTS_BUCKET?: R2Bucket;
}

// --- VALIDATION SCHEMAS ---

const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
});

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(taskStatusEnum).optional().default("todo"),
 priority: z.enum(taskPriorityEnum).optional().default("medium"),
  teamId: z.string().optional(),
  assigneeId: z.string().optional(),
  timeLimit: z.number().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(taskStatusEnum).optional(),
 priority: z.enum(taskPriorityEnum).optional(),
  assigneeId: z.string().optional(),
  timeLimit: z.number().optional(),
});

const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

const createAttachmentSchema = z.object({
  fileName: z.string(),
  fileUrl: z.string().url(),
  fileType: z.string(),
 fileSize: z.number().optional(),
});

const createSubtaskSchema = z.object({
  title: z.string().min(1, "Subtask title is required"),
});

const updateSubtaskSchema = z.object({
  title: z.string().min(1).optional(),
  completed: z.boolean().optional(),
  order: z.number().optional(),
});

const app = new Hono<{ Bindings: Env }>();

// --- CORS MIDDLEWARE ---
app.use("*", async (c, next) => {
  const origin = c.req.header("origin") || "*";
  c.header("Access-Control-Allow-Origin", origin);
  c.header("Access-Control-Allow-Credentials", "true");
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
  c.header("Access-Control-Max-Age", "86400");
  
  if (c.req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }
  
  await next();
});

// --- AUTH ROUTES ---
app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  const auth = getAuth(c.env);
  return auth.handler(c.req.raw);
});

app.get("/api/me", async (c) => {
  const auth = getAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);
  return c.json({ user: session.user });
});

// --- TEAM ROUTES ---
app.post("/api/teams", zValidator("json", createTeamSchema), async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const { name } = c.req.valid("json");
  const db = drizzle(c.env.DB);
  const teamId = crypto.randomUUID();
  const now = new Date();
  await db.insert(team).values({ id: teamId, name, createdAt: now, updatedAt: now });
  await db.insert(member).values({ id: crypto.randomUUID(), teamId, userId: user.id, role: "owner", joinedAt: now });
  return c.json({ teamId, name }, 201);
});

app.get("/api/teams", async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  const userTeams = await db.select({ id: team.id, name: team.name, role: member.role }).from(member).innerJoin(team, eq(member.teamId, team.id)).where(eq(member.userId, user.id));
  return c.json({ teams: userTeams });
});

app.get("/api/teams/:teamId/members", async (c) => {
  const currentUser = await getAuthUser(c);
  if (!currentUser) return c.json({ error: "Unauthorized" }, 401);
  const teamId = c.req.param("teamId");
  const db = drizzle(c.env.DB);
  const membership = await db.select().from(member).where(and(eq(member.teamId, teamId), eq(member.userId, currentUser.id))).get();
  if (!membership) return c.json({ error: "Forbidden" }, 403);
  const members = await db.select({ id: userTable.id, name: userTable.name, email: userTable.email, image: userTable.image, role: member.role, joinedAt: member.joinedAt }).from(member).innerJoin(userTable, eq(member.userId, userTable.id)).where(eq(member.teamId, teamId));
  return c.json({ members });
});

app.post("/api/teams/:teamId/invite", zValidator("json", z.object({ email: z.string().email() })), async (c) => {
  const currentUser = await getAuthUser(c);
  if (!currentUser) return c.json({ error: "Unauthorized" }, 401);
  const teamId = c.req.param("teamId");
  const { email } = c.req.valid("json");
  const db = drizzle(c.env.DB);
  const membership = await db.select().from(member).where(and(eq(member.teamId, teamId), eq(member.userId, currentUser.id))).get();
  if (!membership || membership.role === "member") return c.json({ error: "Only admins can invite users" }, 403);
  const existingMember = await db.select().from(member).innerJoin(userTable, eq(member.userId, userTable.id)).where(and(eq(member.teamId, teamId), eq(userTable.email, email))).get();
  if (existingMember) return c.json({ error: "User is already in the team" }, 400);

  const inviteId = crypto.randomUUID();
  await db.insert(invitation).values({ id: inviteId, teamId, email, role: "member", status: "pending", invitedBy: currentUser.id, createdAt: new Date() });
  
  const targetUser = await db.select().from(userTable).where(eq(userTable.email, email)).get();
  if (targetUser) {
     await db.insert(member).values({ id: crypto.randomUUID(), teamId, userId: targetUser.id, role: "member", joinedAt: new Date() });
     await db.update(invitation).set({ status: 'accepted' }).where(eq(invitation.id, inviteId));
     return c.json({ message: "User added!" });
  }
  return c.json({ message: "Invitation created" });
});

app.get("/api/users", async (c) => {
  const currentUser = await getAuthUser(c);
  if (!currentUser) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  const allUsers = await db.select({ id: userTable.id, name: userTable.name, email: userTable.email, image: userTable.image }).from(userTable).where(ne(userTable.id, currentUser.id));
  return c.json({ users: allUsers });
});

// --- TASK ROUTES ---

app.get("/api/tasks", async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  const teamId = c.req.query("teamId");

  if (teamId) {
    const isMember = await db.select().from(member).where(and(eq(member.teamId, teamId), eq(member.userId, user.id))).get();
    if (!isMember) return c.json({ error: "Forbidden" }, 403);
    const tasks = await db.select().from(task).where(eq(task.teamId, teamId));
    // Ensure all tasks have a priority (default to 'medium' if missing)
    const tasksWithDefaults = tasks.map(t => ({ ...t, priority: t.priority || 'medium' }));
    return c.json({ tasks: tasksWithDefaults });
  }
  const tasks = await db.select().from(task).where(and(eq(task.userId, user.id), isNull(task.teamId)));
  // Ensure all tasks have a priority (default to 'medium' if missing)
  const tasksWithDefaults = tasks.map(t => ({ ...t, priority: t.priority || 'medium' }));
  return c.json({ tasks: tasksWithDefaults });
});

app.get("/api/tasks/:id", async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const taskId = c.req.param("id");
  const db = drizzle(c.env.DB);
  const [foundTask] = await db.select().from(task).where(eq(task.id, taskId));
  if (!foundTask) return c.json({ error: "Task not found" }, 404);
  // Ensure priority has a default value
  return c.json({ task: { ...foundTask, priority: foundTask.priority || 'medium' } });
});

app.post("/api/tasks", zValidator("json", createTaskSchema), async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const body = c.req.valid("json");
  const db = drizzle(c.env.DB);
  const now = new Date();

  if (body.teamId) {
    const isMember = await db.select().from(member).where(and(eq(member.teamId, body.teamId), eq(member.userId, user.id))).get();
    if (!isMember) return c.json({ error: "Forbidden" }, 403);
  }

  const newTask = {
    id: crypto.randomUUID(),
    title: body.title,
    description: body.description ?? null,
    status: body.status,
     priority: body.priority,
    userId: user.id,
    teamId: body.teamId ?? null,
    assigneeId: body.assigneeId ?? null,
    timeLimit: body.timeLimit ?? null,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(task).values(newTask);
  return c.json({ task: newTask }, 201);
});

app.patch("/api/tasks/:id", zValidator("json", updateTaskSchema), async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const taskId = c.req.param("id");
  const db = drizzle(c.env.DB);

  const [existingTask] = await db.select().from(task).where(eq(task.id, taskId));
  if (!existingTask) return c.json({ error: "Task not found" }, 404);

  const body = c.req.valid("json");
  const now = new Date();

  // History
  await db.insert(taskVersion).values({
    id: crypto.randomUUID(),
    taskId: taskId,
    changedBy: user.id,
    changeType: "update",
    previousData: JSON.stringify(existingTask),
    newData: JSON.stringify({ ...existingTask, ...body }),
    createdAt: now
  });

  const updateData: Partial<typeof existingTask> = { updatedAt: now };
  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.status !== undefined) updateData.status = body.status;
   if (body.priority !== undefined) updateData.priority = body.priority;
  if (body.assigneeId !== undefined) updateData.assigneeId = body.assigneeId;
  if (body.timeLimit !== undefined) updateData.timeLimit = body.timeLimit;

  await db.update(task).set(updateData).where(eq(task.id, taskId));
  const [updatedTask] = await db.select().from(task).where(eq(task.id, taskId));
  return c.json({ task: updatedTask });
});

app.delete("/api/tasks/:id", async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const taskId = c.req.param("id");
  const db = drizzle(c.env.DB);
  await db.delete(task).where(eq(task.id, taskId));
  return c.json({ message: "Task deleted successfully" });
});

// --- COMMENTS & ATTACHMENTS & HISTORY & STATS ---

// 1. Comments
app.get("/api/tasks/:id/comments", async (c) => {
  const taskId = c.req.param("id");
  const db = drizzle(c.env.DB);
  const comments = await db.select({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      user: { id: userTable.id, name: userTable.name, image: userTable.image }
  }).from(comment).innerJoin(userTable, eq(comment.userId, userTable.id)).where(eq(comment.taskId, taskId)).orderBy(desc(comment.createdAt));
  return c.json({ comments });
});

app.post("/api/tasks/:id/comments", zValidator("json", createCommentSchema), async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const taskId = c.req.param("id");
  const { content } = c.req.valid("json");
  const db = drizzle(c.env.DB);
  const now = new Date();
  const newComment = { id: crypto.randomUUID(), taskId, userId: user.id, content, createdAt: now };
  await db.insert(comment).values(newComment);
  await db.insert(taskVersion).values({ id: crypto.randomUUID(), taskId, changedBy: user.id, changeType: "comment", previousData: null, newData: JSON.stringify({ content }), createdAt: now });
  return c.json({ comment: newComment }, 201);
});

// 2. Attachments
app.get("/api/tasks/:id/attachments", async (c) => {
    const taskId = c.req.param("id");
    const db = drizzle(c.env.DB);
    const attachments = await db.select().from(attachment).where(eq(attachment.taskId, taskId));
    return c.json({ attachments });
});

app.post("/api/tasks/:id/attachments", zValidator("json", createAttachmentSchema), async (c) => {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const taskId = c.req.param("id");
    const body = c.req.valid("json");
    const db = drizzle(c.env.DB);
    await db.insert(attachment).values({ id: crypto.randomUUID(), taskId, userId: user.id, fileName: body.fileName, fileUrl: body.fileUrl, fileType: body.fileType, fileSize: body.fileSize ?? null, createdAt: new Date() });
    return c.json({ success: true });
});

// Multipart upload endpoint - store attachments in R2 and return a worker-served URL
app.post('/api/tasks/:id/attachments/upload', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const taskId = c.req.param('id');
  const req = c.req.raw;
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return c.json({ error: 'Expected multipart/form-data' }, 400);
  }

  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return c.json({ error: 'No file provided' }, 400);

  const fileName = file.name || 'attachment';
  const fileType = file.type || 'application/octet-stream';
  const arrayBuffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);

  // Use R2 binding named ATTACHMENTS_BUCKET
  const key = `${taskId}/${crypto.randomUUID()}_${encodeURIComponent(fileName)}`;
  try {
    if (c.env.ATTACHMENTS_BUCKET) {
      await c.env.ATTACHMENTS_BUCKET.put(key, uint8, {
        httpMetadata: { contentType: fileType },
      });
      const fileUrl = `/r2/${encodeURIComponent(key)}`;
      const db = drizzle(c.env.DB);
      await db.insert(attachment).values({ id: crypto.randomUUID(), taskId, userId: user.id, fileName, fileUrl, fileType, fileSize: uint8.length, createdAt: new Date() });
      return c.json({ success: true, fileUrl });
    } else {
      // Fallback: store as data URL in DB (not recommended for production)
      let binary = '';
      for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
      const base64 = globalThis.btoa(binary);
      const dataUrl = `data:${fileType};base64,${base64}`;
      const db = drizzle(c.env.DB);
      await db.insert(attachment).values({ id: crypto.randomUUID(), taskId, userId: user.id, fileName, fileUrl: dataUrl, fileType, fileSize: uint8.length, createdAt: new Date() });
      return c.json({ success: true, fileUrl: dataUrl });
    }
  } catch (err) {
    return c.json({ error: 'Upload failed', details: String(err) }, 500);
  }
});

// Serve R2 files via worker route
app.get('/r2/:key', async (c) => {
  const encodedKey = c.req.param('key');
  const key = decodeURIComponent(encodedKey);
  if (!c.env.ATTACHMENTS_BUCKET) return c.text('R2 bucket not configured', 500);
  const obj = await c.env.ATTACHMENTS_BUCKET.get(key);
  if (!obj) return c.text('Not found', 404);
  const body = obj.body;
  const contentType = obj.httpMetadata?.contentType || 'application/octet-stream';
  return new Response(body, { headers: { 'Content-Type': contentType } });
});

// --- SUBTASKS ---
app.get("/api/tasks/:id/subtasks", async (c) => {
  const taskId = c.req.param("id");
  const db = drizzle(c.env.DB);
  const subtasks = await db.select().from(subtask).where(eq(subtask.taskId, taskId)).orderBy(subtask.order);
  return c.json({ subtasks });
});

app.post("/api/tasks/:id/subtasks", zValidator("json", createSubtaskSchema), async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const taskId = c.req.param("id");
  const { title } = c.req.valid("json");
  const db = drizzle(c.env.DB);
  
  // Get max order to add at the end
  const lastSubtask = await db.select({ maxOrder: sql<number>`MAX(${subtask.order})` }).from(subtask).where(eq(subtask.taskId, taskId)).get();
  const nextOrder = (lastSubtask?.maxOrder ?? -1) + 1;
  
  const newSubtask = { id: crypto.randomUUID(), taskId, title, completed: false, order: nextOrder, createdAt: new Date() };
  await db.insert(subtask).values(newSubtask);
  return c.json({ subtask: newSubtask }, 201);
});

app.patch("/api/tasks/:taskId/subtasks/:subtaskId", zValidator("json", updateSubtaskSchema), async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const { subtaskId } = c.req.param();
  const body = c.req.valid("json");
  const db = drizzle(c.env.DB);
  
  const [existingSubtask] = await db.select().from(subtask).where(eq(subtask.id, subtaskId));
  if (!existingSubtask) return c.json({ error: "Subtask not found" }, 404);
  
  const updateData: Partial<typeof existingSubtask> = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.completed !== undefined) updateData.completed = body.completed;
  if (body.order !== undefined) updateData.order = body.order;
  
  await db.update(subtask).set(updateData).where(eq(subtask.id, subtaskId));
  const [updatedSubtask] = await db.select().from(subtask).where(eq(subtask.id, subtaskId));
  return c.json({ subtask: updatedSubtask });
});

app.delete("/api/tasks/:taskId/subtasks/:subtaskId", async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const { subtaskId } = c.req.param();
  const db = drizzle(c.env.DB);
  await db.delete(subtask).where(eq(subtask.id, subtaskId));
  return c.json({ message: "Subtask deleted successfully" });
});
// 3. History
app.get("/api/tasks/:id/history", async (c) => {
  const taskId = c.req.param("id");
  const db = drizzle(c.env.DB);
  const history = await db.select({
    id: taskVersion.id,
    changeType: taskVersion.changeType,
    changedBy: { name: userTable.name, image: userTable.image },
    createdAt: taskVersion.createdAt,
  }).from(taskVersion).innerJoin(userTable, eq(taskVersion.changedBy, userTable.id)).where(eq(taskVersion.taskId, taskId)).orderBy(desc(taskVersion.createdAt));
  return c.json({ history });
});

// 4. Stats (Task Activity Chart)
app.get("/api/stats/activity", async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);

  // Divide by 1000 because Drizzle stores dates as ms, but SQLite unixepoch expects seconds
  const activity = await db
    .select({
      date: sql<string>`date(${task.createdAt} / 1000, 'unixepoch')`,
      count: sql<number>`count(*)`
    })
    .from(task)
    .where(eq(task.userId, user.id))
    .groupBy(sql`date(${task.createdAt} / 1000, 'unixepoch')`)
    .orderBy(sql`date(${task.createdAt} / 1000, 'unixepoch')`);

  return c.json({ activity });
});

export default app;