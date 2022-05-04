const {
    AccountId,
    PrivateKey,
    Client,
    ContractExecuteTransaction,
    ContractFunctionParameters,
    ContractCallQuery,
    Hbar,
    AccountBalanceQuery,
    TokenAssociateTransaction,
} = require("@hashgraph/sdk");

// Configure accounts and client
require("dotenv").config();
const operatorId = AccountId.fromString(process.env.VALIDATOR_ID);
const operatorKey = PrivateKey.fromString(process.env.VALIDATOR_PVKEY);
const client = Client.forTestnet().setOperator(operatorId, operatorKey);
const treasuryId = AccountId.fromString(process.env.TREASURY_ID);
const treasuryKey = PrivateKey.fromString(process.env.TREASURY_PVKEY);

// Configure token
require("dotenv").config({ path: `.env.h22.token`});
const tokenId = AccountId.fromString(process.env.TOKEN_ID);
console.log(`Use token id : ${tokenId}`);

// Configure contract id
require("dotenv").config({ path: `.env.h22.contract`});
const contractId = process.env.CONTRACT_ID;
console.log(`Use contract id : ${contractId}\n`);

// Configure token receiver account
require("dotenv").config({ path: `./credentials/nodr04.env`});
const receiverId = AccountId.fromString(process.env.ACCOUNT_ID);
const receiverKey = PrivateKey.fromString(process.env.NODR_PVKEY);
console.log(`Receiver id: ${receiverId}`);
console.log(`Receiver private key: ${receiverKey}\n`);

async function main() {

    async function readContract(_callFunction) {
        console.log(`- ContractExecuteTransaction for contract ${contractId}, call function ${_callFunction}\n`);
        const readTx1 = new ContractExecuteTransaction()
            .setContractId(contractId)
            .setGas(100000)
            .setFunction(_callFunction)
            .setMaxTransactionFee(new Hbar(0.75));
        const readTxSubmit1 = await readTx1.execute(client);
        const readTxResult1 = await readTxSubmit1.getRecord(client);
        console.log(`- Contract execute status : ${readTxResult1.receipt.status}\n`);

        // finding how many 32-byte words tuple contains
        const len = readTxResult1.contractFunctionResult.bytes.length / (256 / 8);
        if (len > 0) {
            // construct array of 32-byte words
            let response = [];
            for (let i = 0; i < len; i++) {
                response.push(readTxResult1.contractFunctionResult.getUint256(i));
            }
            let r = response[4]/1e9;
            response[4] = r;
            r = response[5]/1e9;
            response[5] = r;
            return response;
        } else {
            return null;
        }
    }

    // If write to the contract will lead to token transfer from treasury, then Tx MUST be signed by the treasury key!
    async function writeContract(_callFunction, _param1, _param2) {
        console.log(`- ContractExecuteTransaction for contract ${contractId}, call function ${_callFunction}\n`);
        const writeTx = new ContractExecuteTransaction()
            .setContractId(contractId)
            .setGas(1000000)
            .setFunction(_callFunction, new ContractFunctionParameters().addAddress(_param1.toSolidityAddress()).addUint256(_param2))
            .setMaxTransactionFee(new Hbar(0.75))
            .freezeWith(client);
        const writeTxSigned = await writeTx.sign(treasuryKey);
        const writeTxSubmit = await writeTxSigned.execute(client);
        const writeTxResult = await writeTxSubmit.getRecord(client);
        console.log(`- Contract execute status : ${writeTxResult.receipt.status}\n`);
        return null;
    }

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

    let cf = "getCurrentStat";
    let res = await readContract(cf);
    console.log(`- Response for ${cf} : ${res}\n`);

    let timeout = 2000;
    console.log(`Start waiting for ${timeout} msec...`);
    await new Promise(resolve => setTimeout(resolve, timeout));
    console.log(`Finish waiting for ${timeout} msec, continue \n`);

    cf = "trafficCommit";
    let value = 2*524288;
    res = await bCheckerFcn(receiverId, tokenId.toString());
    console.log(`- Account ${receiverId} balance for token ${tokenId} is: ${res}`);
    if (res === undefined) await tokenAssociation(receiverId, tokenId, receiverKey);
    res = await writeContract(cf, receiverId, value);
    console.log(`- Response for ${cf}, trying to add ${value} : ${res}\n`);

    timeout = 2000;
    console.log(`Start waiting for ${timeout} msec...`);
    await new Promise(resolve => setTimeout(resolve, timeout));
    console.log(`Finish waiting for ${timeout} msec, continue \n`);

    cf = "getCurrentStat";
    res = await readContract(cf);
    console.log(`- Response for ${cf} : ${res}\n`);

}
main();

