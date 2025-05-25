import {
  AccountId,
  PrivateKey,
  Client,
  TokenMintTransaction,
} from "@hashgraph/sdk";
import "dotenv/config";

async function main() {
  let client;
  try {
    // Your account ID and private key from string value
    const MY_ACCOUNT_ID = AccountId.fromString(process.env.ACCOUNT_ID);
    const MY_PRIVATE_KEY = PrivateKey.fromStringED25519(
      process.env.DER_PRIVATE_KEY
    );

    // Pre-configured client for test network (testnet)
    client = Client.forTestnet();

    //Set the operator with the account ID and private key
    client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

    // Start your code here

    //Mint another 1,000 tokens and freeze the unsigned transaction for manual signing
    const txTokenMint = await new TokenMintTransaction()
      .setTokenId(process.env.ALGAE_TOKEN_ID) //Fill in the token ID
      .setAmount(1_000_000_000)
      .freezeWith(client);

    //Sign with the supply private key of the token
    const signTxTokenMint = await txTokenMint.sign(MY_PRIVATE_KEY); //Fill in the supply private key

    //Submit the transaction to a Hedera network
    const txTokenMintResponse = await signTxTokenMint.execute(client);

    //Request the receipt of the transaction
    const receiptTokenMintTx = await txTokenMintResponse.getReceipt(client);

    //Get the transaction consensus status
    const statusTokenMintTx = receiptTokenMintTx.status;

    //Get the Transaction ID
    const txTokenMintId = txTokenMintResponse.transactionId.toString();

    console.log(
      "--------------------------------- Mint Token ---------------------------------"
    );
    console.log("Receipt status           :", statusTokenMintTx.toString());
    console.log("Transaction ID           :", txTokenMintId);
    console.log(
      "Hashscan URL             :",
      "https://hashscan.io/testnet/tx/" + txTokenMintId
    );
  } catch (error) {
    console.error(error);
  } finally {
    if (client) client.close();
  }
}

main();
