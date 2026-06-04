const net = require('net');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { ObjectId } = require('mongodb');
const { MongoClient } = require('mongodb');

// ================== 1. CONFIGURATION & CONSTANTS ==================
const MONGO_URI = "mongodb+srv://nightlfiy:BwZB3m3ze08f8A0p@cluster0.f6fro.mongodb.net/?appName=Cluster0";
const DB_NAME = "vehicle_monitoring_system";
const API_BASE = "https://api.impronics.com/army/notifications";
const AUTH_HEADER = {
  "Content-Type": "application/json",
  "Authorization": "Bearer Impronics@1234"
};

// ================== 2. GLOBAL VARIABLES ==================
let db, devicesCollection, locationsCollection;
let vehiclesCollection;
let geofencesCollection;
let geofenceCache = [];
const orientationHistoryMap = new Map(); // imei -> [{time, pitch, roll}]
const lastHeartbeatMap = new Map();
const vehicleGeofenceState = new Map();
const lastSpeedMap = new Map(); // for braking detection

// ================== 3. LOG FILE SETUP ==================
const logFilePath = path.join(__dirname, 'ruptela_hex.log');
const hexLogStream = fs.createWriteStream(logFilePath, { flags: 'a' });
const imeiLogPath = path.join(__dirname, 'ruptela_imei.log');
const imeiLogStream = fs.createWriteStream(imeiLogPath, { flags: 'a' });
const sosLogPath = path.join(__dirname, 'sos.log');
const sosLogStream = fs.createWriteStream(sosLogPath, { flags: 'a' });

// ================== 4. DATABASE FUNCTIONS ==================
async function initDB() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();

  db = client.db(DB_NAME);
  devicesCollection = db.collection('devices');
  locationsCollection = db.collection('vehiclelocations');
  vehiclesCollection = db.collection('vehicles');
 historyCollection = db.collection('vehicle_coordinates_history');
  geofencesCollection = db.collection('geofences');

  console.log('✅ MongoDB Connected');
}

async function saveToDB(imei, record) {
  try {
    const device = await devicesCollection.findOne({
      imei: imei.trim()
    });

    if (!device) {
      console.log(`⚠️ Device not found for IMEI: ${imei}`);
      return;
    }

    const now = new Date();

    const doc = {
      vehicleId: device.linkedVehicleId,
      deviceId: imei,
      time: record.time,
      latitude: record.latitude,
      longitude: record.longitude,
      speed: record.speed,
      angle: record.angle,
      ignition: record.ignition,
      createdBy: "SYSTEM",
      createdLocalDateTime: now,
      createdOffset: "+05:30",
      createdTimezone: "Asia/Calcutta",
      createdUtcDateTime: now,
      __v: 0
    };

    // =========================
    // 1️⃣ UPDATE LATEST LOCATION (UPSERT)
    // =========================
    await locationsCollection.updateOne(
      { deviceId: imei }, 
      { $set: doc },
      { upsert: true }
    );

    // =========================
    // 2️⃣ INSERT INTO HISTORY
    // =========================
    await historyCollection.insertOne(doc);

    console.log('💾 Updated latest + inserted history');

  } catch (err) {
    console.error('❌ DB Error:', err.message);
  }
}
// ================== 5. GEOFENCE FUNCTIONS ==================
async function loadGeofences() {
  geofenceCache = await geofencesCollection.find({}).toArray();
  console.log("📦 Geofences loaded:", geofenceCache.length);
}

function isInsideGeofence(lat, lng, geo) {
  const distance = getDistanceInMeters(
    lat,
    lng,
    geo.center.latitude,
    geo.center.longitude
  );
  return distance <= geo.radius;
}


function calculateRollPitch(ax, ay, az) {
  try {
    // Convert to float (important if coming as int)
    ax = Number(ax);
    ay = Number(ay);
    az = Number(az);

    // (rotation around X-axis)
    const roll = Math.atan2(ay, az) * (180 / Math.PI);

    // (rotation around Y-axis)
    const pitch = Math.atan2(-ax, Math.sqrt(ay * ay + az * az)) * (180 / Math.PI);

    return {
      roll: Number(roll.toFixed(2)),
      pitch: Number(pitch.toFixed(2))
    };
  } catch (err) {
    console.error("❌ Roll/Pitch calc error:", err.message);
    return { roll: 0, pitch: 0 };
  }
}

function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function checkGeofence(vehicle, record) {
  try {
    const geofences = geofenceCache;

    for (const geo of geofences) {
      const key = `${vehicle._id.toString()}_${geo._id}`;

      // ✅ FIRST calculate
      const isInside = isInsideGeofence(
        record.latitude,
        record.longitude,
        geo
      );

      // ✅ THEN read previous state
      const wasInside = vehicleGeofenceState.has(key)
        ? vehicleGeofenceState.get(key)
        : null;

      // ✅ First time → just initialize state (no API call)
      if (wasInside === null) {
        vehicleGeofenceState.set(key, isInside);
        continue;
      }

      // ✅ ENTER
      if (!wasInside && isInside) {
        console.log("🟢 GEOFENCE ENTER:", geo.name);

        await axios.post(`${API_BASE}/geofence-enter`, {
          vehicleId: vehicle._id.toString(),
          vehicleNumber: vehicle.vehicleNumber,
          geofenceId: String(geo._id),
          geofenceName: geo.name,
          speed: record.speed,
          latitude: record.latitude,
          longitude: record.longitude,
          time: record.time,
          source: "live"
        }, { headers: AUTH_HEADER });
      }

      // ✅ EXIT
      if (wasInside && !isInside) {
        console.log("🔴 GEOFENCE EXIT:", geo.name);

        await axios.post(`${API_BASE}/geofence-exit`, {
          vehicleId: vehicle._id.toString(),
          vehicleNumber: vehicle.vehicleNumber,
          geofenceId: String(geo._id),
          geofenceName: geo.name,
          speed: record.speed,
          latitude: record.latitude,
          longitude: record.longitude,
          time: record.time,
          source: "live"
        }, { headers: AUTH_HEADER });
      }

      // ✅ Update state
      vehicleGeofenceState.set(key, isInside);
    }

  } catch (err) {
    console.error("❌ Geofence error:", err.response?.data || err.message);
  }
}

// ================== 6. ALERT FUNCTIONS 
async function sendOverspeed(vehicle, record) {
  try {
    if (!vehicle?.performance?.maxSpeed) return;

    if (record.speed > vehicle.performance.maxSpeed) {
      console.log("🚨 OVERSPEED ALERT");
      await axios.post(`${API_BASE}/speed-exceeded`, {
        vehicleId:vehicle._id.toString(),
        vehicleNumber: vehicle.vehicleNumber,
        speed: record.speed,
        maxSpeed: vehicle.performance.maxSpeed,
        latitude: record.latitude,
        longitude: record.longitude,
        time: record.time,
        source: "live"
      }, { headers: AUTH_HEADER });
    }
  } catch (err) {
    console.error("❌ Overspeed API error:", err.message);
  }
}

async function sendHarshBraking(vehicle, record, imei) {
  try {
    const lastSpeed = lastSpeedMap.get(imei);
    let harshbraking_threshold=vehicle?.performance?.harshBraking||0;
    if (lastSpeed !== undefined) {
      const diff = lastSpeed - record.speed;
      if (diff > harshbraking_threshold) {
        console.log("🚨 HARSH BRAKING ALERT");
        await axios.post(`${API_BASE}/harsh-braking`, {
          vehicleId: vehicle._id.toString(),
          vehicleNumber: vehicle.vehicleNumber,
          previousSpeed: lastSpeed,
          speed: record.speed,
          latitude: record.latitude,
          longitude: record.longitude,
          time: record.time,
          source: "live"
        }, { headers: AUTH_HEADER });
      }
    }
    lastSpeedMap.set(imei, record.speed);
  } catch (err) {
    console.error("❌ Braking API error:", err.message);
  }
}
async function sendAccident(vehicle, record, imei) {
  try {
    const pitchThreshold = vehicle?.performance?.highPitch || 0;
    const rollThreshold = vehicle?.performance?.highRoll || 0;

    const history = orientationHistoryMap.get(imei) || [];

    if (history.length === 0) return;

    // calculate averages
    const avgPitch =
      history.reduce((sum, h) => sum + Math.abs(h.pitch), 0) / history.length;

    const avgRoll =
      history.reduce((sum, h) => sum + Math.abs(h.roll), 0) / history.length;

    console.log("📊 Avg Pitch:", avgPitch, "Avg Roll:", avgRoll);

    const last = history[history.length - 2];

const pitchChange = last ? Math.abs(record.pitch - last.pitch) : 0;
const rollChange = last ? Math.abs(record.roll - last.roll) : 0;
console.log("DEBUG →", {
  avgPitch,
  avgRoll,
  pitchChange,
  rollChange,
  speed: record.speed,
  pitchThreshold,
  rollThreshold
});
    // accident condition based on average
   if (
  record.roll > rollThreshold ||
  (avgPitch > pitchThreshold && record.speed > 10) ||
  pitchChange > 20 ||
  rollChange > 20
) {
      console.log("🚨 ACCIDENT DETECTED (10s avg)");

      await axios.post(
        `${API_BASE}/vehicle-accident`,
        {
          vehicleId: vehicle._id.toString(),
          vehicleNumber: vehicle.vehicleNumber,
          pitch: avgPitch,
          roll: avgRoll,
          speed: record.speed,
          latitude: record.latitude,
          longitude: record.longitude,
          time: record.time,
          source: "live"
        },
        { headers: AUTH_HEADER }
      );
    }
  } catch (err) {
    console.error("❌ Accident API error:", err.message);
  }
}

// ================== 7. PROTOCOL PARSING FUNCTIONS ==================
function crc16(buffer) {
  let crc = 0x0000;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (crc >> 1) ^ 0x8408 : crc >> 1;
    }
  }
  return crc & 0xffff;
}

function parseIMEI(buffer) {
  try {
    return BigInt('0x' + buffer.toString('hex')).toString();
  } catch {
    return null;
  }
}

function isValidGPS(record) {
  return !(
    record.latitude === -214.7483648 ||
    record.longitude === -214.7483648 ||
    record.speed === 65535 ||
    record.latitude === 0 ||
    record.longitude === 0
  );
}

function parseIO(payload, offset) {
  let ignition = false;
  let sos = false;
  let accelX = 0;
let accelY = 0;
let accelZ = 0;

  function safeRead(size) {
    if (offset + size > payload.length) {
      throw new Error("IO overflow");
    }
  }

  safeRead(1);
  const io1Count = payload.readUInt8(offset++);
  for (let i = 0; i < io1Count; i++) {
    safeRead(3);
    const id = payload.readUInt16BE(offset); offset += 2;
    const value = payload.readUInt8(offset++);
    console.log("🔌 IO DEBUG → ID:", id, "Value:", value);

    if (id === 409) {
      ignition = value > 0;
    }

    if (id === 988 && value === 1) {
      sos = true;
      console.log("🚨 SOS BUTTON PRESSED (DIN5 HIGH)");
      sosLogStream.write(`[${new Date().toISOString()}] SOS SIGNAL → ID: ${id}, Value: ${value}\n`);
    }
if (id === 49) accelX = value;
if (id === 50) accelY = value;
if (id === 51) accelZ = value;

  }

  safeRead(1);
  const io2Count = payload.readUInt8(offset++);
  for (let i = 0; i < io2Count; i++) {
    safeRead(4);
    offset += 2;
    offset += 2;
  }

  safeRead(1);
  const io4Count = payload.readUInt8(offset++);
  for (let i = 0; i < io4Count; i++) {
    safeRead(6);
    offset += 2;
    offset += 4;
  }

  safeRead(1);
  const io8Count = payload.readUInt8(offset++);
  for (let i = 0; i < io8Count; i++) {
    safeRead(10);
    offset += 2;
    offset += 8;
  }

  return { offset, ignition, sos , accelX, accelY, accelZ };
}

async function parseRecords(payload, imei) {
  let offset = 0;
  const recordsLeft = payload.readUInt8(offset++);
  const recordCount = payload.readUInt8(offset++);
 
  const device = await devicesCollection.findOne({ imei: imei.trim() });

if (!device || !device.linkedVehicleId) {
  console.log("⚠️ Device not linked");
  return;
}

const vehicle = await vehiclesCollection.findOne({
  _id: new ObjectId(device.linkedVehicleId)
});

if (!vehicle) {
  console.log("⚠️ Vehicle not found");
  return;
}

  for (let i = 0; i < recordCount; i++) {
    try {
      const timestamp = payload.readUInt32BE(offset); offset += 4;
      offset += 2;
      const priority = payload.readUInt8(offset++);
      const longitude = payload.readInt32BE(offset) / 10000000; offset += 4;
      const latitude = payload.readInt32BE(offset) / 10000000; offset += 4;
      const altitude = payload.readInt16BE(offset); offset += 2;
      const angle = payload.readUInt16BE(offset) / 100; offset += 2;
      const satellites = payload.readUInt8(offset++);
      const speed = payload.readUInt16BE(offset); offset += 2;
      const hdop = payload.readUInt8(offset++);
      const eventId = payload.readUInt16BE(offset); offset += 2;
      const date = new Date(timestamp * 1000);
      const ioResult = parseIO(payload, offset);
      offset = ioResult.offset;


      const { accelX, accelY, accelZ } = ioResult;
        const { roll, pitch } = calculateRollPitch(accelX, accelY, accelZ);

if (accelX || accelY || accelZ) {


  console.log("📐 Vehicle Orientation:");
  console.log("➡️ Roll:", roll, "°");
  console.log("➡️ Pitch:", pitch, "°");
}
      const record = {
        time: date,
        latitude,
        longitude,
        speed,
        angle,
        ignition: ioResult.ignition,
        sos: ioResult.sos,
        pitch: pitch,
        roll: roll
       
      };

      console.log("📡 Record:", record);

      if (record.sos) {
      
        if (device && device.linkedVehicleId) {
          console.log("🚨 CALLING SOS API...");
          sosLogStream.write(`[${new Date().toISOString()}] CALLING SOS API → ${device.linkedVehicleId}\n`);

          try {
            await axios.post(
              "https://api.impronics.com/army/api/sos/create",
              {
                vehicleId: device.linkedVehicleId
              },
              {
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                }
              }
            );
          } catch (err) {
            console.error("❌ SOS API Error:", err.message);
          }
        }
      }

      if (!isValidGPS(record)) {
        console.log("⚠️ Skipping invalid GPS data");
        continue;
      }

      await updateVehicleHeartbeat(imei);
      await saveToDB(imei, record);

      // ✅ FETCH VEHICLE (REQUIRED FOR ALERTS)


const vehicle = await vehiclesCollection.findOne({
  
    _id: new ObjectId(device.linkedVehicleId)
});


const nowTs = Date.now();

if (!orientationHistoryMap.has(imei)) {
  orientationHistoryMap.set(imei, []);
}

const history = orientationHistoryMap.get(imei);

// push new data
history.push({
  time: nowTs,
  pitch: record.pitch,
  roll: record.roll
});

// keep only last 10 seconds
const tenSecondsAgo = nowTs - 10000;

const filtered = history.filter(h => h.time >= tenSecondsAgo);

// update map
orientationHistoryMap.set(imei, filtered);

if (!vehicle) {
  console.log("⚠️ Vehicle not found in DB");
  continue;
}

// ✅ GEOFENCE CHECK
await checkGeofence(vehicle, record);

// ✅ OVERSPEED
await sendOverspeed(vehicle, record);

// ✅ HARSH BRAKING
await sendHarshBraking(vehicle, record, imei);
await sendAccident(vehicle, record, imei);


    } catch (err) {
      console.log(err)
      console.error('❌ Record error:', err.message);
      break;
    }
  }
}

// ================== 8. VEHICLE STATUS FUNCTIONS ==================
async function updateVehicleHeartbeat(imei) {
  try {
    const device = await devicesCollection.findOne({ imei: imei.trim() });

    if (!device || !device.linkedVehicleId) return;

    await vehiclesCollection.updateOne(
   

       { _id: new ObjectId(device.linkedVehicleId)},
      {
        $set: {
          lastSeen: new Date(),
          live: true
        }
      }
    );
  } catch (err) {
    console.error("❌ Heartbeat error:", err.message);
  }
}
function startLiveStatusJob() {
  setInterval(async () => {
    try {
      const threshold = new Date(Date.now() - 20000);
      await vehiclesCollection.updateMany(
        {
          lastSeen: { $lt: threshold },
          live: true
        },
        {
          $set: { live: false }
        }
      );
    } catch (err) {
      console.error("❌ Live job error:", err.message);
    }
  }, 10000);
}

// ================== 9. TCP SERVER & NETWORK FUNCTIONS ==================
const server = net.createServer((socket) => {
  let tcpBuffer = Buffer.alloc(0);
  let deviceIMEI = null;

  socket.on('data', async (data) => {
    tcpBuffer = Buffer.concat([tcpBuffer, data]);

    const now = new Date().toISOString(); // ✅ timestamp
    hexLogStream.write(`[${now}] RAW: ${data.toString('hex')}\n`);

    while (tcpBuffer.length >= 2) {
      const packetLength = tcpBuffer.readUInt16BE(0);
      const totalSize = 2 + packetLength + 2;

      if (tcpBuffer.length < totalSize) break;

      const packet = tcpBuffer.subarray(0, totalSize);
      tcpBuffer = tcpBuffer.subarray(totalSize);

      const packetTime = new Date().toISOString(); // ✅ per-packet timestamp

      const dataForCrc = packet.subarray(2, packet.length - 2);
      const receivedCrc = packet.readUInt16BE(packet.length - 2);

      if (crc16(dataForCrc) !== receivedCrc) {
        console.log(`[${packetTime}] ⚠️ CRC mismatch`);
        continue;
      }

      const imei = parseIMEI(packet.subarray(2, 10));
      const commandId = packet.readUInt8(10);
      const payload = packet.subarray(11, packet.length - 2);

      if (!deviceIMEI) {
        deviceIMEI = imei;
        imeiLogStream.write(`[${packetTime}] IMEI: ${imei}\n`);
      }

      console.log(
        `[${packetTime}] IMEI: ${imei}, CMD: 0x${commandId.toString(16)}`
      );

      switch (commandId) {
        case 0x44:
          await parseRecords(payload, imei);
          socket.write(Buffer.from('0002640113BC', 'hex'));
          console.log(`[${packetTime}] Sent ACK for 0x44`);
          break;

        case 0x12:
          socket.write(Buffer.from('00027301CB25', 'hex'));
          console.log(`[${packetTime}] Sent ACK for 0x12`);
          break;

        case 0x10:
          socket.write(Buffer.from('00027401862D', 'hex'));
          console.log(`[${packetTime}] Sent ACK for 0x10`);
          break;
      }
    }
  });

  socket.on('close', () => {
    console.log(`[${new Date().toISOString()}] 🔌 Connection closed`);
  });

  socket.on('error', (err) => {
    console.error(`[${new Date().toISOString()}] ❌ Socket error:`, err.message);
  });
});

// ================== 10. APPLICATION STARTUP ==================
initDB().then(async () => {
  await loadGeofences(); // ✅ AFTER DB CONNECT
  setInterval(loadGeofences, 30000);

  startLiveStatusJob();

  server.listen(11000, () => {
    console.log('🚀 Server running on port 11000');
  });
});