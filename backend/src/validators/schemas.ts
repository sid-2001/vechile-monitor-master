import { ValidatorFn } from "../middleware/validationMiddleware";

const has = (obj: any, key: string): boolean => Object.prototype.hasOwnProperty.call(obj || {}, key);

export const loginSchema: ValidatorFn = (body: any) => !body?.username || !body?.password ? ["username and password are required"] : [];
export const passcodeSchema: ValidatorFn = (body: any) => !body?.username ? ["username is required"] : [];
export const resetSchema: ValidatorFn = (body: any) => (!body?.username || !body?.passcode || !body?.newPassword ? ["username, passcode and newPassword are required"] : []);

export const baseSchema: ValidatorFn = (body: any) => {
  const errors: string[] = [];
  if (!body?.name) errors.push("name is required");
  if (!body?.locationId) errors.push("locationId is required");
  if (body?.location?.latitude === undefined || body?.location?.longitude === undefined) errors.push("location latitude and longitude are required");
  if (!body?.address?.state || !body?.address?.city || !body?.address?.pincode) errors.push("address.state/city/pincode required");
  return errors;
};

export const userSchema: ValidatorFn = (body: any) => {
  const errors: string[] = [];
  ["username", "role"].forEach((f) => !body?.[f] && errors.push(`${f} is required`));
  // if (!Array.isArray(body?.baseIds) || body.baseIds.length === 0) errors.push("baseIds is required");
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
  // if (!body?.locationId) errors.push("locationId is required");
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


export const locationSchema: ValidatorFn = (body: any) => {
  const errors: string[] = [];
  ["name", "country", "state", "city"].forEach((f) => !body?.[f] && errors.push(`${f} is required`));
  return errors;
};

export const vehicleHaltConfigSchema: ValidatorFn = (
  body: any
) => {
  const errors: string[] = [];

  if (!body?.vehicleId) {
    errors.push("vehicleId is required");
  }

  if (!body?.dayHalt) {
    errors.push("dayHalt is required");
  } else {
    if (!body.dayHalt.windowStartTime) {
      errors.push(
        "dayHalt.windowStartTime is required"
      );
    }

    if (!body.dayHalt.windowEndTime) {
      errors.push(
        "dayHalt.windowEndTime is required"
      );
    }

    if (
      body.dayHalt.minimumDurationMinutes === undefined ||
      Number(body.dayHalt.minimumDurationMinutes) <= 0
    ) {
      errors.push(
        "dayHalt.minimumDurationMinutes must be greater than 0"
      );
    }
  }

  if (!body?.nightHalt) {
    errors.push("nightHalt is required");
  } else {
    if (!body.nightHalt.windowStartTime) {
      errors.push(
        "nightHalt.windowStartTime is required"
      );
    }

    if (!body.nightHalt.windowEndTime) {
      errors.push(
        "nightHalt.windowEndTime is required"
      );
    }

    if (
      body.nightHalt.minimumDurationMinutes === undefined ||
      Number(body.nightHalt.minimumDurationMinutes) <= 0
    ) {
      errors.push(
        "nightHalt.minimumDurationMinutes must be greater than 0"
      );
    }
  }

  if (!body?.detection) {
    errors.push("detection is required");

    return errors;
  }

  const positiveDetectionFields = [
    "stationaryRadiusMeters",
    "stationaryConfirmationPackets",
    "movementConfirmationPackets",
    "maxPacketGapSeconds",
    "gpsJumpSpeedMultiplier",
  ];

  positiveDetectionFields.forEach((field) => {
    if (
      body.detection[field] === undefined ||
      Number(body.detection[field]) <= 0
    ) {
      errors.push(
        `detection.${field} must be greater than 0`
      );
    }
  });

  if (
    body.detection.stationarySpeedThreshold === undefined ||
    Number(body.detection.stationarySpeedThreshold) < 0
  ) {
    errors.push(
      "detection.stationarySpeedThreshold must be 0 or greater"
    );
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

  [
    {
      field: "dayHalt.windowStartTime",
      value: body?.dayHalt?.windowStartTime,
    },
    {
      field: "dayHalt.windowEndTime",
      value: body?.dayHalt?.windowEndTime,
    },
    {
      field: "nightHalt.windowStartTime",
      value: body?.nightHalt?.windowStartTime,
    },
    {
      field: "nightHalt.windowEndTime",
      value: body?.nightHalt?.windowEndTime,
    },
  ].forEach(({ field, value }) => {
    if (value && !timeRegex.test(String(value))) {
      errors.push(
        `${field} must be in HH:mm format`
      );
    }
  });

  return errors;
};
