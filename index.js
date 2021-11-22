//Importing all needed Commands
const { Contract } = require("@ethersproject/contracts");
const { AlchemyProvider } = require("@ethersproject/providers");
const { formatEther } = require("@ethersproject/units");
const colors = require("colors");
const fs = require('fs');
const { BigNumber } = require("ethers");
const Discord = require("discord.js");
const { uniV3Address, uniV2Address, blockStep, blockTimeMS, alchemyKey, minValueForAlert, uniV3Abi, uniV2Abi, latestBlockBackupFile, eventsBackupFile, twitterConfig, discordChannel, lastTradeBackupFile, minArbMargin } = require("./config.js");
const twitter = require('twitter-lite');
const ee = require("./botconfig/embed.json");
const { MessageEmbed } = require("discord.js");
const CoinGecko = require('coingecko-api');

const baseLink = "https://etherscan.io/tx/"
const baseAccountLink = "https://etherscan.io/address/"

const CoinGeckoClient = new CoinGecko();
const twitterClient = new twitter(twitterConfig);

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

const uniV3 = new Contract(uniV3Address, uniV3Abi, provider);
const uniV2 = new Contract(uniV2Address, uniV2Abi, provider);

let v3swapFilter = uniV3.filters.Swap();
let v2swapFilter = uniV2.filters.Swap();

//last block synced
let syncBlock;

try {
  syncBlock = parseInt(fs.readFileSync(latestBlockBackupFile));
} catch (err) {
  checkErr(err, true);
}

function saveEvent(date, type, amount0, amount1) {
  try {
    appendFile(eventsBackupFile, "[" + date.getHours() + ":" + date.getMinutes() + "]" + "," + type + "," + amount0 + "," + amount1 + "\n");
  } catch (err) {
    checkErr(err, true);
  }
}

function toPositive(value) {
  if (value < 0) {
    return value * -1
  } else {
    return value
  }
}

async function getEthValue(amountETH) {
  let realAmount = toPositive(amountETH);
  const ethData = await CoinGeckoClient.coins.fetch('ethereum', {});
  const ethUsdPrice = ethData.data.market_data.current_price.usd;

  return (realAmount * ethUsdPrice).toFixed(0);
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
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
client.categories = fs.readdirSync("./commands/");
client.cooldowns = new Discord.Collection();

//Loading files, with the client variable like Command Handler, Event Handler, ...
["command", "events"].forEach(handler => {
  require(`./handlers/${handler}`)(client);
});

let lastTrade;
try {
  lastTrade = parseFloat(fs.readFileSync(lastTradeBackupFile));
  console.log("Last " + lastTrade);
} catch (err) {
  checkErr(err, true);
}

client.on('message', (message) => {
  const { channel } = message;

  if (channel.type === 'news') {
    message.crosspost()
    console.log('published news message');
  }
})

//login into the bot
client.login(require("./botconfig/config.json").token);

const watch = async () => {
  while (1) {
    client.user.setActivity('$' + lastTrade, { type: 'PLAYING' });
    const channel = client.channels.cache.get(discordChannel);
    const date = new Date();
    const latestBlock = await provider.getBlockNumber();
    let arbs = []

    if (syncBlock < latestBlock) {
      console.log("[" + date.getHours() + ":" + date.getMinutes() + "] Syncing at block " + syncBlock + "/" + latestBlock);

      //dont ask for non existing blocks
      let nextSyncBlock = syncBlock + blockStep
      if (nextSyncBlock > latestBlock) {
        nextSyncBlock = latestBlock;
      }

      let v2events = await uniV2.queryFilter(v2swapFilter, syncBlock, nextSyncBlock);
      sleep(100);
      let v3events = await uniV3.queryFilter(v3swapFilter, syncBlock, nextSyncBlock);
      sleep(100);


      /**
       *  V3 EVENTS
       */
      for (const event of v3events) {
        if (event.event == "Swap") {
          let isArb = false;
          let margin = 0;
          let txn = await event.getTransactionReceipt();
          let account = txn.from;
          
          let ensName = await provider.lookupAddress(account);

          let gasUsed = txn.gasUsed;
          let gasPrice = formatEther(txn.effectiveGasPrice);
          let txnCost = gasUsed*gasPrice

          const swap = { amount0: (BigNumber.from(event.args.amount0) / Math.pow(10, 8)).toFixed(2), amount1: (BigNumber.from(event.args.amount1) / Math.pow(10, 18)).toFixed(5) }

          for (const v2event of v2events) {
            let v2swap;

            //if its a sale
            if (BigNumber.from(v2event.args.amount0In) != 0) {
              v2swap = { amount0: (BigNumber.from(v2event.args.amount0In) / Math.pow(10, 8)).toFixed(2), amount1: (BigNumber.from(v2event.args.amount1Out) / Math.pow(10, 18)).toFixed(5) }
            } else {
              //its a buy
              v2swap = { amount0: (BigNumber.from(v2event.args.amount0Out) / Math.pow(10, 8) * -1).toFixed(2), amount1: (BigNumber.from(v2event.args.amount1In) / Math.pow(10, 18)).toFixed(5) }
            }

            if (toPositive(v2swap.amount0) == toPositive(swap.amount0) && v2event.transactionHash == event.transactionHash) {
              isArb = true;
              arbs.push(event.transactionHash);
              if (v2swap.amount1 > swap.amount1) {
                margin = toPositive(v2swap.amount1) - toPositive(swap.amount1);
              } else {
                margin = toPositive(swap.amount1) - toPositive(v2swap.amount1);
              }
            }
          }

          if (margin != 0) {
            margin = (toPositive(margin) - txnCost).toFixed(5)
          }

          let ethValue = await getEthValue(swap.amount1)
          console.log("Swap found, value $" + ethValue);

          lastTrade = (ethValue / toPositive(swap.amount0)).toFixed(2);
          console.log("[" + date.getHours() + ":" + date.getMinutes() + "] Saving last trade $" + lastTrade + " to " + lastTradeBackupFile);
          fs.writeFileSync(lastTradeBackupFile, lastTrade.toString());
          client.user.setActivity('$' + lastTrade, { type: 'PLAYING' });

          saveEvent(date, "SWAPv3", swap.amount0, swap.amount1);
          console.log("Saved to eventsBackup");

          if (margin != 0 && margin < minArbMargin) {
            break;
          }

          if (isArb) {
            try {
              channel.send(new MessageEmbed()
                .setColor(ee.color)
                .setFooter(ee.footertext, ee.footericon)
                .setTitle(`:whale: New Uniswap Arbitrage Trade :whale: `)
                .setDescription("[" + ((ensName) ? ensName : account.substring(0, 8)) + "](" + baseAccountLink + account + ") Arbitraged " + toPositive(swap.amount0) + " **0xBTC** for a margin of " + margin + " **ETH** (Trade value: $" + ethValue + ") \n \n" + "[View Txn](" + baseLink + event.transactionHash + ")")
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
          } else if (swap.amount0 > 0 && ethValue > minValueForAlert) {
            console.log("[" + date.getHours() + ":" + date.getMinutes() + "] Swap found: Sold " + swap.amount0 + " 0xBTC for " + (swap.amount1 * -1) + " Ether ($" + ethValue + ")");

            try {
              let status = "🐳 " + ((ensName) ? ensName : account.substring(0, 8)) + " Sold " + swap.amount0 + " #0xBTC for " + (swap.amount1 * -1) + " #ETH (Trade value: $" + ethValue + ") \n" + baseLink + event.transactionHash;

              await twitterClient.post('statuses/update', { status: status }).then(result => {
                console.log('[INFO] You successfully tweeted this : "' + result.text + '"');
              })
            } catch (e) {
              console.log(e)
            }

            try {
              channel.send(new MessageEmbed()
                .setColor(ee.color)
                .setFooter(ee.footertext, ee.footericon)
                .setTitle(`:whale: New Uniswap V3 Trade :whale: `)
                .setDescription("[" + ((ensName) ? ensName : account.substring(0, 8)) + "](" + baseAccountLink + account + ") Sold " + swap.amount0 + " **0xBTC** for " + (swap.amount1 * -1).toFixed(2) + " **ETH** (Trade value: $" + ethValue + ") \n \n" + "[View Txn](" + baseLink + event.transactionHash + ")")
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
          } else if(ethValue > minValueForAlert) {
            console.log("[" + date.getHours() + ":" + date.getMinutes() + "] Swap found: Bought " + (swap.amount0 * -1) + " 0xBTC for " + swap.amount1 + " Ether ($" + ethValue + ")");

            try {
              let status = "🐳 " + ((ensName) ? ensName : account.substring(0, 8)) + " Bought " + (swap.amount0 * -1) + " #0xBTC for " + swap.amount1 + " #ETH (Trade value: $" + ethValue + ") \n" + baseLink + event.transactionHash;
              await twitterClient.post('statuses/update', { status: status }).then(result => {
                console.log('[INFO] You successfully tweeted this : "' + result.text + '"');
              })
            } catch (e) {
              console.log(e)
            }

            try {
              channel.send(new MessageEmbed()
                .setColor(ee.color)
                .setFooter(ee.footertext, ee.footericon)
                .setTitle(`:whale: New Uniswap V3 Trade :whale: `)
                .setDescription("[" + ((ensName) ? ensName : account.substring(0, 8)) + "](" + baseAccountLink + account + ") Bought " + (swap.amount0 * -1) + " **0xBTC** for " + (swap.amount1*1).toFixed(2) + " **ETH** (Trade value: $" + ethValue + ") \n \n" + "[View Txn](" + baseLink + event.transactionHash + ")")
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
      sleep(100);
      /**
       * V2 EVENTS
       */
      for (const event of v2events) {
        if (event.event == "Swap" && !arbs.includes(event.transactionHash)) {
          let swap;

          //if its a sale
          if (BigNumber.from(event.args.amount0In) != 0) {
            swap = { amount0: (BigNumber.from(event.args.amount0In) / Math.pow(10, 8)).toFixed(2), amount1: (BigNumber.from(event.args.amount0Out) / Math.pow(10, 18)).toFixed(2) }
          } else {
            //its a buy
            swap = { amount0: (BigNumber.from(event.args.amount0Out) / Math.pow(10, 8) * -1).toFixed(2), amount1: (BigNumber.from(event.args.amount1In) / Math.pow(10, 18)).toFixed(2) }
          }


          let ethValue = await getEthValue(swap.amount1)
          console.log("Swap found, value $" + ethValue);

          saveEvent(date, "SWAPv2", swap.amount0, swap.amount1);
          console.log("Saved to eventsBackup");

          let account = await event.getTransactionReceipt();
          account = account.from;
          //console.log(account);
          if (ethValue < minValueForAlert) {
            break;
          }

          if (swap.amount0 > 0) {
            console.log("[" + date.getHours() + ":" + date.getMinutes() + "] Swap found: Sold " + swap.amount0 + " 0xBTC for " + swap.amount1 + " Ether ($" + ethValue + ")");

            try {
              let status = "🐳 " + ((ensName) ? ensName : account.substring(0, 8)) + " Sold " + swap.amount0 + " #0xBTC for " + swap.amount1 + " #ETH (Trade value: $" + ethValue + ") \n" + baseLink + event.transactionHash;

              await twitterClient.post('statuses/update', { status: status }).then(result => {
                console.log('[INFO] You successfully tweeted this : "' + result.text + '"');
              })
            } catch (e) {
              console.log(e)
            }

            try {
              channel.send(new MessageEmbed()
                .setColor(ee.color)
                .setFooter(ee.footertext, ee.footericon)
                .setTitle(`:whale: New Uniswap V2 Trade :whale: `)
                .setDescription("[" + ((ensName) ? ensName : account.substring(0, 8)) + "](" + baseAccountLink + account + ") Sold " + swap.amount0 + " **0xBTC** for " + (swap.amount1 * -1) + " **ETH** (Trade value: $" + ethValue + ") \n \n" + "[View Txn](" + baseLink + event.transactionHash + ")")
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
          } else {
            console.log("[" + date.getHours() + ":" + date.getMinutes() + "] Swap found: Bought " + (swap.amount0 * -1) + " 0xBTC for " + swap.amount1 + " Ether ($" + ethValue + ")");

            try {
              let status = "🐳 " + ((ensName) ? ensName : account.substring(0, 8)) + " Bought " + (swap.amount0 * -1) + " #0xBTC for " + swap.amount1 + " #ETH (Trade value: $" + ethValue + ") \n" + baseLink + event.transactionHash;
              await twitterClient.post('statuses/update', { status: status }).then(result => {
                console.log('[INFO] You successfully tweeted this : "' + result.text + '"');
              })
            } catch (e) {
              console.log(e)
            }

            try {
              channel.send(new MessageEmbed()
                .setColor(ee.color)
                .setFooter(ee.footertext, ee.footericon)
                .setTitle(`:whale: New Uniswap V2 Trade :whale: `)
                .setDescription("[" + ((ensName) ? ensName : account.substring(0, 8)) + "](" + baseAccountLink + account + ") Bought " + (swap.amount0 * -1) + " **0xBTC** for " + swap.amount1 + " **ETH** (Trade value: $" + ethValue + ") \n \n" + "[View Txn](" + baseLink + event.transactionHash + ")")
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
      console.log("[" + date.getHours() + ":" + date.getMinutes() + "] Saving (#" + syncBlock + ") to " + latestBlockBackupFile);
      fs.writeFileSync(latestBlockBackupFile, syncBlock.toString());

      //chill for a while, don't want to make alchemy mad
      await sleep(500);
    } else {
      console.log("[" + date.getHours() + ":" + date.getMinutes() + "] Sync done (#" + latestBlock + "), waiting for new blocks");

      //saving
      fs.writeFileSync(latestBlockBackupFile, syncBlock.toString());

      console.log("[" + date.getHours() + ":" + date.getMinutes() + "] Sync status saved");

      //wait till hopefully enough blocks are mined
      await sleep(blockStep * blockTimeMS);
    }
  }
};

client.once('ready', () => {
  console.log('Ready!');
  client.user.setActivity('$' + lastTrade, { type: 'PLAYING' });
  watch();
});


