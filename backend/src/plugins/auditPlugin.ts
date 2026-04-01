import { Query, Schema } from "mongoose";
import { auditFieldsSchemaDefinition } from "../models/audit";
import { getTimeMetadata } from "../utils/time";

const applyCreateAudit = (schema: Schema): void => {
  schema.pre("save", function (next) {
    const actor = this.$locals.currentUser || "SYSTEM";
    if (this.isNew) {
      const time = getTimeMetadata();
      this.set({
        createdBy: actor,
        createdLocalDateTime: time.localDateTime,
        createdUtcDateTime: time.utcDateTime,
        createdOffset: time.offset,
        createdTimezone: time.timezone
      });
    } else if (this.isModified()) {
      const time = getTimeMetadata();
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
};

const applyUpdateAudit = (schema: Schema): void => {
  const handler = function (this: Query<unknown, unknown>, next: () => void): void {
    const actor = (this.getOptions() as { currentUser?: string }).currentUser || "SYSTEM";
    const time = getTimeMetadata();
    const update = this.getUpdate() as Record<string, unknown> & {
      $set?: Record<string, unknown>;
    };

    const $set = update.$set || {};
    $set.modifiedBy = actor;
    $set.modifiedLocalDateTime = time.localDateTime;
    $set.modifiedUtcDateTime = time.utcDateTime;
    $set.modifiedOffset = time.offset;
    $set.modifiedTimezone = time.timezone;

    update.$set = $set;
    this.setUpdate(update);
    next();
  };

  schema.pre("findOneAndUpdate", handler);
  schema.pre("updateOne", handler);
  schema.pre("updateMany", handler);
};

export const auditPlugin = (schema: Schema): void => {
  schema.add(auditFieldsSchemaDefinition);
  applyCreateAudit(schema);
  applyUpdateAudit(schema);
};
