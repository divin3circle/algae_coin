import {
  ContractExecuteTransaction,
  AccountAllowanceApproveTransaction,
  TokenAssociateTransaction,
  AccountId,
  PrivateKey,
  Hbar,
  EvmAddress,
  Client,
  ContractId,
  ContractCallQuery,
  ContractFunctionParameters,
  TransferTransaction,
  AccountBalanceQuery,
} from "@hashgraph/sdk";
import * as ethers from "ethers";
import "dotenv/config";

// Helper function to convert token ID to EVM address
function tokenIdToEvmAddress(tokenId) {
  // Remove the '0.0.' prefix and convert to hex
  const numericId = tokenId.split(".")[2];
  // Ensure exactly 40 characters (20 bytes) for the address
  const hexId = parseInt(numericId).toString(16).toLowerCase();
  return `0x${hexId.padStart(40, "0")}`;
}

// Helper function to convert hex string to Uint8Array
function hexToUint8Array(hexString) {
  const hex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Get token balance for a specific account
 * @param {Client} client - Hedera client instance
 * @param {string} accountId - Account ID to check balance for
 * @param {string} tokenId - Token ID to check balance of
 * @returns {Promise<number>} Token balance
 */
async function getTokenBalance(client, accountId, tokenId) {
  try {
    const balanceQuery = new AccountBalanceQuery().setAccountId(accountId);
    const balance = await balanceQuery.execute(client);

    const tokenBalance = balance.tokens.get(tokenId);
    return tokenBalance ? tokenBalance.toNumber() : 0;
  } catch (error) {
    console.error(`Error getting balance for token ${tokenId}:`, error);
    return 0;
  }
}

/**
 * Transfer tokens between accounts
 * @param {Client} client - Hedera client instance
 * @param {string} fromAccountId - Sender account ID
 * @param {PrivateKey} fromPrivateKey - Sender private key
 * @param {string} toAccountId - Recipient account ID
 * @param {string} tokenId - Token ID to transfer
 * @param {number} amount - Amount to transfer
 * @returns {Promise<Object>} Transfer receipt
 */
async function transferTokens(
  client,
  fromAccountId,
  fromPrivateKey,
  toAccountId,
  tokenId,
  amount
) {
  try {
    console.log(
      `Transferring ${amount} of token ${tokenId} from ${fromAccountId} to ${toAccountId}...`
    );

    const transferTx = new TransferTransaction()
      .addTokenTransfer(tokenId, fromAccountId, -amount)
      .addTokenTransfer(tokenId, toAccountId, amount);

    const signedTx = await transferTx.freezeWith(client).sign(fromPrivateKey);
    const response = await signedTx.execute(client);
    const receipt = await response.getReceipt(client);

    console.log(`Transfer status: ${receipt.status}`);
    return receipt;
  } catch (error) {
    console.error("Error transferring tokens:", error);
    throw error;
  }
}

/**
 * Calculate exchange rate based on pool reserves using constant product formula
 * @param {number} inputAmount - Amount of input tokens
 * @param {number} inputReserve - Pool reserve of input token
 * @param {number} outputReserve - Pool reserve of output token
 * @param {number} feePercent - Fee percentage (default 0.3%)
 * @returns {number} Amount of output tokens
 */
function calculateSwapOutput(
  inputAmount,
  inputReserve,
  outputReserve,
  feePercent = 0.3
) {
  // Apply fee to input amount
  const inputAmountWithFee = (inputAmount * (100 - feePercent)) / 100;

  // Constant product formula: (x + Δx) * (y - Δy) = x * y
  // Solving for Δy: Δy = (y * Δx) / (x + Δx)
  const outputAmount =
    (outputReserve * inputAmountWithFee) / (inputReserve + inputAmountWithFee);

  return Math.floor(outputAmount);
}

/**
 * Real swap implementation using main account as liquidity pool
 * @param {Client} client - Hedera client instance
 * @param {string} userAccountId - User's account ID
 * @param {PrivateKey} userPrivateKey - User's private key
 * @param {number} amount - Amount of ALGAE tokens to swap
 * @returns {Promise<Object>} Swap result
 */
async function realSwapAlgaeForKsh(
  client,
  userAccountId,
  userPrivateKey,
  amount
) {
  const mainAccountId = process.env.ACCOUNT_ID;
  const mainPrivateKey = PrivateKey.fromStringDer(process.env.PRIVATE_KEY);
  const algaeTokenId = process.env.ALGAE_TOKEN_ID;
  const kshTokenId = process.env.KSH_TOKEN_ID;

  try {
    console.log("=== REAL SWAP: ALGAE → KSH ===");
    console.log(`User: ${userAccountId}`);
    console.log(`Amount: ${amount} ALGAE`);

    // Step 1: Check user's ALGAE balance
    const userAlgaeBalance = await getTokenBalance(
      client,
      userAccountId,
      algaeTokenId
    );
    console.log(`User ALGAE balance: ${userAlgaeBalance}`);

    if (userAlgaeBalance < amount) {
      throw new Error(
        `Insufficient ALGAE balance. User has ${userAlgaeBalance}, needs ${amount}`
      );
    }

    // Step 2: Get current pool balances before swap
    const poolAlgaeBalance = await getTokenBalance(
      client,
      mainAccountId,
      algaeTokenId
    );
    const poolKshBalance = await getTokenBalance(
      client,
      mainAccountId,
      kshTokenId
    );

    console.log(`Pool ALGAE balance: ${poolAlgaeBalance}`);
    console.log(`Pool KSH balance: ${poolKshBalance}`);

    // Step 3: Calculate expected KSH output
    const expectedKshOutput = calculateSwapOutput(
      amount,
      poolAlgaeBalance,
      poolKshBalance
    );
    console.log(`Expected KSH output: ${expectedKshOutput}`);

    if (expectedKshOutput <= 0) {
      throw new Error("Insufficient liquidity for this swap");
    }

    if (poolKshBalance < expectedKshOutput) {
      throw new Error(
        `Insufficient KSH in pool. Pool has ${poolKshBalance}, needs ${expectedKshOutput}`
      );
    }

    // Step 4: Transfer ALGAE from user to pool
    console.log("Transferring ALGAE from user to pool...");
    await transferTokens(
      client,
      userAccountId,
      userPrivateKey,
      mainAccountId,
      algaeTokenId,
      amount
    );

    // Step 5: Transfer KSH from pool to user
    console.log("Transferring KSH from pool to user...");
    await transferTokens(
      client,
      mainAccountId,
      mainPrivateKey,
      userAccountId,
      kshTokenId,
      expectedKshOutput
    );

    // Step 6: Verify final balances
    const finalUserAlgaeBalance = await getTokenBalance(
      client,
      userAccountId,
      algaeTokenId
    );
    const finalUserKshBalance = await getTokenBalance(
      client,
      userAccountId,
      kshTokenId
    );
    const finalPoolAlgaeBalance = await getTokenBalance(
      client,
      mainAccountId,
      algaeTokenId
    );
    const finalPoolKshBalance = await getTokenBalance(
      client,
      mainAccountId,
      kshTokenId
    );

    console.log("=== SWAP COMPLETED ===");
    console.log(
      `User ALGAE: ${userAlgaeBalance} → ${finalUserAlgaeBalance} (${
        finalUserAlgaeBalance - userAlgaeBalance
      })`
    );
    console.log(
      `User KSH: ${
        finalUserKshBalance - expectedKshOutput
      } → ${finalUserKshBalance} (+${expectedKshOutput})`
    );
    console.log(
      `Pool ALGAE: ${poolAlgaeBalance} → ${finalPoolAlgaeBalance} (+${amount})`
    );
    console.log(
      `Pool KSH: ${poolKshBalance} → ${finalPoolKshBalance} (-${expectedKshOutput})`
    );

    return {
      inputAmount: amount.toString(),
      outputAmount: expectedKshOutput.toString(),
      transactionId: `algae-ksh-swap-${Date.now()}`,
      success: true,
      exchangeRate: (expectedKshOutput / amount).toFixed(6),
      poolBalances: {
        algae: finalPoolAlgaeBalance,
        ksh: finalPoolKshBalance,
      },
    };
  } catch (error) {
    console.error("Error in real swap:", error);
    throw error;
  }
}

// Real swap implementation using your pool contract
async function directSwap(
  client,
  fromTokenId,
  toTokenId,
  amount,
  userAccountId,
  userPrivateKey
) {
  try {
    console.log(`Performing real swap of ${amount} tokens...`);

    // Use the real swap implementation
    return await realSwapAlgaeForKsh(
      client,
      userAccountId,
      userPrivateKey,
      amount
    );
  } catch (error) {
    console.error("Error in swap:", error);
    throw error;
  }
}

/**
 * Helper function to associate tokens if needed
 * @param {Client} client - Hedera client instance
 * @param {string} accountId - Account ID to associate token with
 * @param {PrivateKey} privateKey - Private key of the account
 * @param {string} tokenId - Token ID to associate
 * @returns {Object} Receipt of the association transaction
 */
async function associateTokenToAccount(client, accountId, privateKey, tokenId) {
  try {
    console.log(`Associating token ${tokenId} with account ${accountId}...`);

    const transaction = new TokenAssociateTransaction()
      .setAccountId(accountId)
      .setTokenIds([tokenId]);

    const signedTx = await transaction.freezeWith(client).sign(privateKey);
    const response = await signedTx.execute(client);
    const receipt = await response.getReceipt(client);

    console.log(`Token association status: ${receipt.status}`);
    return receipt;
  } catch (error) {
    console.error("Error associating token:", error);
    throw error;
  }
}

/**
 * Helper function to approve allowance for router contract
 * @param {Client} client - Hedera client instance
 * @param {string} accountId - Account ID approving the allowance
 * @param {PrivateKey} privateKey - Private key of the account
 * @param {string} tokenId - Token ID to approve
 * @param {string} routerAddress - Router contract address
 * @param {number} amount - Amount to approve
 * @returns {Object} Receipt of the approval transaction
 */
async function approveAllowance(
  client,
  accountId,
  privateKey,
  tokenId,
  routerAddress,
  amount
) {
  try {
    console.log(
      `Approving ${amount} of token ${tokenId} for router ${routerAddress}...`
    );

    const transaction =
      new AccountAllowanceApproveTransaction().approveTokenAllowance(
        tokenId,
        accountId,
        routerAddress,
        amount
      );

    const signedTx = await transaction.freezeWith(client).sign(privateKey);
    const response = await signedTx.execute(client);
    const receipt = await response.getReceipt(client);

    console.log(`Allowance approval status: ${receipt.status}`);
    return receipt;
  } catch (error) {
    console.error("Error approving allowance:", error);
    throw error;
  }
}

export default async function swapAlgaeForKsh(
  userAccountId,
  userPrivateKey,
  amount
) {
  let client;
  try {
    const hederaAccountId = AccountId.fromString(userAccountId);
    const hederaPrivateKey = PrivateKey.fromStringDer(userPrivateKey);

    client = Client.forTestnet();
    client.setOperator(hederaAccountId, hederaPrivateKey);

    console.log("=== REAL TOKEN SWAP MODE ===");
    console.log("Using main account as liquidity pool");

    // Use real swap implementation
    const swapResult = await realSwapAlgaeForKsh(
      client,
      userAccountId,
      hederaPrivateKey,
      amount
    );

    console.log("Swap result:", swapResult);
    return swapResult;
  } catch (error) {
    console.log("Error:", error.message);
    return { success: false, error: error.message };
  } finally {
    if (client) {
      client.close();
    }
  }
}

// Export the real swap function and utilities
export {
  realSwapAlgaeForKsh,
  transferTokens,
  getTokenBalance,
  calculateSwapOutput,
  associateTokenToAccount,
  approveAllowance,
};
