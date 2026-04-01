import bcrypt from "bcryptjs";
import { env } from "../config/env";
import { Base } from "../models/Base";
import { User } from "../models/User";

export const runDefaultSeed = async (): Promise<void> => {
  let base = await Base.findOne({ code: "JAL001" });
  if (!base) {
    base = new Base({
      name: "Jalandhar Base",
      code: "JAL001",
      city: "Jalandhar",
      state: "Punjab",
      isActive: true
    });
    base.$locals.currentUser = "SYSTEM";
    await base.save();
  }

  const existingAdmin = await User.findOne({ username: env.defaultAdminUsername });
  if (!existingAdmin) {
    const admin = new User({
      username: env.defaultAdminUsername,
      displayName: env.defaultAdminDisplayName,
      password: await bcrypt.hash(env.defaultAdminPassword, 10),
      role: "ADMIN",
      baseId: base._id,
      failedAttempts: 0,
      isLocked: false,
      passcode: "123456",
      isActive: true
    });
    admin.$locals.currentUser = "SYSTEM";
    await admin.save();
  }
};
