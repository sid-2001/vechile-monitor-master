import { Device, IDevice } from "../models/Device";

export class DeviceService {
  async create(payload: Partial<IDevice>, actor: string): Promise<IDevice> {
    const doc = new Device(payload);
    doc.$locals.currentUser = actor;
    return doc.save();
  }

  list(filter: Record<string, unknown> = {}) {
    return Device.find(filter).populate("linkedVehicleId", "vehicleNumber licensePlate").sort({ createdAt: -1 });
  }

  async update(id: string, payload: Partial<IDevice>, actor: string) {
    return Device.findByIdAndUpdate(id, payload, { new: true, runValidators: true, currentUser: actor } as never);
  }

  async remove(id: string) {
    return Device.findByIdAndDelete(id);
  }

  async linkToVehicle(deviceId: string, vehicleId: string | null, actor: string) {
    return Device.findByIdAndUpdate(
      deviceId,
      {
        linkedVehicleId: vehicleId || undefined,
        status: vehicleId ? "LINKED" : "ONBOARDED"
      },
      { new: true, runValidators: true, currentUser: actor } as never
    );
  }
}

export const deviceService = new DeviceService();
