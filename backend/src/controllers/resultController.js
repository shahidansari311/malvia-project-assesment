const supabase = require("../config/db");

// @desc    Declare market result and settle bets
// @route   POST /api/admin/declare-result
const declareResult = async (req, res) => {
  const { marketId, marketDate, winningNumber } = req.body;

  if (!marketId || !marketDate || !winningNumber) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // 1. Upsert result
    const { error: resultErr } = await supabase.from("results").upsert(
      {
        market_id: marketId,
        market_date: marketDate,
        winning_number: winningNumber,
      },
      { onConflict: "market_id,market_date" },
    );

    if (resultErr) throw resultErr;

    // 2. Fetch all pending bets for this market and date
    const { data: bets, error: betsErr } = await supabase
      .from("bets")
      .select("*")
      .eq("market_id", marketId)
      .eq("market_date", marketDate)
      .eq("status", "pending");

    if (betsErr) throw betsErr;

    // Split winning number (e.g., '123-6' -> panna=123, digit=6)
    const [winPanna, winDigit] = winningNumber.includes("-")
      ? winningNumber.split("-")
      : [null, winningNumber];

    let settledCount = 0;
    let totalPayout = 0;

    for (const bet of bets) {
      let isWin = false;
      let multiplier = 0;

      // Settlement Logic based on Panna rules
      if (
        bet.bet_type === "single" &&
        winDigit &&
        bet.bet_number === winDigit
      ) {
        isWin = true;
        multiplier = 9;
      } else if (bet.bet_type === "jodi" && bet.bet_number === winningNumber) {
        isWin = true;
        multiplier = 90;
      } else if (
        bet.bet_type.includes("panna") &&
        winPanna &&
        bet.bet_number === winPanna
      ) {
        isWin = true;
        if (bet.bet_type === "single_panna") multiplier = 140;
        else if (bet.bet_type === "double_panna") multiplier = 270;
        else if (bet.bet_type === "triple_panna") multiplier = 600;
      }

      if (isWin) {
        const winAmount = parseFloat(bet.amount) * multiplier;
        totalPayout += winAmount;

        // Update bet to won
        await supabase.from("bets").update({ status: "won" }).eq("id", bet.id);

        // Credit wallet (increment)
        const { data: userRow } = await supabase
          .from("users")
          .select("wallet_balance")
          .eq("id", bet.user_id)
          .single();

        if (userRow) {
          const newBal = parseFloat(userRow.wallet_balance) + winAmount;
          await supabase
            .from("users")
            .update({ wallet_balance: newBal })
            .eq("id", bet.user_id);
        }

        // Record credit transaction
        await supabase.from("wallet_transactions").insert({
          user_id: bet.user_id,
          amount: winAmount,
          type: "credit",
          description: `Won ${bet.bet_type} on market ${marketId} — ${winningNumber}`,
        });
      } else {
        await supabase.from("bets").update({ status: "lost" }).eq("id", bet.id);
      }

      settledCount++;
    }

    res.json({
      message: "Result declared and bets settled successfully",
      settledBets: settledCount,
      totalPayout,
    });
  } catch (error) {
    console.error("declareResult error:", error);
    res.status(500).json({ error: "Failed to declare result" });
  }
};

// @desc    Get recent results
// @route   GET /api/admin/results
const getResults = async (req, res) => {
  try {
    const { data: results, error } = await supabase
      .from("results")
      .select(
        `
        id, market_date, winning_number, created_at,
        markets (name)
      `,
      )
      .order("market_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw error;

    const flat = results.map((r) => ({
      id: r.id,
      market_date: r.market_date,
      winning_number: r.winning_number,
      created_at: r.created_at,
      market_name: r.markets?.name,
    }));

    res.json(flat);
  } catch (error) {
    console.error("getResults error:", error);
    res.status(500).json({ error: "Failed to fetch results" });
  }
};

module.exports = { declareResult, getResults };
