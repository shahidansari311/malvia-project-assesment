const supabase = require("../config/db");

const getMarkets = async (req, res) => {
  try {
    const { data: markets, error } = await supabase
      .from("markets")
      .select("*")
      .eq("is_active", true)
      .order("open_time", { ascending: true });

    if (error) throw error;

    // Add dynamic status based on current time
    const now = new Date();
    const currentTime = now.toTimeString().split(" ")[0]; // HH:MM:SS

    const processedMarkets = markets.map((m) => {
      const isOpen = currentTime >= m.open_time && currentTime <= m.close_time;
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
