// Unified swap module for ALGAE <-> KSH token swaps
import swapAlgaeForKsh from "./swapAlgaeKsh.js";
import swapKshForAlgae from "./swapKshAlgae.js";

/**
 * Swap ALGAE tokens for KSH tokens
 * @param {string} userAccountId - User's Hedera account ID (e.g., "0.0.1234567")
 * @param {string} userPrivateKey - User's private key in DER format
 * @param {number} amount - Amount of ALGAE tokens to swap
 * @returns {Promise<Object>} Swap result with inputAmount, outputAmount, transactionId, success
 */
export async function swapAlgaeToKsh(userAccountId, userPrivateKey, amount) {
  return await swapAlgaeForKsh(userAccountId, userPrivateKey, amount);
}

/**
 * Swap KSH tokens for ALGAE tokens
 * @param {string} userAccountId - User's Hedera account ID (e.g., "0.0.1234567")
 * @param {string} userPrivateKey - User's private key in DER format
 * @param {number} amount - Amount of KSH tokens to swap
 * @returns {Promise<Object>} Swap result with inputAmount, outputAmount, transactionId, success
 */
export async function swapKshToAlgae(userAccountId, userPrivateKey, amount) {
  return await swapKshForAlgae(userAccountId, userPrivateKey, amount);
}

/**
 * Generic swap function that can handle both directions
 * @param {string} fromToken - Either "ALGAE" or "KSH"
 * @param {string} toToken - Either "ALGAE" or "KSH"
 * @param {string} userAccountId - User's Hedera account ID
 * @param {string} userPrivateKey - User's private key in DER format
 * @param {number} amount - Amount of tokens to swap
 * @returns {Promise<Object>} Swap result
 */
export async function swapTokens(
  fromToken,
  toToken,
  userAccountId,
  userPrivateKey,
  amount
) {
  const fromTokenUpper = fromToken.toUpperCase();
  const toTokenUpper = toToken.toUpperCase();

  if (fromTokenUpper === "ALGAE" && toTokenUpper === "KSH") {
    return await swapAlgaeToKsh(userAccountId, userPrivateKey, amount);
  } else if (fromTokenUpper === "KSH" && toTokenUpper === "ALGAE") {
    return await swapKshToAlgae(userAccountId, userPrivateKey, amount);
  } else {
    throw new Error(
      `Unsupported swap pair: ${fromToken} -> ${toToken}. Only ALGAE <-> KSH swaps are supported.`
    );
  }
}

// Export individual functions as well
export { swapAlgaeForKsh, swapKshForAlgae };

// Default export for convenience
export default {
  swapAlgaeToKsh,
  swapKshToAlgae,
  swapTokens,
  swapAlgaeForKsh,
  swapKshForAlgae,
};
