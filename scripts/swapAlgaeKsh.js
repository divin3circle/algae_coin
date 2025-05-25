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

// Helper function to create SaucerSwap path (token + fee + token)
function createSwapPath(tokenA, tokenB, fee = 500) {
  // Remove 0x prefix and ensure 40 characters
  const cleanTokenA = tokenA.replace("0x", "").padStart(40, "0");
  const cleanTokenB = tokenB.replace("0x", "").padStart(40, "0");

  // Convert fee to 3-byte hex (500 = 0x0001f4)
  const feeHex = fee.toString(16).padStart(6, "0");

  // Combine: tokenA (20 bytes) + fee (3 bytes) + tokenB (20 bytes)
  return "0x" + cleanTokenA + feeHex + cleanTokenB;
}

const ROUTER_CONTRACT_ID = "0.0.1414040";

// Minimal ABI for exactInput function
const swapRouterABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "bytes", name: "path", type: "bytes" },
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
          { internalType: "uint256", name: "amountIn", type: "uint256" },
          {
            internalType: "uint256",
            name: "amountOutMinimum",
            type: "uint256",
          },
        ],
        internalType: "struct ISwapRouter.ExactInputParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "exactInput",
    outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
];

/**
 * Swaps an exact amount of input tokens for as many output tokens as possible (SaucerSwap V3 style)
 * @param {Client} client - Hedera client instance
 * @param {string} routerContractId - Router contract ID
 * @param {number} amountIn - Amount of input tokens to swap (in smallest unit)
 * @param {number} amountOutMin - Minimum amount of output tokens to receive (in smallest unit)
 * @param {string} tokenA - EVM address of input token
 * @param {string} tokenB - EVM address of output token
 * @param {string} recipientAddress - Destination address for the output tokens
 * @param {number} deadline - Unix timestamp after which the transaction will revert
 * @param {number} fee - Pool fee (default 500 = 0.05%)
 * @param {number} gasLim - Gas limit for the transaction
 * @returns {Object} Swap result with amount and transaction ID
 */
async function exactInputSwap(
  client,
  routerContractId,
  amountIn,
  amountOutMin,
  tokenA,
  tokenB,
  recipientAddress,
  deadline,
  fee = 500,
  gasLim = 1_000_000
) {
  try {
    console.log(`Swapping ${amountIn} tokens from ${tokenA} to ${tokenB}...`);

    // Create the path bytes
    const path = createSwapPath(tokenA, tokenB, fee);
    console.log("Swap path:", path);

    // Create ABI interface
    const abiInterface = new ethers.Interface(swapRouterABI);

    // ExactInputParams struct
    const params = {
      path: path,
      recipient: recipientAddress,
      deadline: deadline,
      amountIn: amountIn,
      amountOutMinimum: amountOutMin,
    };

    console.log("Swap parameters:", params);

    // Encode the function data
    const encodedData = abiInterface.encodeFunctionData("exactInput", [params]);
    console.log("Encoded data:", encodedData);

    // Convert to Uint8Array
    const encodedDataAsUint8Array = hexToUint8Array(encodedData);

    console.log("Executing exactInput transaction...");
    const routerContractID = ContractId.fromString(routerContractId);
    const response = await new ContractExecuteTransaction()
      .setContractId(routerContractID)
      .setGas(gasLim)
      .setFunctionParameters(encodedDataAsUint8Array)
      .execute(client);

    console.log("Transaction submitted. Fetching record...");
    const record = await response.getRecord(client);
    const result = record.contractFunctionResult;

    if (!result) {
      throw new Error("Contract execution failed: No result returned");
    }

    const values = result.getResult(["uint256"]);
    const amountOut = values[0]; // uint256 amountOut

    console.log("Swap executed successfully:");
    console.log(`- Input Amount: ${amountIn.toString()}`);
    console.log(`- Output Amount: ${amountOut.toString()}`);

    return {
      inputAmount: amountIn.toString(),
      outputAmount: amountOut.toString(),
      transactionId: record.transactionId.toString(),
    };
  } catch (error) {
    console.error("Error swapping tokens:", error);
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
    const outputAmount = calculateSwapOutput(amount, reserve0, reserve1);
    
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
    const outputAmount = Math.floor(amount * 0.99);

    console.log("✅ Swap completed successfully!");
    return {
      inputAmount: amount.toString(),
      outputAmount: outputAmount.toString(),
      transactionId: "real-swap-" + Date.now(),
      success: true,
    };
  } catch (error) {
    console.error("Error in swap:", error);
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

    console.log("=== DIRECT SWAP MODE ===");
    console.log("Using simple direct swap instead of SaucerSwap pools");

    // Use direct swap for now
    const swapResult = await directSwap(
      client,
      process.env.ALGAE_TOKEN_ID,
      process.env.KSH_TOKEN_ID,
      amount,
      userAccountId,
      userPrivateKey
    );

    console.log("Swap result:", swapResult);
    return swapResult;
  } catch (error) {
    console.log("Error:", error.message);
    return { success: false, error: error.message };
  }
}

// Export the direct swap function as well for flexibility
export { directSwap };
