import { SchemaDefinitionProperty } from "mongoose";

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

export const auditFieldsSchemaDefinition: Record<string, SchemaDefinitionProperty<unknown>> = {
  createdBy: { type: String, maxlength: 20, default: "SYSTEM" },
  createdLocalDateTime: { type: Date },
  createdOffset: { type: String, maxlength: 10 },
  createdTimezone: { type: String, maxlength: 50 },
  createdUtcDateTime: { type: Date },
  modifiedBy: { type: String, maxlength: 20 },
  modifiedLocalDateTime: { type: Date },
  modifiedOffset: { type: String, maxlength: 10 },
  modifiedTimezone: { type: String, maxlength: 50 },
  modifiedUtcDateTime: { type: Date }
};
