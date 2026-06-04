const net = require('net');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { MongoClient } = require('mongodb');

// ================== CONFIG ==================
const MONGO_URI = "mongodb+srv://nightlfiy:BwZB3m3ze08f8A0p@cluster0.f6fro.mongodb.net/?appName=Cluster0";
const DB_NAME = "vehicle_monitoring_system";

// ================== DB ==================
let db, devicesCollection, locationsCollection;

const deviceCache = new Map();
const vehicleStateCache = new Map();

// ================== INIT ==================
async function initDB() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();

  db = client.db(DB_NAME);
  devicesCollection = db.collection('devices');
  locationsCollection = db.collection('vehiclelocations');

  // await locationsCollection.createIndex({ deviceId: 1 }, { unique: true });

  console.log('✅ MongoDB Connected');
}

// ================== DEVICE CACHE ==================
async function getDevice(imei) {
  if (deviceCache.has(imei)) return deviceCache.get(imei);

  const device = await devicesCollection.findOne({ imei: imei.trim() });
  if (device) deviceCache.set(imei, device);

  return device;
}

// ================== LOGS ==================
const hexLogStream = fs.createWriteStream(path.join(__dirname, 'hex.log'), { flags: 'a' });
const sosLogStream = fs.createWriteStream(path.join(__dirname, 'sos.log'), { flags: 'a' });

// ================== CRC ==================
function crc16(buffer) {
  let crc = 0;
  for (let b of buffer) {
    crc ^= b;
    for (let i = 0; i < 8; i++) {
      crc = (crc & 1) ? (crc >> 1) ^ 0x8408 : crc >> 1;
    }
  }
  return crc & 0xffff;
}

// ================== HELPERS ==================
function parseIMEI(buffer) {
  try {
    return BigInt('0x' + buffer.toString('hex')).toString();
  } catch {
    return null;
  }
}

function isValidGPS(r) {
  return !(r.latitude === 0 || r.longitude === 0 || r.speed === 65535);
}

// ================== IO PARSER ==================
function parseIO(payload, offset) {
  let ignition = false;
  let sos = false;

  const io1 = payload.readUInt8(offset++);
  for (let i = 0; i < io1; i++) {
    const id = payload.readUInt16BE(offset); offset += 2;
    const value = payload.readUInt8(offset++);

    if (id === 409) ignition = value > 0;
    if (id === 988 && value === 1) sos = true;
  }

  const io2 = payload.readUInt8(offset++); offset += io2 * 4;
  const io4 = payload.readUInt8(offset++); offset += io4 * 6;
  const io8 = payload.readUInt8(offset++); offset += io8 * 10;

  return { offset, ignition, sos };
}

// ================== WEEK COLLECTION ==================
function getWeekCollectionName(date) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());

  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const f = d => d.toISOString().split('T')[0];
  return `vehicle_location_history_${f(start)}_${f(end)}`;
}

function getHistoryCollection(date) {
  return db.collection(getWeekCollectionName(date));
}

// ================== REALTIME SAVE ==================
// async function saveRealtime(imei, record, state) {
//   const now = record.time.getTime();
//   if (now - state.lastRealtimeSavedAt < 1000) return;

//   const device = await getDevice(imei);
//   if (!device) return;

//   await locationsCollection.updateOne(
//     { deviceId: imei },
//     {
//       $set: {
//         vehicleId: device.linkedVehicleId,
//         deviceId: imei,
//         ...record,
//         updatedAt: new Date()
//       }
//     },
//     { upsert: true }
//   );

//   state.lastRealtimeSavedAt = now;
// }


// async function saveRealtime(imei, record, state) {
//   const now = Date.now();

//   // ✅ Only save if ≥ 1 second difference
//   if (now - state.lastRealtimeSavedAt < 1000) return;

//   const device = await getDevice(imei);
//   if (!device) return;

//   await locationsCollection.updateOne(
//     { deviceId: imei },
//     {
//       $set: {
//         vehicleId: device.linkedVehicleId,
//         deviceId: imei,

//         // 📡 EXACT REQUIRED FIELDS
//         time: record.time,
//         latitude: record.latitude,
//         longitude: record.longitude,
//         speed: record.speed,
//         angle: record.angle,
//         ignition: record.ignition,

//         // ✅ ONLY THIS TIMESTAMP
//         createdUtcDateTime: new Date()
//       }
//     },
//     { upsert: true }
//   );

//   state.lastRealtimeSavedAt = now;
// }

// async function saveRealtime(imei, record, state) {
//   const now = Date.now();
//   if (now - state.lastRealtimeSavedAt < 1000) return;

//   const device = await getDevice(imei);
//   if (!device) return;

//   try {
//     await locationsCollection.updateOne(
//       { deviceId: imei },
//       {
//         $set: {
//           vehicleId: device.linkedVehicleId,
//           deviceId: imei,
//           time: record.time,
//           latitude: record.latitude,
//           longitude: record.longitude,
//           speed: record.speed,
//           angle: record.angle,
//           ignition: record.ignition,
//           createdUtcDateTime: new Date()
//         }
//       },
//       { upsert: true }
//     );

//   } catch (err) {
//     // 🔥 HANDLE DUPLICATE KEY
//     if (err.code === 11000) {
//       // retry as pure update
//       await locationsCollection.updateOne(
//         { deviceId: imei },
//         {
//           $set: {
//             vehicleId: device.linkedVehicleId,
//             deviceId: imei,
//             time: record.time,
//             latitude: record.latitude,
//             longitude: record.longitude,
//             speed: record.speed,
//             angle: record.angle,
//             ignition: record.ignition,
//             createdUtcDateTime: new Date()
//           }
//         }
//       );
//     } else {
//       console.error("❌ DB Error:", err.message);
//     }
//   }

//   state.lastRealtimeSavedAt = now;
// }


async function saveRealtime(imei, record, state) {
  const now = Date.now();

  // ✅ Only insert if ≥ 1 second difference
  if (now - state.lastRealtimeSavedAt < 1000) return;

  const device = await getDevice(imei);
  if (!device) return;

  try {
    await locationsCollection.insertOne({
      vehicleId: device.linkedVehicleId,
      deviceId: imei,

      time: record.time,
      latitude: record.latitude,
      longitude: record.longitude,
      speed: record.speed,
      angle: record.angle,
      ignition: record.ignition,

      createdUtcDateTime: new Date()
    });

  } catch (err) {
    console.error("❌ Insert Error:", err.message);
  }

  state.lastRealtimeSavedAt = now;
}
// ================== MINUTE HISTORY ==================
async function saveMinuteHistory(imei, state) {
  const latest = state.buffer[state.buffer.length - 1];
  const device = await getDevice(imei);
  if (!device) return;

  const col = getHistoryCollection(latest.time);

  await col.insertOne({
    vehicleId: device.linkedVehicleId,
    deviceId: imei,
    time: latest.time,
    latitude: latest.latitude,
    longitude: latest.longitude,
    speed: latest.speed,
    angle: latest.angle,
    ignition: latest.ignition,
    previous_points: state.buffer.slice(0, -1),
    createdUtcDateTime: new Date()
  });

  console.log("📦 1-min history saved");
}

// ================== SOS HANDLER ==================
async function handleSOS(imei, record, state) {
  if (!record.sos || state.lastSOS) return; // edge trigger

  const device = await getDevice(imei);
  if (!device) return;

  console.log("🚨 SOS TRIGGERED");

  sosLogStream.write(
    `[${new Date().toISOString()}] SOS → IMEI:${imei}, VEHICLE:${device.linkedVehicleId}\n`
  );

  try {
    await axios.post(
      "https://dagger-luminance-gentile.ngrok-free.dev/api/sos/create",
      { vehicleId: device.linkedVehicleId },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("❌ SOS API Error:", err.message);
  }

  state.lastSOS = true;
}

// ================== RECORD PARSER ==================
async function parseRecords(payload, imei) {
  let offset = 0;

  payload.readUInt8(offset++);
  const count = payload.readUInt8(offset++);

  for (let i = 0; i < count; i++) {
    try {
      const ts = payload.readUInt32BE(offset); offset += 4;
      offset += 3;

      const lon = payload.readInt32BE(offset) / 1e7; offset += 4;
      const lat = payload.readInt32BE(offset) / 1e7; offset += 4;

      offset += 2;
      const angle = payload.readUInt16BE(offset) / 100; offset += 2;

      offset += 1;
      const speed = payload.readUInt16BE(offset); offset += 2;
      offset += 3;

      const date = new Date(ts * 1000);

      const io = parseIO(payload, offset);
      offset = io.offset;

      const record = {
        time: date,
        latitude: lat,
        longitude: lon,
        speed,
        angle,
        ignition: io.ignition,
        sos: io.sos
      };

      if (!isValidGPS(record)) continue;

      let state = vehicleStateCache.get(imei) || {
        buffer: [],
        lastRealtimeSavedAt: 0,
        lastMinuteSavedAt: 0,
        lastSOS: false
      };

      state.buffer.push(record);
      if (state.buffer.length > 60) state.buffer.shift();

      await saveRealtime(imei, record, state);

      const now = record.time.getTime();
      if (now - state.lastMinuteSavedAt >= 60000) {
        await saveMinuteHistory(imei, state);
        state.lastMinuteSavedAt = now;
      }

      // 🚨 SOS
      await handleSOS(imei, record, state);

      // reset SOS when released
      if (!record.sos) state.lastSOS = false;

      vehicleStateCache.set(imei, state);

    } catch (err) {
      console.error("❌ Parse error:", err.message);
      break;
    }
  }
}

// ================== TCP SERVER ==================
const server = net.createServer(socket => {
  let buffer = Buffer.alloc(0);

  socket.on('data', async data => {
    buffer = Buffer.concat([buffer, data]);
    hexLogStream.write(data.toString('hex') + '\n');

    while (buffer.length >= 2) {
      const len = buffer.readUInt16BE(0);
      const size = 2 + len + 2;

      if (buffer.length < size) break;

      const packet = buffer.subarray(0, size);
      buffer = buffer.subarray(size);

      const dataPart = packet.subarray(2, packet.length - 2);
      const crc = packet.readUInt16BE(packet.length - 2);

      if (crc16(dataPart) !== crc) continue;

      const imei = parseIMEI(packet.subarray(2, 10));
      const cmd = packet.readUInt8(10);
      const payload = packet.subarray(11, packet.length - 2);

      if (cmd === 0x44) {
        await parseRecords(payload, imei);
        socket.write(Buffer.from('0002640113BC', 'hex'));
      }
    }
  });
});

// ================== START ==================
initDB().then(() => {
  server.listen(11000, () => {
    console.log('🚀 Server running on port 11000');
  });
});