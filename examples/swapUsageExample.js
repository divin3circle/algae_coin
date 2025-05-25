// Example usage of the swap functions in your application
import {
  swapAlgaeToKsh,
  swapKshToAlgae,
  swapTokens,
} from "../scripts/swapTokens.js";

/**
 * Example 1: Simple usage in your backend API
 */
async function handleUserSwapRequest(
  userAccountId,
  userPrivateKey,
  fromToken,
  toToken,
  amount
) {
  try {
    console.log(`Processing swap: ${amount} ${fromToken} → ${toToken}`);

    const result = await swapTokens(
      fromToken,
      toToken,
      userAccountId,
      userPrivateKey,
      amount
    );

    if (result.success) {
      return {
        success: true,
        message: `Successfully swapped ${result.inputAmount} ${fromToken} for ${result.outputAmount} ${toToken}`,
        data: result,
      };
    } else {
      return {
        success: false,
        message: "Swap failed",
        error: result.error,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "Swap error",
      error: error.message,
    };
  }
}

/**
 * Example 2: Usage in Express.js route
 */
// app.post('/api/swap', async (req, res) => {
//   const { userAccountId, userPrivateKey, fromToken, toToken, amount } = req.body;
//
//   const result = await handleUserSwapRequest(userAccountId, userPrivateKey, fromToken, toToken, amount);
//
//   if (result.success) {
//     res.json({
//       status: 'success',
//       data: result.data,
//       message: result.message
//     });
//   } else {
//     res.status(400).json({
//       status: 'error',
//       message: result.message,
//       error: result.error
//     });
//   }
// });

/**
 * Example 3: Batch swaps for multiple users
 */
async function processBatchSwaps(swapRequests) {
  const results = [];

  for (const request of swapRequests) {
    try {
      const result = await swapTokens(
        request.fromToken,
        request.toToken,
        request.userAccountId,
        request.userPrivateKey,
        request.amount
      );

      results.push({
        userId: request.userId,
        success: result.success,
        result: result,
      });
    } catch (error) {
      results.push({
        userId: request.userId,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Example 4: Specific direction swaps with validation
 */
async function swapAlgaeForKshWithValidation(
  userAccountId,
  userPrivateKey,
  amount
) {
  // Add your validation logic here
  if (amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  if (amount > 1000) {
    throw new Error("Amount too large. Maximum swap amount is 1000 ALGAE");
  }

  return await swapAlgaeToKsh(userAccountId, userPrivateKey, amount);
}

async function swapKshForAlgaeWithValidation(
  userAccountId,
  userPrivateKey,
  amount
) {
  // Add your validation logic here
  if (amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  if (amount > 500) {
    throw new Error("Amount too large. Maximum swap amount is 500 KSH");
  }

  return await swapKshToAlgae(userAccountId, userPrivateKey, amount);
}

/**
 * Example 5: Usage with async/await pattern
 */
async function demonstrateSwapUsage() {
  const userAccountId = "0.0.6043752";
  const userPrivateKey =
    "3030020100300706052b8104000a042204208df7fca7a235abbe19146d2f6b1d178d5df0ee105588d21bbc1009d3f6cc0223";

  try {
    // Method 1: Direct function calls
    const algaeToKshResult = await swapAlgaeToKsh(
      userAccountId,
      userPrivateKey,
      50
    );
    console.log("ALGAE → KSH:", algaeToKshResult);

    const kshToAlgaeResult = await swapKshToAlgae(
      userAccountId,
      userPrivateKey,
      25
    );
    console.log("KSH → ALGAE:", kshToAlgaeResult);

    // Method 2: Generic swap function
    const genericResult = await swapTokens(
      "ALGAE",
      "KSH",
      userAccountId,
      userPrivateKey,
      100
    );
    console.log("Generic swap:", genericResult);

    // Method 3: With validation
    const validatedResult = await swapAlgaeForKshWithValidation(
      userAccountId,
      userPrivateKey,
      75
    );
    console.log("Validated swap:", validatedResult);
  } catch (error) {
    console.error("Swap failed:", error.message);
  }
}

/**
 * Example 6: Promise-based usage
 */
function swapWithPromises(userAccountId, userPrivateKey, amount) {
  return swapAlgaeToKsh(userAccountId, userPrivateKey, amount)
    .then((result) => {
      console.log("Swap successful:", result);
      return result;
    })
    .catch((error) => {
      console.error("Swap failed:", error.message);
      throw error;
    });
}

// Export examples for use in other files
export {
  handleUserSwapRequest,
  processBatchSwaps,
  swapAlgaeForKshWithValidation,
  swapKshForAlgaeWithValidation,
  demonstrateSwapUsage,
  swapWithPromises,
};

// Demo usage if file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔄 Swap Usage Examples");
  console.log("=".repeat(50));
  demonstrateSwapUsage();
}
