import { Query, Schema } from "mongoose";
import { auditFieldsSchemaDefinition } from "../models/audit";
import { getTimeMetadata } from "../utils/time";

export const auditPlugin = (schema: Schema): void => {
  schema.add(auditFieldsSchemaDefinition);

  schema.pre("save", function (next) {
    const actor = this.$locals.currentUser || "SYSTEM";
    const time = getTimeMetadata();

    if (this.isNew) {
      this.set({
        createdBy: actor,
        createdLocalDateTime: time.localDateTime,
        createdUtcDateTime: time.utcDateTime,
        createdOffset: time.offset,
        createdTimezone: time.timezone
      });
    } else if (this.isModified()) {
      this.set({
        modifiedBy: actor,
        modifiedLocalDateTime: time.localDateTime,
        modifiedUtcDateTime: time.utcDateTime,
        modifiedOffset: time.offset,
        modifiedTimezone: time.timezone
      });
    }
    next();
  });

  const setUpdateAudit = function (this: Query<unknown, unknown>, next: () => void): void {
    const actor = (this.getOptions() as { currentUser?: string }).currentUser || "SYSTEM";
    const time = getTimeMetadata();
    const update = (this.getUpdate() || {}) as Record<string, unknown> & { $set?: Record<string, unknown> };
    update.$set = {
      ...(update.$set || {}),
      modifiedBy: actor,
      modifiedLocalDateTime: time.localDateTime,
      modifiedUtcDateTime: time.utcDateTime,
      modifiedOffset: time.offset,
      modifiedTimezone: time.timezone
    };
    this.setUpdate(update);
    next();
  };

  schema.pre("findOneAndUpdate", setUpdateAudit);
  schema.pre("updateOne", setUpdateAudit);
  schema.pre("updateMany", setUpdateAudit);
};
