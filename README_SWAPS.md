# ALGAE ↔ KSH Token Swap Functions - REAL TRANSFERS

This documentation covers the exportable swap functions for exchanging ALGAE and KSH tokens on the Hedera network with **REAL TOKEN TRANSFERS** using your main account as a liquidity pool.

## 🚨 IMPORTANT - REAL TRANSFERS

⚠️ **These functions perform ACTUAL token transfers that will show up on HashScan!**

The swap system works as follows:

1. **User sends their tokens to the main account (pool)**
2. **System calculates exchange rate based on current pool reserves**
3. **Main account sends appropriate tokens back to user**
4. **All transfers are visible on HashScan blockchain explorer**

## 📁 File Structure

```
scripts/
├── swapAlgaeKsh.js       # ALGAE → KSH real swap implementation
├── swapKshAlgae.js       # KSH → ALGAE real swap implementation
├── swapTokens.js         # Unified swap module (recommended)
├── testSwaps.js          # Test file for simulation functions
└── testRealSwaps.js      # Test file for REAL swap functions

examples/
└── swapUsageExample.js   # Comprehensive usage examples
```

## 🏦 Liquidity Pool System

Your main account (from `.env` file) acts as the liquidity pool:

- **Pool Account**: `process.env.ACCOUNT_ID`
- **Starting Liquidity**: ~500 million ALGAE and KSH tokens each
- **Exchange Rate**: Calculated using constant product formula (`x * y = k`)
- **Fee**: 0.3% deducted from input amount
- **Real-time**: Pool balances change with each swap

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

### Basic Usage (REAL TRANSFERS)

```javascript
// User credentials
const userAccountId = "0.0.1234567";
const userPrivateKey = "302e020100300506032b65700422042...";

// Swap 100 ALGAE for KSH (REAL TRANSFER)
const result1 = await swapAlgaeToKsh(userAccountId, userPrivateKey, 100);

// Swap 50 KSH for ALGAE (REAL TRANSFER)
const result2 = await swapKshToAlgae(userAccountId, userPrivateKey, 50);

// Generic swap (auto-detects direction, REAL TRANSFER)
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

Swaps ALGAE tokens for KSH tokens with **REAL TOKEN TRANSFERS**.

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
//   transactionId: "algae-ksh-swap-1748164484284",
//   success: true,
//   exchangeRate: "0.996703",
//   poolBalances: {
//     algae: 1000000100,
//     ksh: 999999901
//   }
// }
```

### `swapKshToAlgae(userAccountId, userPrivateKey, amount)`

Swaps KSH tokens for ALGAE tokens with **REAL TOKEN TRANSFERS**.

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

Generic swap function that handles both directions with **REAL TOKEN TRANSFERS**.

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
  success: boolean,         // Whether the swap succeeded
  exchangeRate: string,     // Actual exchange rate used
  poolBalances: {           // Pool balances after swap
    algae: number,
    ksh: number
  }
}
```

On error:

```javascript
{
  success: false,
  error: string            // Error message
}
```

## 🧮 Exchange Rate Calculation

The system uses the **Constant Product Formula** (like Uniswap):

```
(x + Δx) × (y - Δy) = x × y
```

Where:

- `x` = Current pool balance of input token
- `y` = Current pool balance of output token
- `Δx` = Input amount (after 0.3% fee)
- `Δy` = Output amount (calculated)

**Example:**

- Pool has 1,000,000 ALGAE and 1,000,000 KSH
- User swaps 1,000 ALGAE
- After 0.3% fee: 997 ALGAE goes to pool
- Output: (1,000,000 × 997) ÷ (1,000,000 + 997) = 996 KSH

## 🧪 Testing

### Test Real Swaps (ACTUAL TRANSFERS)

```bash
# Test with real token transfers
node scripts/testRealSwaps.js
```

This will:

- ✅ Actually transfer tokens between accounts
- ✅ Show real exchange rates based on pool balances
- ✅ Display before/after balances
- ✅ Update pool reserves
- ✅ Be visible on HashScan

### Test Simulation Functions

```bash
# Test simulation functions (no real transfers)
node scripts/testSwaps.js
```

## 📋 Prerequisites

Before using the real swap functions:

1. **Environment Variables** in `.env`:

   ```bash
   ACCOUNT_ID=0.0.1234567           # Main pool account
   PRIVATE_KEY=302e020100300506...   # Pool account private key
   ALGAE_TOKEN_ID=0.0.1234568       # ALGAE token ID
   KSH_TOKEN_ID=0.0.1234569         # KSH token ID
   ```

2. **Token Associations**:

   - Pool account must be associated with both tokens
   - User account must be associated with both tokens

3. **Sufficient Balances**:

   - Pool account should have large reserves (e.g., 1B tokens each)
   - User account needs enough tokens for the swap

4. **Network**: Currently configured for Hedera Testnet

## 🔐 Security Notes

- **Private Keys**: Never expose private keys in client-side code
- **Validation**: Always validate inputs before processing swaps
- **Balance Checks**: System automatically checks balances before swapping
- **Error Handling**: Comprehensive error messages for debugging
- **Rate Limiting**: Consider implementing rate limiting for production

## 🔗 HashScan Integration

After each swap, you can verify the transfers on HashScan:

```javascript
// View user account transactions
https://hashscan.io/testnet/account/${userAccountId}

// View pool account transactions
https://hashscan.io/testnet/account/${process.env.ACCOUNT_ID}

// View specific token transfers
https://hashscan.io/testnet/token/${process.env.ALGAE_TOKEN_ID}
```

## ⚠️ Production Considerations

For production deployment:

1. **Mainnet Configuration**: Switch from testnet to mainnet
2. **Private Key Security**: Use secure key management
3. **Pool Management**: Monitor pool balances and reserves
4. **Fee Adjustment**: Adjust the 0.3% fee as needed
5. **Slippage Protection**: Add minimum output amount checks
6. **Rate Limiting**: Implement user swap limits
7. **Monitoring**: Set up alerts for large swaps or low liquidity

## 📈 Pool Management

The liquidity pool balances will change over time:

```javascript
// Monitor pool balances
import { getTokenBalance } from "./scripts/swapAlgaeKsh.js";

const poolAlgae = await getTokenBalance(client, poolAccountId, algaeTokenId);
const poolKsh = await getTokenBalance(client, poolAccountId, kshTokenId);

console.log(`Pool reserves: ${poolAlgae} ALGAE, ${poolKsh} KSH`);
```

## 🤝 Contributing

When adding new functionality:

1. Add the new function to the appropriate swap file
2. Export it in `scripts/swapTokens.js`
3. Add tests to `scripts/testRealSwaps.js`
4. Update this documentation
5. Test with real transfers on testnet first

## 📞 Support

For questions or issues:

1. Check `scripts/testRealSwaps.js` for working examples
2. Verify your `.env` configuration
3. Ensure accounts are associated with tokens
4. Check HashScan for transaction details
5. Review error messages for specific issues

---

**Remember**: These functions perform real token transfers. Always test thoroughly on testnet before using on mainnet!
