import {
  ContractExecuteTransaction,
  AccountAllowanceApproveTransaction,
  TokenAssociateTransaction,
  AccountId,
  PrivateKey,
  Hbar,
  Client,
  ContractId,
} from "@hashgraph/sdk";
import * as ethers from "ethers";
import "dotenv/config";

// SaucerSwap V1 Router (simpler Uniswap V2 style)
const V1_ROUTER_CONTRACT_ID = "0.0.19264";

// Minimal ABI for SaucerSwap V1 functions
const v1RouterABI = [
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint256", name: "amountOutMin", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapExactTokensForTokens",
    outputs: [
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

// Helper function to convert token ID to EVM address
function tokenIdToEvmAddress(tokenId) {
  const numericId = tokenId.split(".")[2];
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
 * SaucerSwap V1 style swap (Uniswap V2)
 */
async function swapV1(
  client,
  routerContractId,
  amountIn,
  amountOutMin,
  tokenA,
  tokenB,
  recipientAddress,
  deadline,
  gasLim = 300_000
) {
  try {
    console.log(
      `V1 Swapping ${amountIn} tokens from ${tokenA} to ${tokenB}...`
    );

    // Create path array [tokenA, tokenB]
    const path = [tokenA, tokenB];
    console.log("Swap path:", path);

    // Create ABI interface
    const abiInterface = new ethers.Interface(v1RouterABI);

    console.log("V1 Swap parameters:", {
      amountIn,
      amountOutMin,
      path,
      to: recipientAddress,
      deadline,
    });

    // Encode the function data for V1
    const encodedData = abiInterface.encodeFunctionData(
      "swapExactTokensForTokens",
      [amountIn, amountOutMin, path, recipientAddress, deadline]
    );

    console.log("Encoded data:", encodedData);

    // Convert to Uint8Array
    const encodedDataAsUint8Array = hexToUint8Array(encodedData);

    console.log("Executing V1 swap transaction...");
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

    // V1 returns an array of amounts
    const values = result.getResult(["uint256[]"]);
    const amounts = values[0];

    console.log("V1 Swap executed successfully:");
    console.log(`- Input Amount: ${amountIn.toString()}`);
    console.log(`- Output Amount: ${amounts[amounts.length - 1].toString()}`);

    return {
      inputAmount: amountIn.toString(),
      outputAmount: amounts[amounts.length - 1].toString(),
      transactionId: record.transactionId.toString(),
    };
  } catch (error) {
    console.error("Error in V1 swap:", error);
    throw error;
  }
}

export default async function swapAlgaeForKshV1(
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

    console.log("=== SAUCERSWAP V1 MODE ===");
    console.log("Using SaucerSwap V1 (Uniswap V2 style)");

    // Approve allowance for V1 router
    console.log("Approving allowance for V1 router...");
    const allowanceTx =
      new AccountAllowanceApproveTransaction().approveTokenAllowance(
        process.env.ALGAE_TOKEN_ID,
        userAccountId,
        V1_ROUTER_CONTRACT_ID,
        amount
      );

    const signedAllowanceTx = await allowanceTx
      .freezeWith(client)
      .sign(hederaPrivateKey);
    await signedAllowanceTx.execute(client);

    const minKshAmount = Math.max(1, Math.floor(amount * 0.95));
    const algaeTokenAddress = tokenIdToEvmAddress(process.env.ALGAE_TOKEN_ID);
    const kshAddress = tokenIdToEvmAddress(process.env.KSH_TOKEN_ID);
    const accountAddress = tokenIdToEvmAddress(userAccountId.toString());

    console.log("Token addresses:", {
      algaeTokenAddress,
      kshAddress,
      accountAddress,
    });

    const swapResult = await swapV1(
      client,
      V1_ROUTER_CONTRACT_ID,
      amount,
      minKshAmount,
      algaeTokenAddress,
      kshAddress,
      accountAddress,
      Math.floor(Date.now() / 1000) + 600, // 10 minutes from now
      300_000
    );

    console.log("V1 Swap result:", swapResult);
    return swapResult;
  } catch (error) {
    console.log("V1 Error:", error.message);
    return { success: false, error: error.message };
  }
}

// Test the V1 version
const demoKey =
  "3030020100300706052b8104000a042204208df7fca7a235abbe19146d2f6b1d178d5df0ee105588d21bbc1009d3f6cc0223";
swapAlgaeForKshV1("0.0.6043752", demoKey, 5);
