import "dotenv/config";

import {
  AccountId,
  PrivateKey,
  Client,
  Hbar,
  TokenCreateTransaction,
  TokenMintTransaction,
  TransferTransaction,
  TokenAssociateTransaction,
  ContractFunctionParameters,
  ContractExecuteTransaction,
  AccountAllowanceApproveTransaction,
} from "@hashgraph/sdk";

const treasuryPrivateKey = PrivateKey.fromStringED25519(
  process.env.DER_PRIVATE_KEY
);

export function getClient() {
  let client;
  try {
    const accountId = AccountId.fromString(process.env.ACCOUNT_ID);
    const privateKey = PrivateKey.fromStringED25519(
      process.env.DER_PRIVATE_KEY
    );
    client = Client.forTestnet();
    client.setOperator(accountId, privateKey);
    return client;
  } catch (error) {
    console.error("Error creating client:", error);
    return null;
  }
}

export async function mintAndSendToken(tokenId, amount, userAccountId) {
  try {
    const client = getClient();
    if (!client) {
      return null;
    }
    const txTokenMint = new TokenMintTransaction()
      .setTokenId(tokenId)
      .setAmount(amount)
      .freezeWith(client);

    const signTxTokenMint = await txTokenMint.sign(treasuryPrivateKey);

    const txTokenMintResponse = await signTxTokenMint.execute(client);

    const receiptTokenMintTx = await txTokenMintResponse.getReceipt(client);

    const statusTokenMintTx = receiptTokenMintTx.status;

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

    const txTransfer = await new TransferTransaction()
      .addTokenTransfer(tokenId, process.env.ACCOUNT_ID, -amount)
      .addTokenTransfer(tokenId, userAccountId, amount)
      .freezeWith(client);
    const signTxTransfer = await txTransfer.sign(treasuryPrivateKey);

    const txTransferResponse = await signTxTransfer.execute(client);

    const receiptTransferTx = await txTransferResponse.getReceipt(client);

    const statusTransferTx = receiptTransferTx.status;

    const txTransferId = txTransferResponse.transactionId.toString();

    console.log(
      "--------------------------------- Token Transfer ---------------------------------"
    );
    console.log("Receipt status           :", statusTransferTx.toString());
    console.log("Transaction ID           :", txTransferId);
    console.log(
      "Hashscan URL             :",
      "https://hashscan.io/testnet/tx/" + txTransferId
    );
    return {
      mintingTxn: "https://hashscan.io/testnet/tx/" + txTokenMintId,
      transferTxn: "https://hashscan.io/testnet/tx/" + txTransferId,
      status: statusTokenMintTx.toString(),
    };
  } catch (error) {
    console.error("Error minting and sending token:", error);
    return null;
  }
}

export async function associateToken(tokenId, userAccountId, privateKey) {
  let client;
  try {
    client = Client.forTestnet();
    client.setOperator(userAccountId, PrivateKey.fromStringECDSA(privateKey));
    const txTokenAssociate = new TokenAssociateTransaction()
      .setAccountId(userAccountId)
      .setTokenIds([tokenId])
      .freezeWith(client);
    const signTxTokenAssociate = await txTokenAssociate.sign(
      PrivateKey.fromStringECDSA(privateKey)
    );

    const txTokenAssociateResponse = await signTxTokenAssociate.execute(client);
    const receiptTokenAssociateTx = await txTokenAssociateResponse.getReceipt(
      client
    );

    const statusTokenAssociateTx = receiptTokenAssociateTx.status;

    const txTokenAssociateId =
      txTokenAssociateResponse.transactionId.toString();

    console.log(
      "--------------------------------- Token Associate ---------------------------------"
    );
    console.log(
      "Receipt status           :",
      statusTokenAssociateTx.toString()
    );
    console.log("Transaction ID           :", txTokenAssociateId);
    console.log(
      "Hashscan URL             :",
      "https://hashscan.io/testnet/tx/" + txTokenAssociateId
    );
    return {
      associateTxn: "https://hashscan.io/testnet/tx/" + txTokenAssociateId,
      status: statusTokenAssociateTx.toString(),
    };
  } catch (error) {
    console.error(error);
    return null;
  } finally {
    if (client) client.close();
  }
}
