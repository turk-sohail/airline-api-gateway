const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const app = express();
const morgan = require("morgan");
const PORT = process.env.PORT;
const { createProxyMiddleware } = require("http-proxy-middleware");
const { rateLimit } = require("express-rate-limit");
const axios = require("axios");

const limiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 15 minutes
  limit: 5, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
});

// Apply the rate limiting middleware to all requests.
app.use(limiter);
app.use(morgan("combined"));

app.use("/bookingservice", async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Authorization header missing or malformed" });
  }

  // Extract the token
  const token = authHeader.split(" ")[1]; // Get the part after "Bearer "

  try {
    const response = await axios.get(
      "http://localhost:3001/api/v1/isAuthenticated",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(response.data);
    if (response.data.success) {
      next();
    } else {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
});
/**
 * reverse proxy
 */

app.use(
  "/bookingservice",
  createProxyMiddleware({ target: "http://localhost:3002", changeOrigin: true })
);

////////*********end */
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
