import { boolean, customType, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { SignatureData } from "@/lib/signature/types";

const bytea = customType<{ data: Buffer; driverData: Buffer | Uint8Array }>({
  dataType() {
    return "bytea";
  },
  fromDriver(value) {
    return Buffer.from(value);
  },
});

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<"admin" | "member">().notNull().default("member"),
  ...timestamps,
});

export const generators = pgTable("generators", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  data: jsonb("data").$type<SignatureData>().notNull(),
  editableFields: jsonb("editable_fields").$type<string[]>().notNull(),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});

export const signatures = pgTable("signatures", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").references(() => users.id, { onDelete: "set null" }),
  generatorId: text("generator_id").references(() => generators.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: text("email").notNull().default(""),
  data: jsonb("data").$type<SignatureData>().notNull(),
  publicToken: text("public_token").notNull().unique(),
  legacyId: integer("legacy_id"),
  gmailSyncedAt: timestamp("gmail_synced_at", { withTimezone: true }),
  ...timestamps,
});

export const assets = pgTable("assets", {
  id: text("id").primaryKey(),
  contentType: text("content_type").notNull(),
  bytes: bytea("bytes").notNull(),
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Signature = typeof signatures.$inferSelect;
export type Generator = typeof generators.$inferSelect;
