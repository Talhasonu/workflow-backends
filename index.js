const mongoose = require("mongoose");
const { createServer } = require("http");
const { Server } = require("socket.io");
const app = require("./app.js");
const config = require("./src/config/config.js");

// Connect to MongoDB
mongoose
  .connect(config.mongoose.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// For local development and socket support
if (require.main === module) {
  const PORT = config.port || 5000;
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", socket.id, reason);
    });
  });

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
