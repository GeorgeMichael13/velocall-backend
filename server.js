const express = require("express");
const http = require("http");
const { AccessToken } = require("livekit-server-sdk");
require('dotenv').config();

const app = express();
const server = http.createServer(app);

app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("✅ VeloCall LiveKit Server is running.");
});

// ====================== LIVEKIT TOKEN ENDPOINT ======================
app.post("/api/livekit-token", async (req, res) => {
  const { room, identity } = req.body || {};

  console.log("--- TOKEN REQUEST RECEIVED ---");
  console.log("Room:", room);
  console.log("Identity:", identity);
  console.log("API_KEY present:", !!process.env.LIVEKIT_API_KEY);
  console.log("API_SECRET present:", !!process.env.LIVEKIT_API_SECRET);
  console.log("-----------------------------");

  if (!room || !identity) {
    return res.status(400).json({ error: "room and identity are required" });
  }

  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
    console.error("❌ Missing LiveKit API keys!");
    return res.status(500).json({ 
      error: "Server keys not configured. Check Render Environment Variables." 
    });
  }

  try {
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity,
        name: identity,
        ttl: "60m",
      }
    );

    at.addGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    console.log(`✅ Token generated successfully for ${identity} in room ${room}`);
    console.log(`✅ Token length: ${token.length}`);

    // IMPORTANT: Return plain JWT string (this fixes the "Object" error)
    res.json(token);

  } catch (error) {
    console.error("❌ Token generation failed:", error.message);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 VeloCall Server LIVE on Port: ${PORT}`);
});
