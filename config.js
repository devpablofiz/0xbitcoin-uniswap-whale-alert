module.exports.poolAddress = "0xaFF587846a44aa086A6555Ff69055D3380fD379a"; //the address of the liquidity pool you wish to track (0xaFF587846a44aa086A6555Ff69055D3380fD379a -> 0xBTC / wETH UniswapV3)
module.exports.blockStep = 2; //blocks to process per cycle
module.exports.blockTimeMS = 13230; //average time before an ethereum block is mined
module.exports.alchemyKey = "keyhere"; //alchemy https://dashboard.alchemyapi.io/
module.exports.minValueForAlert = 2000; //USD threshold value of the trade
module.exports.eventsBackupFile = "eventsBackup.csv"; //file to backup events to
module.exports.latestBlockBackupFile = "blockBackup.txt"; //file to backup latest block processed
module.exports.twitterAPIBearer = "keyhere";
module.exports.discordChannel = '412483801265078273'; //channel to post in (412483801265078273 is 0xbtc's trade channel)
module.exports.lastTradeBackupFile = "tradeBackup.txt";

module.exports.twitterConfig = {  
    consumer_key: 'keyhere' ,  
    consumer_secret: 'keyhere',  
    access_token_key: 'keyhere',  
    access_token_secret: 'keyhere'
}

//contract abi for the liquidity pool (only need the swap event)
module.exports.poolAbi = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"int256","name":"amount0","type":"int256"},{"indexed":false,"internalType":"int256","name":"amount1","type":"int256"},{"indexed":false,"internalType":"uint160","name":"sqrtPriceX96","type":"uint160"},{"indexed":false,"internalType":"uint128","name":"liquidity","type":"uint128"},{"indexed":false,"internalType":"int24","name":"tick","type":"int24"}],"name":"Swap","type":"event"}];
