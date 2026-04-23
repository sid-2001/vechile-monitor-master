import { ValidatorFn } from "../middleware/validationMiddleware";

const has = (obj: any, key: string): boolean => Object.prototype.hasOwnProperty.call(obj || {}, key);

export const loginSchema: ValidatorFn = (body: any) => !body?.username || !body?.password ? ["username and password are required"] : [];
export const passcodeSchema: ValidatorFn = (body: any) => !body?.username ? ["username is required"] : [];
export const resetSchema: ValidatorFn = (body: any) => (!body?.username || !body?.passcode || !body?.newPassword ? ["username, passcode and newPassword are required"] : []);

export const baseSchema: ValidatorFn = (body: any) => {
  const errors: string[] = [];
  if (!body?.name) errors.push("name is required");
  if (body?.location?.latitude === undefined || body?.location?.longitude === undefined) errors.push("location latitude and longitude are required");
  if (!body?.address?.state || !body?.address?.city || !body?.address?.pincode) errors.push("address.state/city/pincode required");
  return errors;
};

export const userSchema: ValidatorFn = (body: any) => {
  const errors: string[] = [];
  ["username", "role", "baseId"].forEach((f) => !body?.[f] && errors.push(`${f} is required`));
  if (!body?.name?.first || !body?.name?.last) errors.push("name.first and name.last are required");
  if (!body?.contact?.mobile || !body?.contact?.email) errors.push("contact.mobile and contact.email are required");
  return errors;
};

export const vehicleSchema: ValidatorFn = (body: any) => {
  const errors: string[] = [];
  ["vehicleNumber", "licensePlate", "type", "subType", "deviceId", "baseId"].forEach((f) => !body?.[f] && errors.push(`${f} is required`));
  ["manufacturer", "manufacturing", "physical", "performance"].forEach((f) => !has(body, f) && errors.push(`${f} is required`));
  return errors;
};

export const vehicleLocationSchema: ValidatorFn = (body: any) => {
  const errors: string[] = [];
  ["vehicleId", "deviceId", "time", "latitude", "longitude", "speed", "ignition"].forEach((f) => !has(body, f) && errors.push(`${f} is required`));
  return errors;
};

export const geofenceSchema: ValidatorFn = (body: any) => {
  const errors: string[] = [];
  if (!body?.name) errors.push("name is required");
  if (!body?.baseId) errors.push("baseId is required");
  if (body?.center?.latitude === undefined || body?.center?.longitude === undefined) errors.push("center latitude and longitude are required");
  if (body?.radius === undefined || Number(body.radius) <= 0) errors.push("radius should be greater than 0");
  return errors;
};

export const simMasterSchema: ValidatorFn = (body: any) => {
  const errors: string[] = [];

  if (!body?.simid) errors.push("simid is required");
  if (!body?.simnumber) errors.push("simnumber is required");
  if (!body?.operator) errors.push("operator is required");

  return errors;
};
