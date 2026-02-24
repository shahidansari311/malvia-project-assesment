export const sortPanna = (panna) => {
  if (!panna || typeof panna !== "string") return panna;

  return panna
    .split("")
    .sort((a, b) => {
      const valA = a === "0" ? 10 : parseInt(a, 10);
      const valB = b === "0" ? 10 : parseInt(b, 10);
      return valA - valB;
    })
    .join("");
};

export const getPannaType = (panna) => {
  if (!/^\d{3}$/.test(panna)) return null;
  const digits = panna.split("");
  const uniqueCount = new Set(digits).size;

  if (uniqueCount === 1) return "Triple Panna";
  if (uniqueCount === 2) return "Double Panna";
  return "Single Panna";
};
