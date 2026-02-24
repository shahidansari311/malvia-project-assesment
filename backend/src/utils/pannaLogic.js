/**
 * Panna Sorting Logic: 0 is the greatest digit (10)
 * Order: 1 < 2 < 3 < 4 < 5 < 6 < 7 < 8 < 9 < 0
 */
const sortPanna = (panna) => {
  if (!panna || typeof panna !== 'string') return panna;
  
  return panna
    .split('')
    .sort((a, b) => {
      const valA = a === '0' ? 10 : parseInt(a, 10);
      const valB = b === '0' ? 10 : parseInt(b, 10);
      return valA - valB;
    })
    .join('');
};

/**
 * Validates if the input is a valid Panna (3 digits)
 * Single Panna: 3 unique digits
 * Double Panna: 2 digits same
 * Triple Panna: 3 digits same
 */
const isValidPanna = (panna) => {
  return /^\d{3}$/.test(panna);
};

module.exports = {
  sortPanna,
  isValidPanna
};
