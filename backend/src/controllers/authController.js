const jwt = require("jsonwebtoken");
const supabase = require("../config/db");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: "30d",
  });
};

// @desc    Register user (OTP-based, simplified)
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  const { mobile, name } = req.body;

  if (!mobile || mobile.length !== 10 || !/^\d{10}$/.test(mobile)) {
    return res
      .status(400)
      .json({ error: "Enter a valid 10-digit mobile number" });
  }

  try {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("mobile", mobile)
      .maybeSingle();

    if (existing) {
      return res
        .status(409)
        .json({ error: "This number is already registered. Please login." });
    }

    const { data: user, error } = await supabase
      .from("users")
      .insert({ mobile, name: name || null })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      id: user.id,
      mobile: user.mobile,
      name: user.name,
      is_admin: user.is_admin,
      wallet_balance: user.wallet_balance,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

// @desc    Login user (OTP based simplified)
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    return res.status(400).json({ error: "Mobile and OTP are required" });
  }

  // In production, verify OTP with Twilio/MSG91
  // For now, using '123456' as master OTP
  if (otp !== "123456") {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  try {
    let { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("mobile", mobile)
      .maybeSingle();

    if (!user) {
      // Auto-register on first login
      const { data: newUser, error } = await supabase
        .from("users")
        .insert({ mobile })
        .select()
        .single();
      if (error) throw error;
      user = newUser;
    }

    res.json({
      id: user.id,
      mobile: user.mobile,
      name: user.name || null,
      is_admin: user.is_admin,
      wallet_balance: user.wallet_balance,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
const getUserProfile = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, mobile, name, wallet_balance, is_admin, created_at")
      .eq("id", req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

module.exports = { registerUser, loginUser, getUserProfile };
