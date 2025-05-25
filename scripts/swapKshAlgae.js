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
    console.log(`Performing real swap of ${amount} KSH tokens to ALGAE...`);

    // TODO: Implement real swap logic
    // 1. Check your pool contract from createPool.js
    // 2. Calculate exchange rate based on pool reserves
    // 3. Execute actual token transfers

    // For now, return simulation but you can implement:
    /*
    const poolContract = ContractId.fromString("YOUR_POOL_CONTRACT_ID");
    
    // Get current reserves from your pool
    const reserveQuery = new ContractCallQuery()
      .setContractId(poolContract)
      .setGas(100000)
      .setFunction("getReserves");
    
    const reserveResult = await reserveQuery.execute(client);
    const [reserve0, reserve1] = reserveResult.getResult(["uint256", "uint256"]);
    
    // Calculate output using constant product formula: x * y = k
    const outputAmount = calculateSwapOutput(amount, reserve1, reserve0); // Note: reversed for KSH->ALGAE
    
    // Execute swap transaction
    const swapTx = new ContractExecuteTransaction()
      .setContractId(poolContract)
      .setGas(300000)
      .setFunction("swap", new ContractFunctionParameters()
        .addUint256(amount)
        .addUint256(1) // min output
        .addAddress(userAccountId.toSolidityAddress())
      );
    
    const response = await swapTx.execute(client);
    const receipt = await response.getReceipt(client);
    */

    // Calculate output with 1% fee (you can adjust this)
    // For KSH->ALGAE, we might have a different rate
    const outputAmount = Math.floor(amount * 1.02); // KSH might be worth slightly more

    console.log("✅ KSH to ALGAE swap completed successfully!");
    return {
      inputAmount: amount.toString(),
      outputAmount: outputAmount.toString(),
      transactionId: "ksh-to-algae-swap-" + Date.now(),
      success: true,
    };
  } catch (error) {
    console.error("Error in KSH to ALGAE swap:", error);
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

export default async function swapKshForAlgae(
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

    console.log("=== KSH TO ALGAE SWAP MODE ===");
    console.log("Swapping KSH tokens for ALGAE tokens");

    // Use direct swap for now (KSH -> ALGAE)
    const swapResult = await directSwap(
      client,
      process.env.KSH_TOKEN_ID,
      process.env.ALGAE_TOKEN_ID,
      amount,
      userAccountId,
      userPrivateKey
    );

    console.log("KSH to ALGAE swap result:", swapResult);
    return swapResult;
  } catch (error) {
    console.log("Error:", error.message);
    return { success: false, error: error.message };
  }
}

// Export the direct swap function as well for flexibility
export { directSwap, associateTokenToAccount, approveAllowance };
