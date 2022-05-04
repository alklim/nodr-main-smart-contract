console.clear();
require("dotenv").config();
const {
    AccountId,
    PrivateKey,
    Client,
    TokenInfoQuery,
    ContractId,
    TokenUpdateTransaction
} = require("@hashgraph/sdk");

// Configure accounts and client
const treasuryId = AccountId.fromString(process.env.TREASURY_ID);
const treasuryKey = PrivateKey.fromString(process.env.TREASURY_PVKEY);
const client = Client.forTestnet().setOperator(treasuryId, treasuryKey);

// Configure token
require("dotenv").config({ path: `.env.h22.token`});
const tokenId = AccountId.fromString(process.env.TOKEN_ID);
console.log(`Use token id: ${tokenId} (solidity format ${tokenId.toSolidityAddress()})` );
console.log(`Use treasury id: ${treasuryId} (solidity format ${treasuryId.toSolidityAddress()})\n`)

// Configure contract id
require("dotenv").config({ path: `.env.h22.contract`});
const contractId = ContractId.fromString(process.env.CONTRACT_ID);
console.log(`Use contract id : ${contractId}\n`);

async function main() {

    // Token query
    const tokenInfo1 = await tQueryInfo(tokenId.toString());
    console.log(`- Current supply key: ${tokenInfo1.supplyKey}`);

    // Update the fungible so the smart contract manages the supply
    const tokenUpdateTx = await new TokenUpdateTransaction()
        .setTokenId(tokenId.toString())
        .setAdminKey(treasuryKey)
        .setSupplyKey(contractId)
        .freezeWith(client)
        .sign(treasuryKey);
    const tokenUpdateSubmit = await tokenUpdateTx.execute(client);
    const tokenUpdateRx = await tokenUpdateSubmit.getReceipt(client);
    console.log(`- Token update status: ${tokenUpdateRx.status}`);

    // Token query
    const tokenInfo2 = await tQueryInfo(tokenId.toString());
    console.log(`- Current supply key: ${tokenInfo2.supplyKey}\n`);

    async function tQueryInfo (_tId) {
        let info = await new TokenInfoQuery().setTokenId(_tId).execute(client);
        return info;
    }
}
main();
