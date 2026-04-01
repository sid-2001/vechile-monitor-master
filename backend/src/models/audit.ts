import { Schema } from "mongoose";

export interface AuditFields {
  createdBy: string;
  createdLocalDateTime: Date;
  createdOffset: string;
  createdTimezone: string;
  createdUtcDateTime: Date;
  modifiedBy?: string;
  modifiedLocalDateTime?: Date;
  modifiedOffset?: string;
  modifiedTimezone?: string;
  modifiedUtcDateTime?: Date;
}

export const auditFieldsSchemaDefinition = {
  createdBy: { type: String, maxlength: 20, required: true },
  createdLocalDateTime: { type: Date, required: true },
  createdOffset: { type: String, maxlength: 10, required: true },
  createdTimezone: { type: String, maxlength: 50, required: true },
  createdUtcDateTime: { type: Date, required: true },
  modifiedBy: { type: String, maxlength: 20 },
  modifiedLocalDateTime: { type: Date },
  modifiedOffset: { type: String, maxlength: 10 },
  modifiedTimezone: { type: String, maxlength: 50 },
  modifiedUtcDateTime: { type: Date }
};

export type AuditableSchema = Schema & {
  options: Schema["options"] & { currentUser?: string };
};
