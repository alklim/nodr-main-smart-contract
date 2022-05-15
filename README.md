# NODR Smart Contract on Hedera network
https://nodr.io/

Contract `contracts/H22_nodr_contract.sol` holds all confirmed traffic in the network of nodrs, rewards nodrs with NDR tokens depending on traffic amount and current complexity.  
Current complexity depends on the total summary traffic for the whole network of nodrs in such a way that filling each bit in the binary representation of the total summary traffic allocates (mint) constant number of NDR tokens.


## How to deploy
Create the token:  
`> node contract_H22_token_create.js`

Compile the contract:  
`> truffle compile`

Deploy compiled contract on Hedera testnet:  
`> node contract_H22_deploy.js`  

Update the token so the contract manages the token supply and transfer from treasury:  
`> node contract_H22_token_update.js`
  
## Tests
To read from and write to contract use:  
`> node test/contract_H22_query.js`  

To see the current balances of NDR token for specific Hedera AccountId use:  
`> node test/contract_H22_token_balance_check.js`  
