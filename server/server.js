const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const { nanoid } = require("nanoid");
const { UAParser } = require("ua-parser-js");
const crypto = require("crypto");

dotenv.config({
  path: ".env.local",
});

const app = express();
const PORT = process.env.PORT || 5001;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

app.set("trust proxy", true);

/* =========================
   MIDDLEWARE
========================= */

app.use(
  cors({
    origin: frontendUrl.split(",").map((url) => url.trim()).filter(Boolean),
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());

if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set in production.");
}
const SESSION_SECRET = process.env.SESSION_SECRET || "development-session-secret-not-for-production";

function createToken(userId) {
  const payload = Buffer.from(JSON.stringify({ sub: userId, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })).toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function getToken(req) {
  const match = (req.headers.cookie || "").match(/(?:^|; )tracelink_session=([^;]+)/);
  return match ? match[1] : null;
}

function verifyToken(token) {
  if (!token || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.exp > Date.now() ? data : null;
  } catch { return null; }
}

function requireAuth(req, res, next) {
  const session = verifyToken(getToken(req));
  if (!session) return res.status(401).json({ success: false, message: "Please sign in to continue." });
  req.userId = session.sub;
  next();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  return new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (error, key) => {
    if (error) reject(error);
    else resolve(`${salt}:${key.toString("hex")}`);
  }));
}

async function passwordMatches(password, stored) {
  const [salt, key] = stored.split(":");
  const candidate = await hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(stored));
}

function setSession(res, userId) {
  res.setHeader("Set-Cookie", `tracelink_session=${createToken(userId)}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
}

/* =========================
   DATABASE
========================= */

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.error(
      "MongoDB connection failed:",
      error.message
    );
  });

/* =========================
   SCHEMAS
========================= */

const analyticsSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      default: "Unknown",
    },

    userAgent: {
      type: String,
      default: "Unknown",
    },

    browser: {
      type: String,
      default: "Unknown",
    },

    browserVersion: {
      type: String,
      default: "",
    },

    os: {
      type: String,
      default: "Unknown",
    },

    osVersion: {
      type: String,
      default: "",
    },

    device: {
      type: String,
      default: "Desktop",
    },

    referer: {
      type: String,
      default: "Direct",
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const linkSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
    },

    destination: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      default: "",
    },

    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    visits: {
      type: Number,
      default: 0,
    },

    analytics: {
      type: [analyticsSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Link = mongoose.model("Link", linkSchema);

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true });
const User = mongoose.model("User", userSchema);

/* =========================
   HEALTH CHECK
========================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TraceLink API is running",
  });
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
      return res.status(400).json({ success: false, message: "Enter your name, a valid email, and a password of at least 8 characters." });
    }
    if (await User.exists({ email })) return res.status(409).json({ success: false, message: "An account with this email already exists." });
    const user = await User.create({ name, email, passwordHash: await hashPassword(password) });
    setSession(res, user._id.toString());
    res.status(201).json({ success: true, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) { console.error("Signup error:", error); res.status(500).json({ success: false, message: "Could not create your account." }); }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await User.findOne({ email });
    if (!user || !(await passwordMatches(password, user.passwordHash))) return res.status(401).json({ success: false, message: "Incorrect email or password." });
    setSession(res, user._id.toString());
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) { console.error("Login error:", error); res.status(500).json({ success: false, message: "Could not sign you in." }); }
});

app.post("/api/auth/logout", (req, res) => { res.setHeader("Set-Cookie", "tracelink_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"); res.json({ success: true }); });
app.get("/api/auth/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).lean();
  if (!user) return res.status(401).json({ success: false, message: "Session has expired." });
  res.json({ success: true, user: { id: user._id, name: user.name, email: user.email } });
});

/* =========================
   CREATE LINK
========================= */

app.post("/api/links", requireAuth, async (req, res) => {
  try {
    const { destination, name } = req.body;

    if (!destination) {
      return res.status(400).json({
        success: false,
        message: "Destination URL is required",
      });
    }

    try {
      new URL(destination);
    } catch {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid URL",
      });
    }

    const slug = nanoid(7);

    const link = await Link.create({
      slug,
      destination,
      name: name || "",
      owner: req.userId,
    });

    console.log(
      `Created link: ${slug} → ${destination}`
    );

    res.status(201).json({
      success: true,
      link: {
        id: link._id,
        slug: link.slug,
        destination: link.destination,
        name: link.name,
        visits: link.visits,
        createdAt: link.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Create link error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Could not create link",
    });
  }
});

/* =========================
   TRACK VISIT
========================= */

app.get("/api/redirect/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const link = await Link.findOne({
      slug,
    });

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "TraceLink not found",
      });
    }

    /* =========================
       REQUEST DATA
    ========================= */

    const ip = req.ip || req.socket.remoteAddress || "Unknown";

    const userAgent =
      req.headers["user-agent"] ||
      "Unknown";

    const referer =
      req.headers["referer"] ||
      "Direct";

    /* =========================
       USER AGENT PARSING
    ========================= */

    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const browser =
      result.browser.name || "Unknown";

    const browserVersion =
      result.browser.version || "";

    const os =
      result.os.name || "Unknown";

    const osVersion =
      result.os.version || "";

    let device = "Desktop";

    if (result.device.type === "mobile") {
      device = "Mobile";
    } else if (result.device.type === "tablet") {
      device = "Tablet";
    }

    /* =========================
       SAVE ANALYTICS
    ========================= */

    link.visits += 1;

    link.analytics.push({
      ip,
      userAgent,
      browser,
      browserVersion,
      os,
      osVersion,
      device,
      referer,
      timestamp: new Date(),
    });

    await link.save();

    console.log(
      `Visit ${slug} | ${ip} | ${browser} | ${os} | ${device}`
    );

    /* =========================
       RETURN DESTINATION
    ========================= */

    return res.json({
      success: true,
      destination: link.destination,
    });
  } catch (error) {
    console.error(
      "Redirect tracking error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Could not process redirect",
    });
  }
});

/* =========================
   GET LINK ANALYTICS
========================= */

app.get(
  "/api/links/:slug",
  requireAuth,
  async (req, res) => {
    try {
      const link = await Link.findOne({
        slug: req.params.slug,
        owner: req.userId,
      }).lean();

      if (!link) {
        return res.status(404).json({
          success: false,
          message: "Link not found",
        });
      }

      res.json({
        success: true,
        link,
      });
    } catch (error) {
      console.error(
        "Analytics error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Could not fetch analytics",
      });
    }
  }
);
app.get("/api/links", requireAuth, async (req, res) => {
  try {
    const links = await Link.find({ owner: req.userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      links,
    });
  } catch (error) {
    console.error(
      "Fetch links error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Could not fetch links",
    });
  }
});

app.delete("/api/links/:slug", requireAuth, async (req, res) => {
  try {
    const link = await Link.findOneAndDelete({ slug: req.params.slug, owner: req.userId });
    if (!link) return res.status(404).json({ success: false, message: "Link not found." });
    res.json({ success: true });
  } catch (error) { console.error("Delete link error:", error); res.status(500).json({ success: false, message: "Could not delete link." }); }
});

app.post(
  "/api/dev/seed/:slug",
  async (req, res) => {
    try {
      if (
        process.env.ENABLE_SEED_DATA !== "true"
      ) {
        return res.status(403).json({
          success: false,
          message: "Seed endpoint disabled",
        });
      }

      const { slug } = req.params;

      const link = await Link.findOne({
        slug,
      });

      if (!link) {
        return res.status(404).json({
          success: false,
          message: "Link not found",
        });
      }

      const testVisits = [
        {
          ip: "103.21.44.10",
          userAgent:
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/153.0.0.0 Safari/537.36",
          referer: "https://www.google.com/",
          daysAgo: 0,
        },
        {
          ip: "103.21.44.11",
          userAgent:
            "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/18.6 Mobile/15E148 Safari/604.1",
          referer: "https://www.instagram.com/",
          daysAgo: 0,
        },
        {
          ip: "103.21.44.12",
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153.0.0.0 Safari/537.36",
          referer: "https://www.google.com/",
          daysAgo: 1,
        },
        {
          ip: "103.21.44.13",
          userAgent:
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/152.0.0.0 Safari/537.36",
          referer: "Direct",
          daysAgo: 1,
        },
        {
          ip: "103.21.44.14",
          userAgent:
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.6 Safari/605.1.15",
          referer: "https://twitter.com/",
          daysAgo: 2,
        },
        {
          ip: "103.21.44.15",
          userAgent:
            "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/153.0.0.0 Mobile Safari/537.36",
          referer: "https://www.google.com/",
          daysAgo: 2,
        },
        {
          ip: "103.21.44.16",
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Firefox/142.0",
          referer: "https://www.reddit.com/",
          daysAgo: 3,
        },
        {
          ip: "103.21.44.17",
          userAgent:
            "Mozilla/5.0 (iPad; CPU OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/18.6 Mobile/15E148 Safari/604.1",
          referer: "Direct",
          daysAgo: 3,
        },
        {
          ip: "103.21.44.18",
          userAgent:
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/153.0.0.0 Safari/537.36",
          referer: "https://www.google.com/",
          daysAgo: 4,
        },
        {
          ip: "103.21.44.19",
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153.0.0.0 Safari/537.36",
          referer: "https://www.linkedin.com/",
          daysAgo: 5,
        },
        {
          ip: "103.21.44.20",
          userAgent:
            "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/152.0.0.0 Mobile Safari/537.36",
          referer: "https://www.instagram.com/",
          daysAgo: 6,
        },
        {
          ip: "103.21.44.21",
          userAgent:
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.6 Safari/605.1.15",
          referer: "Direct",
          daysAgo: 7,
        },
      ];

      const analytics = testVisits.map(
        (visit) => {
          const parser = new UAParser(
            visit.userAgent
          );

          const result =
            parser.getResult();

          let device = "Desktop";

          if (
            result.device.type ===
            "mobile"
          ) {
            device = "Mobile";
          } else if (
            result.device.type ===
            "tablet"
          ) {
            device = "Tablet";
          }

          const timestamp =
            new Date();

          timestamp.setDate(
            timestamp.getDate() -
              visit.daysAgo
          );

          return {
            ip: visit.ip,
            userAgent:
              visit.userAgent,
            browser:
              result.browser.name ||
              "Unknown",
            browserVersion:
              result.browser.version ||
              "",
            os:
              result.os.name ||
              "Unknown",
            osVersion:
              result.os.version ||
              "",
            device,
            referer:
              visit.referer,
            timestamp,
          };
        }
      );

      link.analytics.push(
        ...analytics
      );

      link.visits =
        link.analytics.length;

      await link.save();

      res.json({
        success: true,
        message:
          "Development analytics seeded",
        added: analytics.length,
        totalVisits: link.visits,
      });
    } catch (error) {
      console.error(
        "Seed error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Could not seed analytics",
      });
    }
  }
);
/* =========================
   START SERVER
========================= */
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `TraceLink API running on port ${PORT}`
  );
});
