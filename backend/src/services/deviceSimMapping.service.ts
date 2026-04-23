import  { IDeviceSimMapping } from "../models/DeviceSimMapping";
import DeviceSimMapping from "../models/DeviceSimMapping";
import { Device } from "../models/Device";
import SimMaster from "../models/SimMaster";

export class DeviceSimMappingService {

 async create(payload: Partial<IDeviceSimMapping>, actor: string): Promise<IDeviceSimMapping> {

  // Device already mapped
  const deviceExists = await DeviceSimMapping.findOne({
    deviceid: payload.deviceid,
    active: true
  });
  
  
  //  Check existing mapping for this device
const existingMapping = await DeviceSimMapping.findOne({
  deviceid: payload.deviceid,
  active: true
});

//  SAME DEVICE + SAME SIM
if (
  existingMapping &&
  existingMapping.simid.toString() === payload.simid?.toString()
) {
  throw new Error("This device is already mapped to this SIM");
}

//  SAME DEVICE + DIFFERENT SIM
if (existingMapping) {
  throw new Error("Device already mapped to another SIM");
}

  if (deviceExists) {
    throw new Error("Device already mapped to another SIM");
  }

  // SIM already used
 const simExists = await DeviceSimMapping.findOne({
  simid: payload.simid,
  active: true
});

if (
  simExists &&
  simExists.deviceid.toString() !== payload.deviceid?.toString()
) {
  throw new Error("SIM already assigned to another device");
}

  //  FETCH device & sim (IMPORTANT)
  const device = await Device.findById(payload.deviceid);
  const sim = await SimMaster.findById(payload.simid);

  if (!device || !sim) {
    throw new Error("Device or SIM not found");
  }

 

  //  AUTO FILL 
  payload.locationid = sim.locationid;
  payload.baseunitid = sim.baseunitid;
  payload.countrycode = sim.countrycode;
  payload.statecode = sim.statecode;

  //  CREATE MAPPING
  const doc = new DeviceSimMapping({
    ...payload,
    devicesimmapid: Date.now().toString(),
    active: true
  });

  doc.$locals.currentUser = actor;
  return doc.save();
}

  async list(filter: Record<string, unknown> = {}) {
    return DeviceSimMapping.find(filter)
      .populate("deviceid", "name imei")
      .populate("simid", "simnumber operator")
      .sort({ createdAt: -1 });
  }

  async update(id: string, payload: Partial<IDeviceSimMapping>, actor: string) {
    return DeviceSimMapping.findByIdAndUpdate(
      id,
      payload,
      { new: true, runValidators: true, currentUser: actor } as never
    );
  }

  async remove(id: string) {
    return DeviceSimMapping.findByIdAndDelete(id);
  }
}

export const deviceSimMappingService = new DeviceSimMappingService();