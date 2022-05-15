// SPDX-License-Identifier: GPL-3.0
//
// This contract holds all confirmed traffic in the network of nodrs
// rewards nodrs with NDR tokens depending on traffic amount and current complexity
// current complexity depends on the total summary traffic for the whole network of nodrs
// in such a way that filling each bit in the binary representation of the total summary traffic
// allocates (mint) constant number of NDR tokens

pragma solidity ^0.8.11;
pragma experimental ABIEncoderV2;

import "../hip-206/HederaTokenService.sol";
import "../hip-206/HederaResponseCodes.sol";

contract h22_nodr_contract is HederaTokenService {
    address owner;
    address tokenAddress;
    address treasuryAddress;
    uint8   k;                      // Current epoch (can start from epochFrom - 1) means that current target is (2^k)
    uint8   epochFrom;              // First rewarded epoch
    uint8   epochTo;                // Last rewarded epoch
    uint64  mintFactor;             // Amount of new NDR tokens minted during each epoch
    uint64  maxTokenSupply;         // Total supply after reward all epochs (equals (epochFrom-epochTo+1)*mintFactor)
    uint64  fraction;               // Fractionality of NDR tokens (how many decimals to count)
    uint256 currentTotalTraffic;    // Current total summary traffic that have been committed to the moment
    uint64  currentTotalTxCount;    // Current total transactions count that have been committed to the moment

    // temporary variables to test contract
    uint256 treasuryVolume;
    uint256 rewarded;

    constructor (address _tokenAddress, address _treasuryAddress) public {
        owner = msg.sender;
        tokenAddress = _tokenAddress;
        treasuryAddress = _treasuryAddress;
        k = 19;
        epochFrom = 20;
        epochTo = 61;
        mintFactor = 1e6;
        maxTokenSupply = mintFactor * (epochTo - epochFrom + 1);
        fraction= 1e9;
        currentTotalTraffic = 0;
        currentTotalTxCount = 0;

        // temporary variables to test contract
        treasuryVolume = fraction*mintFactor;
        rewarded = 0;
    }

    function getCurrentStat() public returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256) {
        return (mintFactor, maxTokenSupply, currentTotalTraffic, (1<<k), rewarded, treasuryVolume, currentTotalTxCount);
    }

    function trafficCommit(address _receiver, uint256 _amount) public returns (bool) {
        //require(msg.sender == owner);
        //require(_amount > 0 && _amount < 2**32);
        if (currentTotalTraffic + _amount < (1<<k)) {
            // if adding _amount to traffic sum WILL NOT reach target than we add it to trafficSum and reward _amount
            (bool success) = _reward(_receiver, _amount, false);        // Only if reward is successful we call _trafficAdd
            require(success);                                           // Only if reward is successful we call _trafficAdd
            _trafficAdd(_amount);                                       // Only if reward is successful we call _trafficAdd
        } else {
            // if adding _amount to traffic sum WILL reach target than we add only part of traffic and reward that part
            uint256 trafficPortion = (1<<k) - currentTotalTraffic;
            (bool success) = _reward(_receiver, trafficPortion, true);  // Only if reward is successful we call _trafficAdd
            require(success);                                           // Only if reward is successful we call _trafficAdd
            _trafficAdd(trafficPortion);                                // Only if reward is successful we call _trafficAdd
            uint256 remainingTraffic = _amount - trafficPortion;
            if (remainingTraffic > 0) trafficCommit(_receiver, remainingTraffic);
        }
        bool status = true;         // TODO: here we MUST apply the STATUS of traffic commit
        return status;
    }

    function _trafficAdd (uint256 _amount) internal {
        currentTotalTraffic += _amount;
        currentTotalTxCount++;      // tx with epoch change gives not +1 count but +(n+1) where n is epoch change count
    }

    // internal function that rewards nodr account with NDR tokens depending on traffic amount and current epoch
    function _reward (address _receiver, uint256 _amount, bool _epochChg) internal returns (bool) {
        bool result = false;
        if (k >= epochFrom && k <= epochTo) {
            uint256 reward = _epochChg ? treasuryVolume : _amount*fraction*mintFactor/(1<<(k-1));
            int64 value = int64(uint64(reward));
            (result) = _tokenTransfer(tokenAddress, treasuryAddress, _receiver, value);
            if (result) {
                rewarded += reward;
                treasuryVolume -= reward;
            }
        }
        // calling with _epochChg=true will lead to update target traffic and will mint new tokens to treasury
        if (_epochChg) {
            if (k >= epochFrom && k < epochTo) _tokenMintToTreasury(fraction*mintFactor);
            k++;
        }
        return result;
    }

    // Token transfer function that sends token amount from treasury to nodr account
    function _tokenTransfer(address _tokenId, address _sender, address _receiver, int64 _amount) internal returns (bool) {
        bool result = false;
        int response = HederaTokenService.transferToken(_tokenId, _sender, _receiver, _amount);
        if (response != HederaResponseCodes.SUCCESS) {
            revert ("Transfer Failed");
        } else {
            result = true;
        }
        return result;
    }

    // Token mint function that generates new tokens, calls on each epoch change
    function _tokenMintToTreasury(uint64 _amount) internal {
        (int response, uint64 newTotalSupply, int64[] memory serialNumbers) = HederaTokenService.mintToken(tokenAddress, _amount, new bytes[](0));
        if (response != HederaResponseCodes.SUCCESS) {
            revert ("Mint Failed");
        }
        treasuryVolume += _amount;
    }
}
