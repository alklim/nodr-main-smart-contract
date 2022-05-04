console.clear();
require("dotenv").config();
const {
    AccountId,
    PrivateKey,
    Client,
    TokenInfoQuery,
    ContractId,
    TokenUpdateTransaction,
    ContractCreateTransaction,
} = require("@hashgraph/sdk");

// Configure accounts and client
const operatorId = AccountId.fromString(process.env.VALIDATOR_ID);
const operatorKey = PrivateKey.fromString(process.env.VALIDATOR_PVKEY);
const treasuryId = AccountId.fromString(process.env.TREASURY_ID);
const treasuryKey = PrivateKey.fromString(process.env.TREASURY_PVKEY);
const client = Client.forTestnet().setOperator(treasuryId, treasuryKey);
console.log(`- Operator ID: ${operatorId}\n`);

const tokenId = "0.0.34248664";
const contractId = ContractId.fromString('0.0.34386232');


async function main() {

    // Token query
    const tokenInfo1 = await tQueryInfo(tokenId);
    console.log(`- Current supply key: ${tokenInfo1.supplyKey}`);

    // Update the fungible so the smart contract manages the supply
    const tokenUpdateTx = await new TokenUpdateTransaction()
        .setTokenId(tokenId)
        .setSupplyKey(contractId)
        .freezeWith(client)
        .sign(treasuryKey);
    const tokenUpdateSubmit = await tokenUpdateTx.execute(client);
    const tokenUpdateRx = await tokenUpdateSubmit.getReceipt(client);
    console.log(`- Token update status: ${tokenUpdateRx.status}`);

    // Token query
    const tokenInfo2 = await tQueryInfo(tokenId);
    console.log(`- Current supply key: ${tokenInfo2.supplyKey}\n`);

    async function tQueryInfo (_tId) {
        let info = await new TokenInfoQuery().setTokenId(_tId).execute(client);
        return info;
    }
}
main();
