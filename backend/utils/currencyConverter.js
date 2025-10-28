const Converter = require('currency-converter-lt');

/**
 * Convert an amount from one currency to another.  If the conversion
 * fails or the currencies are equal, the original amount is returned.
 *
 * @param {number} amount
 * @param {string} fromCurrency
 * @param {string} toCurrency
 * @returns {Promise<number>}
 */
async function convertCurrency(amount, fromCurrency, toCurrency) {
  if (!amount || fromCurrency === toCurrency) return amount;
  try {
    const converter = new Converter({ from: fromCurrency, to: toCurrency, amount });
    const result = await converter.convert();
    return Number(result);
  } catch (error) {
    console.error('Currency conversion error:', error);
    return amount;
  }
}

module.exports = { convertCurrency };
