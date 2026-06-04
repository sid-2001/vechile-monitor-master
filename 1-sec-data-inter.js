const net = require('net');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { MongoClient } = require('mongodb');

// ================== MONGO ==================
const MONGO_URI = "mongodb+srv://nightlfiy:BwZB3m3ze08f8A0p@cluster0.f6fro.mongodb.net/?appName=Cluster0";
const DB_NAME = "vehicle_monitoring_system";

let db, devicesCollection, locationsCollection;
let vehiclesCollection;
const lastHeartbeatMap = new Map();
async function initDB() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();

  db = client.db(DB_NAME);
  devicesCollection = db.collection('devices');
  locationsCollection = db.collection('vehiclelocations');
 vehiclesCollection = db.collection('vehicles'); // ✅ ADDED
  console.log('✅ MongoDB Connected');
}

// ================== LOGS ==================
const logFilePath = path.join(__dirname, 'ruptela_hex.log');
const hexLogStream = fs.createWriteStream(logFilePath, { flags: 'a' });

const imeiLogPath = path.join(__dirname, 'ruptela_imei.log');
const imeiLogStream = fs.createWriteStream(imeiLogPath, { flags: 'a' });

// ✅ SOS LOG FILE
const sosLogPath = path.join(__dirname, 'sos.log');
const sosLogStream = fs.createWriteStream(sosLogPath, { flags: 'a' });


async function updateVehicleHeartbeat(imei) {
  try {
    const now = Date.now();
    const last = lastHeartbeatMap.get(imei) || 0;

    // prevent too many DB writes
    if (now - last < 5000) return;

    lastHeartbeatMap.set(imei, now);

    await vehiclesCollection.updateOne(
      { deviceId: imei },
      {
        $set: {
          live: true,
          lastSeen: new Date()
        }
      }
    );
  } catch (err) {
    console.error("❌ Heartbeat error:", err.message);
  }
}


// ================== CRC ==================
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

// ================== IMEI ==================
function parseIMEI(buffer) {
  try {
    return BigInt('0x' + buffer.toString('hex')).toString();
  } catch {
    return null;
  }
}

// ================== GPS VALIDATION ==================
function isValidGPS(record) {
  return !(
    record.latitude === -214.7483648 ||
    record.longitude === -214.7483648 ||
    record.speed === 65535 ||
    record.latitude === 0 ||
    record.longitude === 0
  );
}

// ================== IO PARSER ==================
function parseIO(payload, offset) {
  let ignition = false;
  let sos = false; // ✅ ADD

  function safeRead(size) {
    if (offset + size > payload.length) {
      throw new Error("IO overflow");
    }
  }

  // 1 BYTE IO VALUES
  safeRead(1);
  const io1Count = payload.readUInt8(offset++);
  for (let i = 0; i < io1Count; i++) {
    safeRead(3);

    const id = payload.readUInt16BE(offset); offset += 2;
    const value = payload.readUInt8(offset++);

    console.log("🔌 IO DEBUG → ID:", id, "Value:", value);

    // 🔥 IGNITION
    if (id === 409) {
      ignition = value > 0;
    }

    // 🚨 SOS (DIN5)
    if (id === 988 && value === 1) {
      sos = true;

      console.log("🚨 SOS BUTTON PRESSED (DIN5 HIGH)");

      sosLogStream.write(
        `[${new Date().toISOString()}] SOS SIGNAL → ID: ${id}, Value: ${value}\n`
      );
    }
  }

  // 2 BYTE IO
  safeRead(1);
  const io2Count = payload.readUInt8(offset++);
  for (let i = 0; i < io2Count; i++) {
    safeRead(4);
    offset += 2;
    offset += 2;
  }

  // 4 BYTE IO
  safeRead(1);
  const io4Count = payload.readUInt8(offset++);
  for (let i = 0; i < io4Count; i++) {
    safeRead(6);
    offset += 2;
    offset += 4;
  }

  // 8 BYTE IO
  safeRead(1);
  const io8Count = payload.readUInt8(offset++);
  for (let i = 0; i < io8Count; i++) {
    safeRead(10);
    offset += 2;
    offset += 8;
  }

  return { offset, ignition, sos }; // ✅ RETURN SOS
}

// ================== SAVE TO DB ==================
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

    await locationsCollection.insertOne(doc);
    console.log('💾 Location saved');

  } catch (err) {
    console.error('❌ DB Error:', err.message);
  }
}

// ================== RECORD PARSER ==================
async function parseRecords(payload, imei) {
  let offset = 0;

  const recordsLeft = payload.readUInt8(offset++);
  const recordCount = payload.readUInt8(offset++);

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

      const record = {
        time: date,
        latitude,
        longitude,
        speed,
        angle,
        ignition: ioResult.ignition,
        sos: ioResult.sos // ✅ ADD
      };

      console.log("📡 Record:", record);

      // 🚨 SOS API CALL
      if (record.sos) {
        const device = await devicesCollection.findOne({
          imei: imei.trim()
        });

        if (device && device.linkedVehicleId) {
          console.log("🚨 CALLING SOS API...");

          sosLogStream.write(
            `[${new Date().toISOString()}] CALLING SOS API → ${device.linkedVehicleId}\n`
          );

          try {
            await axios.post(
              "https://dagger-luminance-gentile.ngrok-free.dev/api/sos/create",
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

    // ❌ Skip invalid GPS
if (!isValidGPS(record)) {
  console.log("⚠️ Skipping invalid GPS data");
  continue;
}

// ✅ ADD THIS LINE ONLY
await updateVehicleHeartbeat(imei);




await saveToDB(imei, record);

    } catch (err) {
      console.error('❌ Record error:', err.message);
      break;
    }
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
// ================== TCP SERVER ==================
const server = net.createServer((socket) => {
  let tcpBuffer = Buffer.alloc(0);
  let deviceIMEI = null;

  socket.on('data', async (data) => {
    tcpBuffer = Buffer.concat([tcpBuffer, data]);

    hexLogStream.write(data.toString('hex') + '\n');

    while (tcpBuffer.length >= 2) {
      const packetLength = tcpBuffer.readUInt16BE(0);
      const totalSize = 2 + packetLength + 2;

      if (tcpBuffer.length < totalSize) break;

      const packet = tcpBuffer.subarray(0, totalSize);
      tcpBuffer = tcpBuffer.subarray(totalSize);

      const dataForCrc = packet.subarray(2, packet.length - 2);
      const receivedCrc = packet.readUInt16BE(packet.length - 2);

      if (crc16(dataForCrc) !== receivedCrc) {
        console.log('⚠️ CRC mismatch');
        continue;
      }

      const imei = parseIMEI(packet.subarray(2, 10));
      const commandId = packet.readUInt8(10);
      const payload = packet.subarray(11, packet.length - 2);

      if (!deviceIMEI) {
        deviceIMEI = imei;
        imeiLogStream.write(`${imei}\n`);
      }

      switch (commandId) {
        case 0x44:
          await parseRecords(payload, imei);
          socket.write(Buffer.from('0002640113BC', 'hex'));
          break;

        case 0x12:
          socket.write(Buffer.from('00027301CB25', 'hex'));
          break;

        case 0x10:
          socket.write(Buffer.from('00027401862D', 'hex'));
          break;
      }
    }
  });
});

// ================== START ==================
initDB().then(() => {
    startLiveStatusJob();
  server.listen(11000, () => {
    console.log('🚀 Server running on port 11000');
  });
})