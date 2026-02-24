const jwt = require("jsonwebtoken");
const supabase = require("../config/db");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authorized, no token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret",
    );

    const { data: user, error } = await supabase
      .from("users")
      .select("id, mobile, is_admin")
      .eq("id", decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: "Not authorized, user not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res.status(401).json({ error: "Not authorized, token failed" });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.is_admin) {
    next();
  } else {
    res.status(403).json({ error: "Not authorized as an admin" });
  }
};

module.exports = { protect, admin };
