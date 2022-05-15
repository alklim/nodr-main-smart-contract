const {
    AccountId,
    PrivateKey,
    Client,
    ContractExecuteTransaction,
    ContractFunctionParameters,
    Hbar,
    AccountBalanceQuery,
    TokenAssociateTransaction,
} = require("@hashgraph/sdk");

// Configure accounts and client
require("dotenv").config();
const operatorId = AccountId.fromString(process.env.VALIDATOR_ID);
const operatorKey = PrivateKey.fromString(process.env.VALIDATOR_PVKEY);
const client = Client.forTestnet().setOperator(operatorId, operatorKey);
//console.log(`Use operator id : ${operatorId}`);
//console.log(`Use operator key : ${operatorKey}\n`);

// Configure token
require("dotenv").config({ path: `.env.h22.token`});
const tokenId = AccountId.fromString(process.env.TOKEN_ID);
//console.log(`Use token id : ${tokenId}`);

// Configure contract id
require("dotenv").config({ path: `.env.h22.contract`});
const contractId = process.env.CONTRACT_ID;
//console.log(`Use contract id : ${contractId}`);

// Configure token receiver account
require("dotenv").config({ path: `./credentials/nodr02.env`});
const receiverId = AccountId.fromString(process.env.ACCOUNT_ID);
const receiverKey = PrivateKey.fromString(process.env.NODR_PVKEY);
//console.log(`Receiver id: ${receiverId}`);
//console.log(`Receiver private key: ${receiverKey}\n`);

async function main() {

    async function bCheckerFcn(_aId, _tId) {
        let balanceCheckTx = await new AccountBalanceQuery().setAccountId(_aId).execute(client);
        return balanceCheckTx.tokens._map.get(_tId);
    }

    // Associates the provided account with the provided tokens, must be signed by the provided Account's key
    async function tokenAssociation(_accId, _tokenId, _accPvKey) {
        let associateAccTx = await new TokenAssociateTransaction()
            .setAccountId(_accId)
            .setTokenIds([_tokenId.toString()])
            .freezeWith(client)
            .sign(_accPvKey);
        let associateAccTxSubmit = await associateAccTx.execute(client);
        let associateAccRx = await associateAccTxSubmit.getReceipt(client);
        console.log(`- Token association with account ${_accId} for token ${_tokenId} status: ${associateAccRx.status}`);
    }

    let res = await bCheckerFcn(receiverId, tokenId.toString());
    console.log(`- Account ${receiverId} balance for token ${tokenId} is: ${res/10e9}`);
    if (res === undefined) await tokenAssociation(receiverId, tokenId, receiverKey);
}
main();

