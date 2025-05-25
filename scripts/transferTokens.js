import {
  AccountId,
  PrivateKey,
  Client,
  TransferTransaction,
  Hbar,
} from "@hashgraph/sdk";
import "dotenv/config";

const tokenId = process.env.KSH_TOKEN_ID;
const receiverAccount = "0.0.6043752";

async function main() {
  let client;
  try {
    // Your account ID and private key from string value
    const MY_ACCOUNT_ID = AccountId.fromString(process.env.ACCOUNT_ID);
    const MY_PRIVATE_KEY = PrivateKey.fromStringDer(
      process.env.DER_PRIVATE_KEY
    );

    // Pre-configured client for test network (testnet)
    client = Client.forTestnet();

    //Set the operator with the account ID and private key
    client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

    // Start your code here

    // Create a transaction to transfer 1 HBAR
    const txTransfer = new TransferTransaction()
      .addHbarTransfer(MY_ACCOUNT_ID, new Hbar(-100))
      .addHbarTransfer(receiverAccount, new Hbar(100)); //Fill in the receiver account ID

    //Submit the transaction to a Hedera network
    const txTransferResponse = await txTransfer.execute(client);

    //Request the receipt of the transaction
    const receiptTransferTx = await txTransferResponse.getReceipt(client);

    //Get the transaction consensus status
    const statusTransferTx = receiptTransferTx.status;

    //Get the Transaction ID
    const txIdTransfer = txTransferResponse.transactionId.toString();

    console.log(
      "-------------------------------- Transfer HBAR ------------------------------ "
    );
    console.log("Receipt status           :", statusTransferTx.toString());
    console.log("Transaction ID           :", txIdTransfer);
    console.log(
      "Hashscan URL             :",
      `https://hashscan.io/testnet/tx/${txIdTransfer}`
    );
  } catch (error) {
    console.error(error);
  } finally {
    if (client) client.close();
  }
}

main();
