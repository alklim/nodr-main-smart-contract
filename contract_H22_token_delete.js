console.clear();
require("dotenv").config();
const {
    AccountId,
    PrivateKey,
    Client,
    TokenDeleteTransaction
} = require("@hashgraph/sdk");

// Configure accounts and client
const operatorId = AccountId.fromString(process.env.VALIDATOR_ID);
const operatorKey = PrivateKey.fromString(process.env.VALIDATOR_PVKEY);
const adminId = AccountId.fromString(process.env.TREASURY_ID);
const adminKey = PrivateKey.fromString(process.env.TREASURY_PVKEY);
const client = Client.forTestnet().setOperator(operatorId, operatorKey);
console.log(`- Operator ID: ${operatorId}\n`);

async function main() {

    const tokenId = '0.0.34235442'
    // Delete fungible token
    // Create the transaction and freeze the unsigned transaction for manual signing
    const transaction = await new TokenDeleteTransaction()
        .setTokenId(tokenId)
        .freezeWith(client);

    // Sign with the admin private key of the token
    const signTx = await transaction.sign(adminKey);

    // Submit the transaction to a Hedera network
    const txResponse = await signTx.execute(client);

    // Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    // Get the transaction consensus status
    const transactionStatus = receipt.status;

    console.log(`The transaction consensus status ${transactionStatus.toString()}`);
}
main();
