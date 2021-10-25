//Importing all needed Commands
const { Contract } = require("@ethersproject/contracts");
const { AlchemyProvider } = require("@ethersproject/providers");
const colors = require("colors"); //this Package is used, to change the colors of our Console! (optional and doesnt effect performance)

const fs = require('fs');
const { BigNumber } = require("ethers");

const Discord = require("discord.js"); //this is the official discord.js wrapper for the Discord Api, which we use!

const baseLink = "https://etherscan.io/tx/"
const baseAccountLink = "https://etherscan.io/address/"
const poolAddress = "0xaFF587846a44aa086A6555Ff69055D3380fD379a";
const blockStep = 2;
const blockTimeMS = 13230;
const eventsBackupFile = "eventsBackup.csv";
const alchemyKey = "yourkey";
const minValueForAlert = 1;
const poolAbi = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"int256","name":"amount0","type":"int256"},{"indexed":false,"internalType":"int256","name":"amount1","type":"int256"},{"indexed":false,"internalType":"uint160","name":"sqrtPriceX96","type":"uint160"},{"indexed":false,"internalType":"uint128","name":"liquidity","type":"uint128"},{"indexed":false,"internalType":"int24","name":"tick","type":"int24"}],"name":"Swap","type":"event"}]
const ee = require("./botconfig/embed.json");

const { MessageEmbed } = require("discord.js");

//1. Import coingecko-api
const CoinGecko  = require('coingecko-api');

//2. Initiate the CoinGecko API Client
const CoinGeckoClient = new CoinGecko();

function appendFile(filePath, data) {
  return fs.appendFileSync(filePath, data);
}

function checkErr(err, exitOnError) {
    if (err !== undefined && err !== null) {
        console.log(err);
        if (exitOnError) {
            process.exit(-1);
        }
        return false;
    }
    return true;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const provider = new AlchemyProvider("homestead", alchemyKey);

const poolContract = new Contract(poolAddress, poolAbi, provider);

let swapFilter = poolContract.filters.Swap();

//last block synced
let syncBlock;

try {
  syncBlock = parseInt(fs.readFileSync("./backup.txt"));
} catch (err) {
  checkErr(err, true);
}

function saveEvent(date,type, amount0, amount1) {
  try {
    appendFile(eventsBackupFile, "[" + date.getHours() + ":" + date.getMinutes() + "]" + "," + type + "," + amount0 + "," + amount1 + "\n");
  } catch (err) {
    checkErr(err, true);
  }
}

async function getEthValue(amountETH){
    let realAmount = amountETH;
    if(amountETH < 0){
        realAmount = amountETH*-1;
    }
    const ethData = await CoinGeckoClient.coins.fetch('ethereum', {});
    const ethUsdPrice = ethData.data.market_data.current_price.usd;
    
    return (realAmount*ethUsdPrice).toFixed(0);
}

//Creating the Discord.js Client for This Bot with some default settings ;) and with partials, so you can fetch OLD messages
const client = new Discord.Client({
  messageCacheLifetime: 60,
  fetchAllMembers: false,
  messageCacheMaxSize: 10,
  restTimeOffset: 0,
  restWsBridgetimeout: 100,
  disableEveryone: true,
  partials: ['MESSAGE', 'CHANNEL', 'REACTION']
});

//Client variables to use everywhere
client.commands = new Discord.Collection(); //an collection (like a digital map(database)) for all your commands
client.aliases = new Discord.Collection(); //an collection for all your command-aliases
client.categories = fs.readdirSync("./commands/"); //categories
client.cooldowns = new Discord.Collection(); //an collection for cooldown commands of each user

//Loading files, with the client variable like Command Handler, Event Handler, ...
["command", "events"].forEach(handler => {
    require(`./handlers/${handler}`)(client);
});

//login into the bot
client.login(require("./botconfig/config.json").token);

const watch = async () => {
  while (1) {
    const channel = client.channels.cache.get('412483801265078273');
    const date = new Date();
    const latestBlock = await provider.getBlockNumber();
    if (syncBlock < latestBlock) {
      console.log("[" + date.getHours() + ":" + date.getMinutes() + "] Syncing at block " + syncBlock + "/" + latestBlock);

      //dont ask for non existing blocks
      let nextSyncBlock = syncBlock + blockStep
      if (nextSyncBlock > latestBlock) {
        nextSyncBlock = latestBlock;
      }

      let events = await poolContract.queryFilter(swapFilter, syncBlock, nextSyncBlock);
      sleep(100);

      for (const event of events) {
        if (event.event == "Swap") {
          const swap = { amount0: (BigNumber.from(event.args.amount0)/Math.pow(10,8)).toFixed(2), amount1: (BigNumber.from(event.args.amount1)/Math.pow(10,18)).toFixed(2)}

          let ethValue = await getEthValue(swap.amount1)
          console.log("Swap found, value $"+ethValue);
          saveEvent(date, "SWAP", swap.amount0, swap.amount1);
          console.log("Saved to eventsBackup");

          let account = await event.getTransactionReceipt();
          account = account.from.substring(0,8)
          console.log(account);
          if(ethValue < minValueForAlert){
            break;
          }

          if(swap.amount0 > 0){
              console.log("[" + date.getHours() + ":" + date.getMinutes() + "] Swap found: Sold "+swap.amount0+" 0xBTC for "+(swap.amount1*-1)+" Ether ($"+ethValue+")");
              try{
                channel.send(new MessageEmbed()
                  .setColor(ee.color)
                  .setFooter(ee.footertext, ee.footericon)
                  .setTitle(`:whale: New Uniswap Trade :whale: `)
                  .setDescription("["+account+"]("+baseAccountLink+account+") Sold "+swap.amount0+" **0xBTC** for "+(swap.amount1*-1)+" **ETH** (Trade value: $"+ethValue+") \n \n"+"[View Txn]("+baseLink+event.transactionHash+")")
                )
              } catch (e) {
                  console.log(String(e.stack).bgRed)
                  channel.send(new MessageEmbed()
                      .setColor(ee.wrongcolor)
                      .setFooter(ee.footertext, ee.footericon)
                      .setTitle(`❌ ERROR | An error occurred`)
                      .setDescription(`\`\`\`${e.stack}\`\`\``)
                  );
              }
          }else{
              console.log("[" + date.getHours() + ":" + date.getMinutes() + "] Swap found: Bought "+(swap.amount0*-1)+" 0xBTC for "+swap.amount1+" Ether ($"+ethValue+")");
              try{
                channel.send(new MessageEmbed()
                  .setColor(ee.color)
                  .setFooter(ee.footertext, ee.footericon)
                  .setTitle(`:whale: New Uniswap Trade :whale: `)
                  .setDescription("["+account+"]("+baseAccountLink+account+") Bought "+(swap.amount0*-1)+" **0xBTC** for "+swap.amount1+" **ETH** (Trade value: $"+ethValue+") \n \n"+"[View Txn]("+baseLink+event.transactionHash+")")
                )
              } catch (e) {
                  console.log(String(e.stack).bgRed)
                  message.channel.send(new MessageEmbed()
                      .setColor(ee.wrongcolor)
                      .setFooter(ee.footertext, ee.footericon)
                      .setTitle(`❌ ERROR | An error occurred`)
                      .setDescription(`\`\`\`${e.stack}\`\`\``)
                  );
              }
          }
        } 
      }

      syncBlock = nextSyncBlock + 1;
      console.log("[" + date.getHours() + ":" + date.getMinutes() + "] Saving (#" + syncBlock + ") to backup.txt");
      fs.writeFileSync("./backup.txt", syncBlock.toString());

      //chill for a while, don't want to make alchemy mad
      await sleep(500);
    } else {
      console.log("[" + date.getHours() + ":" + date.getMinutes() + "] Sync done (#" + latestBlock + "), waiting for new blocks");

      //saving
      fs.writeFileSync("./backup.txt", syncBlock.toString());

      console.log("[" + date.getHours() + ":" + date.getMinutes() + "] Sync status saved");

      //wait till hopefully enough blocks are mined
      await sleep(blockStep * blockTimeMS);
    }
  }
};

client.once('ready', () => {
  console.log('Ready!');
  watch();
});


