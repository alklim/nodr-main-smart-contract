console.clear();
require("dotenv").config();
const {
    AccountId,
    PrivateKey,
    Client,
    TokenCreateTransaction,
    TokenInfoQuery,
    TokenUpdateTransaction,
} = require("@hashgraph/sdk");

// Configure accounts and client
const operatorId = AccountId.fromString(process.env.VALIDATOR_ID);
const operatorKey = PrivateKey.fromString(process.env.VALIDATOR_PVKEY);
const treasuryId = AccountId.fromString(process.env.TREASURY_ID);
const treasuryKey = PrivateKey.fromString(process.env.TREASURY_PVKEY);
const client = Client.forTestnet().setOperator(operatorId, operatorKey);
console.log(`- Operator ID: ${operatorId}\n`);

async function main() {

    // Create a fungible token
    const tokenCreateTx = await new TokenCreateTransaction()
        .setTokenName('H22NODR')
        .setTokenSymbol('H22NODR')
        .setDecimals(9)
        .setInitialSupply(1e6*1e9)
        .setTreasuryAccountId(treasuryId)
        .setAdminKey(treasuryKey)
        .setSupplyKey(treasuryKey)
        .freezeWith(client)
        .sign(treasuryKey);
    const tokenCreateSubmit = await tokenCreateTx.execute(client);
    const tokenCreateRx = await tokenCreateSubmit.getReceipt(client);
    const tokenId = tokenCreateRx.tokenId;
    const tokenAddressSol = tokenId.toSolidityAddress();
    console.log(`- Created token ID: ${tokenId}\n`);
    console.log(`- Created token ID Solidity format: ${tokenAddressSol}\n`);

    // Token query
    const tokenInfo1 = await tQueryInfo(tokenId);
    console.log(`- Initial token supply : ${tokenInfo1.totalSupply.low}\n`);

    async function tQueryInfo (_tId) {
        let info = await new TokenInfoQuery().setTokenId(_tId).execute(client);
        return info;
    }
}
main();
