import { getClient } from "../src/utils.js";
import {
  ContractFunctionParameters,
  ContractExecuteTransaction,
  AccountAllowanceApproveTransaction,
  AccountUpdateTransaction,
  TokenAssociateTransaction,
  Client,
  AccountId,
  PrivateKey,
  Hbar,
  EvmAddress,
} from "@hashgraph/sdk";
import "dotenv/config";

const operatorAddress = process.env.ADDRESS;
const operatorPrivateKey = PrivateKey.fromStringED25519(
  process.env.DER_PRIVATE_KEY
);
const operatorAccountId = AccountId.fromString(process.env.ACCOUNT_ID);
const KSH_TOKEN_ID = process.env.KSH_TOKEN_ID;
const ALGAE_TOKEN_ID = process.env.ALGAE_TOKEN_ID;
const ROUTER_CONTRACT_ID = "0.0.19264";
const kshAddress = "0x00000000000000000000000000000000005c38f3";
const algaeAddress = "0x00000000000000000000000000000000005c38f2";

/**
 * Creates a new pool and adds initial liquidity
 * @param {Client} client - Hedera client instance
 * @param {string} routerContractId - Router contract ID
 * @param {string} tokenAEvmAddress - EVM address of the first token
 * @param {string} tokenBEvmAddress - EVM address of the second token
 * @param {number} amountADesired - Amount of token A to add as liquidity
 * @param {number} amountBDesired - Amount of token B to add as liquidity
 * @param {number} amountAMin - Minimum amount of token A to add
 * @param {number} amountBMin - Minimum amount of token B to add
 * @param {string} toEvmAddress - Address to receive LP tokens
 * @param {number} deadline - Timestamp when the transaction expires
 * @param {number} poolCreationFeeHbar - HBAR fee for pool creation
 * @param {number} gasLim - Gas limit for the transaction
 * @returns {Object} Creation result with amounts and transaction ID
 */
async function createPool(
  client,
  routerContractId,
  tokenAEvmAddress,
  tokenBEvmAddress,
  amountADesired,
  amountBDesired,
  amountAMin,
  amountBMin,
  toEvmAddress,
  deadline,
  poolCreationFeeHbar = 5,
  gasLim = 6_200_000
) {
  try {
    console.log(
      `Creating pool for tokens ${tokenAEvmAddress} and ${tokenBEvmAddress}...`
    );

    // Client pre-checks:
    // - Max auto-association increased by one
    // - Router contract has spender allowance for the input tokens
    console.log("Preparing transaction parameters...");

    const params = new ContractFunctionParameters();
    params.addAddress(tokenAEvmAddress); // address tokenA
    params.addAddress(tokenBEvmAddress); // address tokenB
    params.addUint256(amountADesired); // uint amountADesired
    params.addUint256(amountBDesired); // uint amountBDesired
    params.addUint256(amountAMin); // uint amountAMin
    params.addUint256(amountBMin); // uint amountBMin
    params.addAddress(toEvmAddress); // address to
    params.addUint256(deadline); // uint deadline

    const client = getClient();

    console.log("Executing addLiquidityNewPool transaction...");
    const response = await new ContractExecuteTransaction()
      .setPayableAmount(Hbar.from(poolCreationFeeHbar))
      .setContractId(routerContractId)
      .setGas(gasLim)
      .setFunction("addLiquidityNewPool", params)
      .execute(client);

    console.log("Transaction submitted. Fetching record...  ");
    const record = await response.getRecord(client);
    const result = record.contractFunctionResult;

    if (!result) {
      throw new Error("Contract execution failed: No result returned");
    }

    const values = result.getResult(["uint", "uint", "uint"]);
    const amountA = values[0]; // uint amountA - in its smallest unit
    const amountB = values[1]; // uint amountB - in its smallest unit
    const liquidity = values[2]; // uint liquidity

    console.log("Pool created successfully:");
    console.log(`- Amount A: ${amountA.toString()}`);
    console.log(`- Amount B: ${amountB.toString()}`);
    console.log(`- Liquidity tokens: ${liquidity.toString()}`);

    return {
      amountA,
      amountB,
      liquidity,
      transactionId: record.transactionId.toString(),
    };
  } catch (error) {
    console.error("Error creating pool:", error);
    throw error;
  }
}

/**
 * Helper function to increase max auto-associations
 * @param {Client} client - Hedera client instance
 * @param {string} accountId - Account ID to update
 * @param {PrivateKey} privateKey - Private key of the account
 * @param {number} count - Number of automatic associations to add
 * @returns {Object} Receipt of the update transaction
 */
async function increaseAutoAssociations(
  client,
  accountId,
  privateKey,
  count = 1
) {
  try {
    console.log(`Increasing max auto-associations by ${count}...`);

    // First, get current max token associations
    // Since there's no direct way to get this in the SDK, we'll set an absolute number
    // Typical default is 0, we'll set it to a reasonable number like 10
    const maxAssociations = 10;

    const transaction = new AccountUpdateTransaction()
      .setAccountId(accountId)
      .setMaxAutomaticTokenAssociations(maxAssociations);

    const signedTx = await transaction.freezeWith(client).sign(privateKey);
    const response = await signedTx.execute(client);
    const receipt = await response.getReceipt(client);

    console.log(`Auto-association update status: ${receipt.status}`);
    return receipt;
  } catch (error) {
    console.error("Error increasing auto-associations:", error);
    throw error;
  }
}

/**
 * Helper function to approve allowance for router contract
 * @param {Client} client - Hedera client instance
 * @param {string} accountId - Account ID approving the allowance
 * @param {PrivateKey} privateKey - Private key of the account
 * @param {string} tokenId - Token ID to approve
 * @param {string} routerAddress - Router contract ID
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

async function createPoolFunction() {
  console.log("Starting pool creation process...");
  try {
    const client = getClient();

    // Get other values from constants or environment
    const routerContractId = ROUTER_CONTRACT_ID;
    const tokenAId = KSH_TOKEN_ID;
    const tokenBId = ALGAE_TOKEN_ID;
    const tokenAAddress = kshAddress;
    const tokenBAddress = algaeAddress;
    const myAccountAddress = operatorAddress;

    const amountADesired = 2_000;
    const amountBDesired = 2_000;
    const amountAMin = 1_500;
    const amountBMin = 1_500;
    const deadline = Math.floor(Date.now() / 1000) + 600;
    const poolCreationFeeHbar = 30;

    await increaseAutoAssociations(
      client,
      operatorAccountId,
      operatorPrivateKey
    );

    await approveAllowance(
      client,
      operatorAccountId,
      operatorPrivateKey,
      tokenAId,
      routerContractId,
      amountADesired
    );
    await approveAllowance(
      client,
      operatorAccountId,
      operatorPrivateKey,
      tokenBId,
      routerContractId,
      amountBDesired
    );

    const result = await createPool(
      client,
      routerContractId,
      tokenAAddress,
      tokenBAddress,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      myAccountAddress,
      deadline,
      poolCreationFeeHbar
    );

    console.log("Pool creation completed:", result);
  } catch (error) {
    console.error("Error in main execution:", error);
  }
}
