import {
  ContractFunctionParameters,
  ContractExecuteTransaction,
  AccountAllowanceApproveTransaction,
  Client,
  AccountId,
  PrivateKey,
} from "@hashgraph/sdk";
import "dotenv/config";

// Use the provided operator credentials
const HEDERA_OPERATOR_ID = AccountId.fromString(process.env.ACCOUNT_ID);
const HEDERA_OPERATOR_KEY = PrivateKey.fromStringDer(
  process.env.DER_PRIVATE_KEY
);
const HEDERA_OPERATOR_ADDRESS = "0x0000000000000000000000000000000000597c31";
const ROUTER_CONTRACT_ID = "0.0.19264";
const kshAddress = "0x00000000000000000000000000000000005c38f3";
const algaeAddress = "0x00000000000000000000000000000000005c38f2";
const KSH_TOKEN_ID = process.env.KSH_TOKEN_ID;
const ALGAE_TOKEN_ID = process.env.ALGAE_TOKEN_ID;

async function addLiquidity(
  client,
  routerContractId,
  tokenAAddress,
  tokenBAddress,
  amountADesired,
  amountBDesired,
  amountAMin,
  amountBMin,
  toAddress,
  deadline,
  gasLim = 4_200_000
) {
  try {
    console.log(
      `Adding liquidity for tokens ${tokenAAddress} and ${tokenBAddress}...`
    );

    // Client pre-checks:
    // - Output NFT token is associated
    // - Router contract has spender allowance for the input tokens
    console.log("Preparing transaction parameters...");

    const params = new ContractFunctionParameters();
    params.addAddress(tokenAAddress); //address tokenA
    params.addAddress(tokenBAddress); //address tokenB
    params.addUint256(amountADesired); //uint amountADesired
    params.addUint256(amountBDesired); //uint amountBDesired
    params.addUint256(amountAMin); //uint amountAMin
    params.addUint256(amountBMin); //uint amountBMin
    params.addAddress(toAddress); //address to
    params.addUint256(deadline); //uint deadline

    client = Client.forTestnet();
    client.setOperator(HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY);

    console.log("Executing addLiquidity transaction...");
    const response = await new ContractExecuteTransaction()
      .setContractId(routerContractId)
      .setGas(gasLim)
      .setFunction("addLiquidity", params)
      .execute(client);

    console.log("Transaction submitted. Fetching record...");
    const record = await response.getRecord(client);
    const result = record.contractFunctionResult;

    if (!result) {
      throw new Error("Contract execution failed: No result returned");
    }

    const values = result.getResult(["uint", "uint", "uint"]);
    const amountA = values[0]; //uint amountA
    const amountB = values[1]; //uint amountB
    const liquidity = values[2]; //uint liquidity

    console.log("Liquidity added successfully:");
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
    console.error("Error adding liquidity:", error);
    throw error;
  }
}

// // Helper function to associate tokens if needed
// async function associateTokenToAccount(client, accountId, privateKey, tokenId) {
//   try {
//     console.log(`Associating token ${tokenId} with account ${accountId}...`);

//     const transaction = new TokenAssociateTransaction()
//       .setAccountId(accountId)
//       .setTokenIds([tokenId]);

//     const signedTx = await transaction.freezeWith(client).sign(privateKey);
//     const response = await signedTx.execute(client);
//     const receipt = await response.getReceipt(client);

//     console.log(`Token association status: ${receipt.status}`);
//     return receipt;
//   } catch (error) {
//     console.error('Error associating token:', error);
//     throw error;
//   }
// }

// Helper function to approve allowance for router contract
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

// Example usage (can be uncommented and modified as needed)
async function main() {
  console.log("Starting liquidity addition process...");
  try {
    // Use the provided operator credentials instead of environment variables
    const myAccountId = HEDERA_OPERATOR_ID;
    const myPrivateKey = HEDERA_OPERATOR_KEY;

    const client = Client.forTestnet();
    client.setOperator(myAccountId, myPrivateKey);

    // Get other values from environment or use defaults
    const routerContractId = ROUTER_CONTRACT_ID;
    const tokenAId = KSH_TOKEN_ID;
    const tokenBId = ALGAE_TOKEN_ID;
    const tokenAAddress = kshAddress;
    const tokenBAddress = algaeAddress;
    const myAccountAddress = HEDERA_OPERATOR_ADDRESS;

    // Example values - these would be set based on actual requirements
    const amountADesired = 500_000_000;
    const amountBDesired = 500_000_000;
    const amountAMin = 100_000_000;
    const amountBMin = 100_000_000;
    const deadline = Math.floor(Date.now() / 1000) + 600; // 10 minutes from now

    // Ensure tokens are associated
    // await associateTokenToAccount(client, myAccountId, myPrivateKey, tokenAId);
    // await associateTokenToAccount(client, myAccountId, myPrivateKey, tokenBId);

    // Approve allowances
    await approveAllowance(
      client,
      myAccountId,
      myPrivateKey,
      tokenAId,
      routerContractId,
      amountADesired
    );
    await approveAllowance(
      client,
      myAccountId,
      myPrivateKey,
      tokenBId,
      routerContractId,
      amountBDesired
    );

    // Add liquidity
    const result = await addLiquidity(
      client,
      routerContractId,
      tokenAAddress,
      tokenBAddress,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      myAccountAddress,
      deadline
    );

    console.log("Liquidity addition completed:", result);
  } catch (error) {
    console.error("Error in main execution:", error);
  }
}

// Uncomment to run the script directly
main();
