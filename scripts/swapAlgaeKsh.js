import {
  ContractFunctionParameters,
  ContractExecuteTransaction,
  AccountAllowanceApproveTransaction,
  TokenAssociateTransaction,
  AccountId,
  PrivateKey,
  Hbar,
  EvmAddress,
  Client,
} from "@hashgraph/sdk";
import "dotenv/config";

// Helper function to convert token ID to EVM address
function tokenIdToEvmAddress(tokenId) {
  // Remove the '0.0.' prefix and convert to hex
  const numericId = tokenId.split(".")[2];
  // Ensure exactly 40 characters (20 bytes) for the address
  const hexId = parseInt(numericId).toString(16).toLowerCase();
  return `0x${hexId.padStart(40, "0")}`;
}

const ROUTER_CONTRACT_ID = "0.0.19264";

/**
 * Swaps an exact amount of input tokens for as many output tokens as possible
 * @param {Client} client - Hedera client instance
 * @param {string} routerContractId - Router contract ID
 * @param {number} amountIn - Amount of input tokens to swap (in smallest unit)
 * @param {number} amountOutMin - Minimum amount of output tokens to receive (in smallest unit)
 * @param {string[]} tokenPath - Array of token addresses in the path [tokenIn, tokenOut] or [tokenIn, intermediateToken, tokenOut]
 * @param {string} toAddress - Destination address for the output tokens
 * @param {number} deadline - Unix timestamp after which the transaction will revert
 * @param {number} gasLim - Gas limit for the transaction
 * @returns {Object} Swap result with amounts and transaction ID
 */
async function swapExactTokensForTokens(
  client,
  routerContractId,
  amountIn,
  amountOutMin,
  tokenPath,
  toAddress,
  deadline,
  gasLim = 1_000_000
) {
  try {
    console.log(
      `Swapping ${amountIn} tokens along path [${tokenPath.join(" -> ")}]...`
    );

    console.log("Preparing transaction parameters...");

    const params = new ContractFunctionParameters();
    params.addUint256(amountIn); // uint amountIn
    params.addUint256(amountOutMin); // uint amountOutMin
    params.addAddressArray(tokenPath); // address[] calldata path
    params.addAddress(toAddress); // address to
    params.addUint256(deadline); // uint deadline

    console.log("Executing swapExactTokensForTokens transaction...");
    const response = await new ContractExecuteTransaction()
      .setContractId(routerContractId)
      .setGas(gasLim)
      .setFunction("swapExactTokensForTokens", params)
      .execute(client);

    console.log("Transaction submitted. Fetching record...");
    const record = await response.getRecord(client);
    const result = record.contractFunctionResult;

    if (!result) {
      throw new Error("Contract execution failed: No result returned");
    }

    const values = result.getResult(["uint[]"]);
    const amounts = values[0]; // uint[] amounts
    const inputAmount = amounts[0];
    const outputAmount = amounts[amounts.length - 1];

    console.log("Swap executed successfully:");
    console.log(`- Input Amount: ${inputAmount.toString()}`);
    console.log(`- Output Amount: ${outputAmount.toString()}`);

    return {
      amounts: amounts.map((amount) => amount.toString()),
      inputAmount: inputAmount.toString(),
      outputAmount: outputAmount.toString(),
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

export default async function swapAlgaeForKsh(
  userAccountId,
  userPrivateKey,
  amount
) {
  let client;
  try {
    const hederaAccountId = AccountId.fromString(userAccountId);
    const hederaPrivateKey = PrivateKey.fromStringECDSA(userPrivateKey);
    client = Client.forTestnet();
    client.setOperator(hederaAccountId, hederaPrivateKey);
    // console.log("Associating KSH token to account...", userAccountId);
    // await associateTokenToAccount(
    //   client,
    //   userAccountId,
    //   hederaPrivateKey,
    //   process.env.KSH_TOKEN_ID
    // );
    // await associateTokenToAccount(
    //   client,
    //   userAccountId,
    //   hederaPrivateKey,
    //   process.env.ALGAE_TOKEN_ID
    // );
    console.log(
      "Approving allowance for the router contract...",
      userAccountId
    );
    await approveAllowance(
      client,
      userAccountId,
      hederaPrivateKey,
      process.env.ALGAE_TOKEN_ID,
      ROUTER_CONTRACT_ID,
      amount
    );
    const minKshAmount = 0;
    const algaeTokenAddress = "0x00000000000000000000000000000000005c38f2";
    const kshAddress = "0x00000000000000000000000000000000005c38f3";
    const accountAddress = tokenIdToEvmAddress(userAccountId.toString());
    console.log("Account address:", accountAddress);

    console.log("Executing the swap...", accountAddress);
    const swapResult = await swapExactTokensForTokens(
      client,
      ROUTER_CONTRACT_ID,
      amount,
      minKshAmount,
      [algaeTokenAddress, kshAddress],
      accountAddress,
      Math.floor(Date.now() / 1000) + 600
    );
    console.log("Swap result:", swapResult);
  } catch (error) {
    console.log(error);
  }
}
const demoKey =
  "3030020100300706052b8104000a042204208df7fca7a235abbe19146d2f6b1d178d5df0ee105588d21bbc1009d3f6cc0223";

swapAlgaeForKsh("0.0.6043752", demoKey, 5);
