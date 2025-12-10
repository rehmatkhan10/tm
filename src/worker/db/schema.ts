import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// --- EXISTING AUTH TABLES (Keep these as is) ---
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// --- TEAM TABLES ---
export const team = sqliteTable("team", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const member = sqliteTable("member", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => team.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["owner", "admin", "member"] }).notNull().default("member"),
  joinedAt: integer("joined_at", { mode: "timestamp" }).notNull(),
});

export const invitation = sqliteTable("invitation", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => team.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role", { enum: ["admin", "member"] }).notNull().default("member"),
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).notNull().default("pending"),
  invitedBy: text("invited_by").notNull().references(() => user.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// --- TASK TABLES ---

export const taskStatusEnum = ["todo", "in_progress", "completed"] as const;
export type TaskStatus = (typeof taskStatusEnum)[number];

export const taskPriorityEnum = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof taskPriorityEnum)[number];

export const task = sqliteTable("task", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: taskStatusEnum }).notNull().default("todo"),
  priority: text("priority", { enum: taskPriorityEnum }).notNull().default("medium"), // NEW: Task priority
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  teamId: text("team_id").references(() => team.id, { onDelete: "cascade" }),
  assigneeId: text("assignee_id").references(() => user.id, { onDelete: "set null" }),
  
  // NEW: Timer Fields
  timeLimit: integer("time_limit"), // In minutes (e.g. 60 mins allowed)
  dueDate: integer("due_date", { mode: "timestamp" }), // Deadline

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// 4. Subtasks
export const subtask = sqliteTable("subtask", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => task.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  order: integer("order").notNull().default(0), // For drag-and-drop reordering
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// --- NEW FEATURES ---

// 1. Comments
export const comment = sqliteTable("comment", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => task.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// 2. Attachments (with file size support)
export const attachment = sqliteTable("attachment", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => task.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(), // Link to R2 or storage
  fileType: text("file_type").notNull(), // e.g., "application/pdf"
  fileSize: integer("file_size"), // NEW: File size in bytes
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// 3. Task Version History (Snapshot of changes)
export const taskVersion = sqliteTable("task_version", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => task.id, { onDelete: "cascade" }),
  changedBy: text("changed_by").notNull().references(() => user.id),
  
  // We store what changed as a JSON string or specific fields
  changeType: text("change_type").notNull(), // "status_update", "edit", "comment"
  previousData: text("previous_data"), // JSON string of old state
  newData: text("new_data"), // JSON string of new state

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});