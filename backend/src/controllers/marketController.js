const supabase = require("../config/db");

const getMarkets = async (req, res) => {
  try {
    const { data: markets, error } = await supabase
      .from("markets")
      .select("*")
      .eq("is_active", true)
      .order("open_time", { ascending: true });

    if (error) throw error;

    // Add dynamic status based on current time in Indian Standard Time (IST)
    const now = new Date();
    // Using en-GB to get HH:MM:SS format without AM/PM
    const currentTime = now.toLocaleTimeString("en-GB", {
      timeZone: "Asia/Kolkata",
      hour12: false,
    });

    const processedMarkets = markets.map((m) => {
      const { open_time: open, close_time: close } = m;
      let isOpen = false;

      if (open <= close) {
        // Standard case: 09:00 to 12:00
        isOpen = currentTime >= open && currentTime <= close;
      } else {
        // Overnight case: 22:00 to 02:00
        isOpen = currentTime >= open || currentTime <= close;
      }

      return { ...m, status: isOpen ? "open" : "closed" };
    });

    res.json(processedMarkets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch markets" });
  }
};

const updateMarketTimings = async (req, res) => {
  const { id, openTime, closeTime } = req.body;
  try {
    const { data, error } = await supabase
      .from("markets")
      .update({ open_time: openTime, close_time: closeTime })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to update market" });
  }
};

module.exports = { getMarkets, updateMarketTimings };
