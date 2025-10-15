const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");

const config = require("./config");
const uploadRoute = require("./modules/upload/upload.route");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");

function createServer() {
  const app = express();

  app.use(helmet());
  if (config.NODE_ENV === "development") {
    app.use(morgan("dev"));
  } else {
    app.use(morgan("combined"));
  }

  app.use(express.json());
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 300,
    })
  );

  app.get("/healthz", (req, res) => res.json({ status: "ok" }));

  app.use("/upload", uploadRoute);

  app.get("/", (req, res) => {
    res.send(
      "Server Running on port 3000"
    );
  });
  
  app.use(errorHandler);

  return app;
}

module.exports = { createServer };
