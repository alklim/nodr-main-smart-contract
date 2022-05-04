console.clear();
require("dotenv").config();
const {
    AccountId,
    PrivateKey,
    Client,
    TokenCreateTransaction,
    TokenInfoQuery
} = require("@hashgraph/sdk");
const fspr = require("node:fs/promises");

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

    try {
        const data = new Uint8Array(Buffer.from(`## Updated on each token creation\nTOKEN_ID = ${tokenId}\nTREASURY_ID = ${treasuryId}\n`));
        await fspr.writeFile('.env.h22.token', data);
    } catch (err) {
        console.error(err);
    }

    // Token query
    const tokenInfo1 = await tQueryInfo(tokenId);
    console.log(`- Initial token supply : ${tokenInfo1.totalSupply.low}\n`);

    async function tQueryInfo (_tId) {
        let info = await new TokenInfoQuery().setTokenId(_tId).execute(client);
        return info;
    }
}
main();
