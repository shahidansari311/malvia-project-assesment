const supabase = require("../config/db");
const { sortPanna } = require("../utils/pannaLogic");

const placeBet = async (req, res) => {
  const { marketId, betType, betNumber, amount } = req.body;
  const userId = req.user.id;

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!marketId || !betType || betNumber === undefined || !amount) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: "Invalid bet amount" });
  }

  const validTypes = [
    "single",
    "jodi",
    "single_panna",
    "double_panna",
    "triple_panna",
  ];
  if (!validTypes.includes(betType)) {
    return res.status(400).json({ error: "Invalid bet type" });
  }

  // ── Panna normalization ─────────────────────────────────────────────────────
  let finalBetNumber = String(betNumber);
  if (betType.includes("panna")) {
    finalBetNumber = sortPanna(finalBetNumber);
  }

  try {
    // 1. Check market is active and open
    const { data: market, error: marketErr } = await supabase
      .from("markets")
      .select("open_time, close_time")
      .eq("id", marketId)
      .eq("is_active", true)
      .single();

    if (marketErr || !market) {
      return res.status(400).json({ error: "Market not found or inactive" });
    }

    const now = new Date();
    const currentTime = now.toTimeString().split(" ")[0]; // HH:MM:SS

    if (currentTime < market.open_time || currentTime > market.close_time) {
      return res.status(400).json({ error: "Market is currently closed" });
    }

    // 2. Fetch user wallet balance
    const { data: userRow, error: userErr } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", userId)
      .single();

    if (userErr || !userRow) {
      return res.status(400).json({ error: "User not found" });
    }

    const currentBalance = parseFloat(userRow.wallet_balance);
    if (currentBalance < parsedAmount) {
      return res.status(400).json({ error: "Insufficient wallet balance" });
    }

    // 3. Deduct balance
    const newBalance = currentBalance - parsedAmount;
    const { error: balErr } = await supabase
      .from("users")
      .update({ wallet_balance: newBalance })
      .eq("id", userId);

    if (balErr) throw balErr;

    // 4. Record debit transaction
    const { error: txErr } = await supabase.from("wallet_transactions").insert({
      user_id: userId,
      amount: parsedAmount,
      type: "debit",
      description: `Bet placed on ${betType} (${finalBetNumber})`,
    });

    if (txErr) throw txErr;

    // 5. Place bet
    const { data: bet, error: betErr } = await supabase
      .from("bets")
      .insert({
        user_id: userId,
        market_id: marketId,
        bet_type: betType,
        bet_number: finalBetNumber,
        amount: parsedAmount,
        status: "pending",
      })
      .select()
      .single();

    if (betErr) throw betErr;

    res.status(201).json({
      message: "Bet placed successfully",
      bet,
      newBalance,
    });
  } catch (error) {
    console.error("Bet Error:", error.message);
    res.status(400).json({ error: error.message || "Failed to place bet" });
  }
};

const getLiveBets = async (req, res) => {
  try {
    const { data: bets, error } = await supabase
      .from("bets")
      .select(
        `
        id, bet_type, bet_number, amount, status, created_at,
        users (mobile),
        markets (name)
      `,
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    // Flatten joined data to match old API shape
    const flat = bets.map((b) => ({
      id: b.id,
      bet_type: b.bet_type,
      bet_number: b.bet_number,
      amount: b.amount,
      status: b.status,
      created_at: b.created_at,
      mobile: b.users?.mobile,
      market_name: b.markets?.name,
    }));

    res.json(flat);
  } catch (error) {
    console.error("getLiveBets error:", error);
    res.status(500).json({ error: "Failed to fetch bets" });
  }
};

const getUserBets = async (req, res) => {
  try {
    const { data: bets, error } = await supabase
      .from("bets")
      .select(
        `
        id, bet_type, bet_number, amount, status, market_date, created_at,
        markets (name)
      `,
      )
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    const flat = bets.map((b) => ({
      id: b.id,
      bet_type: b.bet_type,
      bet_number: b.bet_number,
      amount: b.amount,
      status: b.status,
      market_date: b.market_date,
      created_at: b.created_at,
      market_name: b.markets?.name,
    }));

    res.json(flat);
  } catch (error) {
    console.error("getUserBets error:", error);
    res.status(500).json({ error: "Failed to fetch bets" });
  }
};

module.exports = { placeBet, getLiveBets, getUserBets };
