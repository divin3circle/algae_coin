import "dotenv/config";

import {
  AccountId,
  PrivateKey,
  Client,
  Hbar,
  TokenCreateTransaction,
  TokenType,
} from "@hashgraph/sdk";

async function main() {
  let client;
  try {
    const accountId = AccountId.fromString(process.env.ACCOUNT_ID);
    const privateKey = PrivateKey.fromStringED25519(
      process.env.DER_PRIVATE_KEY
    );
    client = Client.forTestnet();
    client.setOperator(accountId, privateKey);

    const txTokenCreate = new TokenCreateTransaction()
      .setTokenName("Algae Token")
      .setTokenSymbol("ALGAE")
      .setTokenType(TokenType.FUNGIBLE_COMMON)
      .setTreasuryAccountId(accountId)
      .setSupplyKey(privateKey)
      .setInitialSupply(5000)
      .freezeWith(client);

    //Sign the transaction with the token treasury account private key
    const signTxTokenCreate = await txTokenCreate.sign(privateKey);

    //Sign the transaction with the client operator private key and submit to a Hedera network
    const txTokenCreateResponse = await signTxTokenCreate.execute(client);

    //Get the receipt of the transaction
    const receiptTokenCreateTx = await txTokenCreateResponse.getReceipt(client);

    //Get the token ID from the receipt
    const tokenId = receiptTokenCreateTx.tokenId;

    //Get the transaction consensus status
    const statusTokenCreateTx = receiptTokenCreateTx.status;

    //Get the Transaction ID
    const txTokenCreateId = txTokenCreateResponse.transactionId.toString();

    console.log(
      "--------------------------------- Token Creation ---------------------------------"
    );
    console.log("Receipt status           :", statusTokenCreateTx.toString());
    console.log("Transaction ID           :", txTokenCreateId);
    console.log(
      "Hashscan URL             :",
      "https://hashscan.io/testnet/tx/" + txTokenCreateId
    );
    console.log("Token ID                 :", tokenId.toString());
  } catch (error) {
    console.error("Error creating client:", error);
  }
}

main();
