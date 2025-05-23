import express from "express";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import { getClient, mintAndSendToken, associateToken } from "./utils.js";
import {
  AccountId,
  PrivateKey,
  Hbar,
  AccountCreateTransaction,
  TransferTransaction,
} from "@hashgraph/sdk";

const ALGAE_TOKEN_ID = process.env.ALGAE_TOKEN_ID;
const KSH_TOKEN_ID = process.env.KSH_TOKEN_ID;

const supabaseUrl = process.env.SUPABASE_URL;
console.log(supabaseUrl);
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const port = 3000;

app.use(cors());
app.use(morgan("combined"));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/create-account", async (req, res) => {
  try {
    const client = getClient();
    if (!client) {
      return res.status(500).send("Error creating client");
    }
    const accountPrivateKey = PrivateKey.generateECDSA();
    const accountPublicKey = accountPrivateKey.publicKey;
    const txCreateAccount = new AccountCreateTransaction()
      .setAlias(accountPublicKey.toEvmAddress())
      .setKey(accountPublicKey)
      .setInitialBalance(new Hbar(10));

    const txCreateAccountResponse = await txCreateAccount.execute(client);

    const receiptCreateAccountTx = await txCreateAccountResponse.getReceipt(
      client
    );

    const statusCreateAccountTx = receiptCreateAccountTx.status;

    const accountId = receiptCreateAccountTx.accountId;

    const txIdAccountCreated = txCreateAccountResponse.transactionId.toString();

    console.log(
      "------------------------------ Create Account ------------------------------ "
    );
    console.log("Receipt status       :", statusCreateAccountTx.toString());
    console.log("Transaction ID       :", txIdAccountCreated);
    console.log(
      "Hashscan URL         :",
      `https://hashscan.io/testnet/tx/${txIdAccountCreated}`
    );
    console.log("Account ID           :", accountId.toString());
    console.log("Private key          :", accountPrivateKey.toString());
    console.log("Public key           :", accountPublicKey.toString());
    const txTransfer = new TransferTransaction()
      .addHbarTransfer(process.env.ACCOUNT_ID, new Hbar(-1))
      .addHbarTransfer(accountId, new Hbar(10));

    const txTransferResponse = await txTransfer.execute(client);

    const receiptTransferTx = await txTransferResponse.getReceipt(client);

    const statusTransferTx = receiptTransferTx.status;

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

    const { username } = req.body;
    const { error } = await supabase.from("users").insert({
      id: parseInt(accountId.toString().slice(4, 11)),
      created_at: new Date().toISOString(),
      user_name: username,
      account_id: accountId.toString(),
      public_key: accountPublicKey.toString(),
      private_key: accountPrivateKey.toString(),
    });
    if (error) {
      return res.status(500).send(error);
    }
    res.send("created!!");
  } catch (error) {
    return res.status(500).send(error);
  }
});

app.post("/buy/ALGAE", async (req, res) => {
  try {
    const { amount, username } = req.body;
    const { data: user, error } = await supabase
      .from("users")
      .select()
      .eq("user_name", username);
    if (error) {
      return res.status(500).send(error);
    }

    if (!user) {
      return res.status(404).send("User not found");
    }
    const userFound = user[0];
    const accountId = userFound.account_id;
    if (!userFound.is_algae_associated) {
      const associateStatusTxn = await associateToken(
        ALGAE_TOKEN_ID,
        accountId,
        userFound.private_key
      );
      if (associateStatusTxn) {
        await supabase
          .from("users")
          .update({ is_algae_associated: true })
          .eq("id", userFound.id);
      }
    }
    const statusTxn = await mintAndSendToken(ALGAE_TOKEN_ID, amount, accountId);
    res.send({ statusTxn });
  } catch (error) {
    console.error("Error buying ALGAE:", error);
    res.status(500).send(error);
  }
});
app.post("/buy/KSH", async (req, res) => {
  try {
    const { amount, username } = req.body;
    const { data: user, error } = await supabase
      .from("users")
      .select()
      .eq("user_name", username);
    if (error) {
      return res.status(500).send(error);
    }

    if (!user) {
      return res.status(404).send("User not found");
    }
    const userFound = user[0];
    const accountId = userFound.account_id;
    if (!userFound.is_ksh_associated) {
      const associateStatusTxn = await associateToken(
        KSH_TOKEN_ID,
        accountId,
        userFound.private_key
      );
      if (associateStatusTxn) {
        await supabase
          .from("users")
          .update({ is_ksh_associated: true })
          .eq("id", userFound.id);
      }
    }
    const statusTxn = await mintAndSendToken(KSH_TOKEN_ID, amount, accountId);
    res.send({ statusTxn });
  } catch (error) {
    console.error("Error buying KSH:", error);
    res.status(500).send(error);
  }
});

app.listen(port, () => {
  console.log(`> Ready on http://localhost:${port}`);
});
