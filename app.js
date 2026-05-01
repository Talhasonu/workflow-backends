const express = require("express");
const passport = require("passport");
const { jwtStrategy } = require("./src/config/passport");
const cors = require("cors");
const registerRoutes = require("./src/routes/app.routes");
const config = require("./src/config/config");

const app = express();

// enable cors
const allowedOrigins = [
  "http://localhost:3000",
  ...(config.Frontend_URLs || []),
  config.backendUrl,
].filter(Boolean);

const corsOptions = {
  origin: true, // allow any origin and echo it back
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// normalize duplicate slashes in request paths
app.use((req, res, next) => {
  req.url = req.url.replace(/\/\/{2,}/g, "/");
  next();
});

// serve static files
app.use(express.static("public"));

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// jwt authentication
app.use(passport.initialize());
passport.use("jwt", jwtStrategy);

// root health endpoint for deployment checks
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Workflow backend is running",
  });
});

registerRoutes(app);

// catch unmatched routes
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found`,
  });
});

// global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
