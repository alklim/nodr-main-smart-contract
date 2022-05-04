console.clear();
require("dotenv").config();
const {
    AccountId,
    PrivateKey,
    Client,
    FileCreateTransaction,
    ContractCreateTransaction,
    Hbar,
    FileAppendTransaction,
} = require("@hashgraph/sdk");
const fs = require("fs");
const fspr = require("node:fs/promises")

// Configure accounts and client
const operatorId = AccountId.fromString(process.env.VALIDATOR_ID);          // deploy from validator account
const operatorKey = PrivateKey.fromString(process.env.VALIDATOR_PVKEY);     // deploy from validator account
const client = Client.forTestnet().setOperator(operatorId, operatorKey);    // deploy from validator account

async function main() {

    // Import the compiled contract bytecode
    let filePath = "./build/contracts/h22_nodr_contract.json"
    const contractByteCode = JSON.parse(fs.readFileSync(filePath,"utf8"))["bytecode"];
    console.log(`- Contract bytecode for ${filePath} is :\n${contractByteCode}\n`);

    // Create a file on Hedera and store the bytecode
    const fileCreateTx = new FileCreateTransaction()
        //.setContents(contractByteCode)              // bytecode is too big, so we must create an empty file first
        .setKeys([operatorKey])
        .setMaxTransactionFee(new Hbar(0.75))
        .freezeWith(client);
    const fileCreateSign = await fileCreateTx.sign(operatorKey);
    const fileCreateSubmit = await fileCreateSign.execute(client);
    const fileCreateRx = await fileCreateSubmit.getReceipt(client);
    const bytecodeFileId = fileCreateRx.fileId;
    console.log(`- The file id is: ${bytecodeFileId}\n`);

    // Append content to the file
    const fileAppendTx = new FileAppendTransaction()
        .setFileId(bytecodeFileId)
        .setContents(contractByteCode)
        .setMaxChunks(10)
        .setMaxTransactionFee(new Hbar(2));
    const fileAppendSubmit = await fileAppendTx.execute(client);
    const fileAppendRx = await fileAppendSubmit.getReceipt(client);
    console.log(`- Content added: ${fileAppendRx.status} \n`);


    // Instantiate the smart contract
    console.log(`- Initializing the contract... \n`);
    const contractInstantiateTx = new ContractCreateTransaction()
        .setBytecodeFileId(bytecodeFileId)
        .setAdminKey(operatorKey)
        .setGas(1000000);
    const contractInstantiateSubmit = await contractInstantiateTx.execute(client);
    const contractInstantiateRx = await contractInstantiateSubmit.getReceipt(client);
    const contractId = contractInstantiateRx.contractId;
    const contractAddress = contractId.toSolidityAddress();
    console.log(`- Contract ID is : ${contractId}, Contract address is : ${contractAddress}\n`);

    try {
        const data = new Uint8Array(Buffer.from(`## Updated on each run contract_deploy.js\nCONTRACT_ID = ${contractId}`));
        await fspr.writeFile('.env.h22.contract', data);
    } catch (err) {
        console.error(err);
    }
}
main();
