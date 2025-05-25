// Test file demonstrating how to use the swap functions
import { swapAlgaeToKsh, swapKshToAlgae, swapTokens } from "./swapTokens.js";

// Demo credentials (replace with real ones)
const demoAccountId = "0.0.6043752";
const demoPrivateKey =
  "3030020100300706052b8104000a042204208df7fca7a235abbe19146d2f6b1d178d5df0ee105588d21bbc1009d3f6cc0223";

async function testSwaps() {
  console.log("🧪 Testing Swap Functions");
  console.log("=".repeat(50));

  try {
    // Test ALGAE to KSH swap
    console.log("\n1. Testing ALGAE → KSH swap:");
    const algaeToKshResult = await swapAlgaeToKsh(
      demoAccountId,
      demoPrivateKey,
      10
    );
    console.log("Result:", algaeToKshResult);

    // Test KSH to ALGAE swap
    console.log("\n2. Testing KSH → ALGAE swap:");
    const kshToAlgaeResult = await swapKshToAlgae(
      demoAccountId,
      demoPrivateKey,
      5
    );
    console.log("Result:", kshToAlgaeResult);

    // Test generic swap function
    console.log("\n3. Testing generic swap function (ALGAE → KSH):");
    const genericResult1 = await swapTokens(
      "ALGAE",
      "KSH",
      demoAccountId,
      demoPrivateKey,
      7
    );
    console.log("Result:", genericResult1);

    console.log("\n4. Testing generic swap function (KSH → ALGAE):");
    const genericResult2 = await swapTokens(
      "ksh",
      "algae",
      demoAccountId,
      demoPrivateKey,
      3
    );
    console.log("Result:", genericResult2);

    console.log("\n✅ All swap tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testSwaps();
}

export { testSwaps };
