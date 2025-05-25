# ALGAE ↔ KSH Token Swap Functions

This documentation covers the exportable swap functions for exchanging ALGAE and KSH tokens on the Hedera network.

## 📁 File Structure

```
scripts/
├── swapAlgaeKsh.js       # ALGAE → KSH swap implementation
├── swapKshAlgae.js       # KSH → ALGAE swap implementation
├── swapTokens.js         # Unified swap module (recommended)
└── testSwaps.js          # Test file for all swap functions

examples/
└── swapUsageExample.js   # Comprehensive usage examples
```

## 🚀 Quick Start

### Import the Swap Functions

```javascript
// Option 1: Import specific functions
import {
  swapAlgaeToKsh,
  swapKshToAlgae,
  swapTokens,
} from "./scripts/swapTokens.js";

// Option 2: Import everything as default
import swapModule from "./scripts/swapTokens.js";

// Option 3: Import individual modules
import swapAlgaeForKsh from "./scripts/swapAlgaeKsh.js";
import swapKshForAlgae from "./scripts/swapKshAlgae.js";
```

### Basic Usage

```javascript
// User credentials
const userAccountId = "0.0.1234567";
const userPrivateKey = "302e020100300506032b65700422042...";

// Swap 100 ALGAE for KSH
const result1 = await swapAlgaeToKsh(userAccountId, userPrivateKey, 100);

// Swap 50 KSH for ALGAE
const result2 = await swapKshToAlgae(userAccountId, userPrivateKey, 50);

// Generic swap (auto-detects direction)
const result3 = await swapTokens(
  "ALGAE",
  "KSH",
  userAccountId,
  userPrivateKey,
  75
);
```

## 📚 API Reference

### `swapAlgaeToKsh(userAccountId, userPrivateKey, amount)`

Swaps ALGAE tokens for KSH tokens.

**Parameters:**

- `userAccountId` (string): Hedera account ID (e.g., "0.0.1234567")
- `userPrivateKey` (string): Private key in DER format
- `amount` (number): Amount of ALGAE tokens to swap

**Returns:** Promise<SwapResult>

**Example:**

```javascript
const result = await swapAlgaeToKsh("0.0.1234567", privateKey, 100);
console.log(result);
// {
//   inputAmount: "100",
//   outputAmount: "99",
//   transactionId: "real-swap-1748164484284",
//   success: true
// }
```

### `swapKshToAlgae(userAccountId, userPrivateKey, amount)`

Swaps KSH tokens for ALGAE tokens.

**Parameters:**

- `userAccountId` (string): Hedera account ID
- `userPrivateKey` (string): Private key in DER format
- `amount` (number): Amount of KSH tokens to swap

**Returns:** Promise<SwapResult>

**Example:**

```javascript
const result = await swapKshToAlgae("0.0.1234567", privateKey, 50);
```

### `swapTokens(fromToken, toToken, userAccountId, userPrivateKey, amount)`

Generic swap function that handles both directions.

**Parameters:**

- `fromToken` (string): Source token ("ALGAE" or "KSH")
- `toToken` (string): Target token ("ALGAE" or "KSH")
- `userAccountId` (string): Hedera account ID
- `userPrivateKey` (string): Private key in DER format
- `amount` (number): Amount of tokens to swap

**Returns:** Promise<SwapResult>

**Example:**

```javascript
// Both cases work (case-insensitive)
const result1 = await swapTokens("ALGAE", "KSH", accountId, privateKey, 100);
const result2 = await swapTokens("ksh", "algae", accountId, privateKey, 50);
```

## 📊 Response Format

All swap functions return a `SwapResult` object:

```javascript
{
  inputAmount: string,      // Amount of tokens sent
  outputAmount: string,     // Amount of tokens received
  transactionId: string,    // Unique transaction identifier
  success: boolean          // Whether the swap succeeded
}
```

On error:

```javascript
{
  success: false,
  error: string            // Error message
}
```

## 🔧 Integration Examples

### Express.js API Route

```javascript
import { swapTokens } from "./scripts/swapTokens.js";

app.post("/api/swap", async (req, res) => {
  const { userAccountId, userPrivateKey, fromToken, toToken, amount } =
    req.body;

  try {
    const result = await swapTokens(
      fromToken,
      toToken,
      userAccountId,
      userPrivateKey,
      amount
    );

    if (result.success) {
      res.json({
        status: "success",
        data: result,
        message: `Swapped ${result.inputAmount} ${fromToken} for ${result.outputAmount} ${toToken}`,
      });
    } else {
      res.status(400).json({
        status: "error",
        message: "Swap failed",
        error: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});
```

### React Component

```javascript
import { swapAlgaeToKsh, swapKshToAlgae } from "./scripts/swapTokens.js";

function SwapComponent() {
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState("ALGAE_TO_KSH");
  const [result, setResult] = useState(null);

  const handleSwap = async () => {
    try {
      let swapResult;

      if (direction === "ALGAE_TO_KSH") {
        swapResult = await swapAlgaeToKsh(
          userAccountId,
          userPrivateKey,
          parseInt(amount)
        );
      } else {
        swapResult = await swapKshToAlgae(
          userAccountId,
          userPrivateKey,
          parseInt(amount)
        );
      }

      setResult(swapResult);
    } catch (error) {
      console.error("Swap failed:", error);
    }
  };

  return (
    <div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount to swap"
      />
      <select value={direction} onChange={(e) => setDirection(e.target.value)}>
        <option value="ALGAE_TO_KSH">ALGAE → KSH</option>
        <option value="KSH_TO_ALGAE">KSH → ALGAE</option>
      </select>
      <button onClick={handleSwap}>Swap Tokens</button>

      {result && (
        <div>
          <p>
            Swapped: {result.inputAmount} → {result.outputAmount}
          </p>
          <p>Transaction: {result.transactionId}</p>
        </div>
      )}
    </div>
  );
}
```

### Batch Processing

```javascript
import { processBatchSwaps } from "./examples/swapUsageExample.js";

const swapRequests = [
  {
    userId: "user1",
    fromToken: "ALGAE",
    toToken: "KSH",
    userAccountId: "0.0.1111111",
    userPrivateKey: "key1",
    amount: 100,
  },
  {
    userId: "user2",
    fromToken: "KSH",
    toToken: "ALGAE",
    userAccountId: "0.0.2222222",
    userPrivateKey: "key2",
    amount: 50,
  },
];

const results = await processBatchSwaps(swapRequests);
console.log(results);
```

## 🧪 Testing

Run the test suite:

```bash
# Test all swap functions
node scripts/testSwaps.js

# Test usage examples
node examples/swapUsageExample.js
```

## ⚠️ Current Implementation

**Note:** The current implementation uses **simulation mode** for demos and testing. The swaps return realistic results but don't execute real blockchain transactions.

### For Production:

1. **Replace simulation with real DEX integration**
2. **Add proper liquidity pools**
3. **Implement real token transfers**
4. **Add slippage protection**
5. **Include transaction fees**

The TODO comments in the code show where to implement real DEX functionality.

## 🔐 Security Notes

- **Never expose private keys** in client-side code
- **Validate all inputs** before processing swaps
- **Use environment variables** for sensitive data
- **Implement rate limiting** for swap endpoints
- **Add balance checks** before swapping

## 🛠️ Environment Setup

Make sure your `.env` file contains:

```bash
ALGAE_TOKEN_ID=0.0.1234567
KSH_TOKEN_ID=0.0.1234568
ACCOUNT_ID=0.0.1234569
PRIVATE_KEY=302e020100300506032b65700422042...
```

## 📈 Exchange Rates

Current simulation rates:

- **ALGAE → KSH:** 1% fee (99 KSH per 100 ALGAE)
- **KSH → ALGAE:** 1.02x rate (102 ALGAE per 100 KSH)

These can be adjusted in the `directSwap` functions in each module.

## 🤝 Contributing

When adding new swap functionality:

1. Add the new function to `scripts/swapTokens.js`
2. Export it in the unified module
3. Add tests to `scripts/testSwaps.js`
4. Update this documentation
5. Add usage examples

## 📞 Support

For questions or issues with the swap functions, please check:

1. The test files for working examples
2. The usage examples for integration patterns
3. The TODO comments for production implementation guidance
