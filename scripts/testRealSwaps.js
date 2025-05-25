// Test file for real token swaps with actual transfers
import { swapAlgaeToKsh, swapKshToAlgae, swapTokens } from "./swapTokens.js";
import "dotenv/config";

// Demo credentials (replace with real ones for testing)
const demoAccountId = "0.0.6043752";
const demoPrivateKey =
  "3030020100300706052b8104000a042204208df7fca7a235abbe19146d2f6b1d178d5df0ee105588d21bbc1009d3f6cc0223";

async function testRealSwaps() {
  console.log("🔄 Testing REAL Token Swap Functions");
  console.log("💰 These swaps will actually transfer tokens!");
  console.log("=".repeat(60));

  console.log("📋 Environment Check:");
  console.log(`Pool Account: ${process.env.ACCOUNT_ID}`);
  console.log(`ALGAE Token: ${process.env.ALGAE_TOKEN_ID}`);
  console.log(`KSH Token: ${process.env.KSH_TOKEN_ID}`);
  console.log(`Test Account: ${demoAccountId}`);
  console.log("=".repeat(60));

  try {
    // Test ALGAE to KSH swap
    console.log("\n1. 🌱 Testing ALGAE → KSH swap (REAL TRANSFER):");
    console.log("Swapping 10 ALGAE tokens for KSH...");
    const algaeToKshResult = await swapAlgaeToKsh(
      demoAccountId,
      demoPrivateKey,
      10
    );
    console.log("✅ ALGAE → KSH Result:", algaeToKshResult);

    if (algaeToKshResult.success) {
      console.log(
        `📊 Exchange Rate: 1 ALGAE = ${algaeToKshResult.exchangeRate} KSH`
      );
      console.log(
        `🏦 Pool Balances: ALGAE=${algaeToKshResult.poolBalances?.algae}, KSH=${algaeToKshResult.poolBalances?.ksh}`
      );
    }

    // Wait a moment between swaps
    console.log("\n⏳ Waiting 3 seconds before next swap...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Test KSH to ALGAE swap
    console.log("\n2. 💎 Testing KSH → ALGAE swap (REAL TRANSFER):");
    console.log("Swapping 5 KSH tokens for ALGAE...");
    const kshToAlgaeResult = await swapKshToAlgae(
      demoAccountId,
      demoPrivateKey,
      5
    );
    console.log("✅ KSH → ALGAE Result:", kshToAlgaeResult);

    if (kshToAlgaeResult.success) {
      console.log(
        `📊 Exchange Rate: 1 KSH = ${kshToAlgaeResult.exchangeRate} ALGAE`
      );
      console.log(
        `🏦 Pool Balances: ALGAE=${kshToAlgaeResult.poolBalances?.algae}, KSH=${kshToAlgaeResult.poolBalances?.ksh}`
      );
    }

    // Wait a moment between swaps
    console.log("\n⏳ Waiting 3 seconds before next swap...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Test generic swap function
    console.log("\n3. 🔄 Testing generic swap function (ALGAE → KSH):");
    console.log("Using generic swapTokens function...");
    const genericResult1 = await swapTokens(
      "ALGAE",
      "KSH",
      demoAccountId,
      demoPrivateKey,
      7
    );
    console.log("✅ Generic ALGAE → KSH Result:", genericResult1);

    console.log("\n4. 🔄 Testing generic swap function (KSH → ALGAE):");
    console.log("Using generic swapTokens function with lowercase...");
    const genericResult2 = await swapTokens(
      "ksh",
      "algae",
      demoAccountId,
      demoPrivateKey,
      3
    );
    console.log("✅ Generic KSH → ALGAE Result:", genericResult2);

    console.log("\n🎉 All real swap tests completed successfully!");
    console.log("💡 Check HashScan to verify the actual token transfers!");
    console.log(
      `🔗 View account: https://hashscan.io/testnet/account/${demoAccountId}`
    );
    console.log(
      `🔗 View pool: https://hashscan.io/testnet/account/${process.env.ACCOUNT_ID}`
    );
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("💡 Make sure:");
    console.error("   - Your .env file has correct token IDs");
    console.error("   - The test account has sufficient token balances");
    console.error("   - The pool account has tokens to swap");
    console.error("   - Both accounts are associated with both tokens");
  }
}

// Helper function to check balances (useful for debugging)
async function checkBalances() {
  console.log("🔍 Checking account balances...");
  console.log(
    "(This is a placeholder - you can implement balance checking here)"
  );
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testRealSwaps();
}

export { testRealSwaps, checkBalances };
