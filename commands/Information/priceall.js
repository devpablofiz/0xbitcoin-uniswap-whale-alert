const { MessageEmbed, MessageAttachment } = require("discord.js");
require('discord-reply');
var fs = require('fs');
const config = require("../../botconfig/config.json");
const CoinGecko = require('coingecko-api');
const ee = require("../../botconfig/embed.json");

module.exports = {
    name: "priceall",
    category: "Information",
    aliases: ["price"],
    cooldown: 2,
    usage: "priceall",
    description: "0xbitcoin price and volume",
    run: async (client, message, args, user, text, prefix) => {
        try {

            //2. Initiate the CoinGecko API Client
            const CoinGeckoClient = new CoinGecko();
            const data = await CoinGeckoClient.coins.fetch('oxbitcoin', { market_data: false, community_data: false, developer_data: false, localization: false, sparkline: false });
            const tickers = data.data.tickers;
            let msg = "";
            for (const ticker of tickers) {
                const toAdd = `---${ticker.market.name}--- \nPrice: $${ticker.converted_last.usd.toFixed(3)} => Ξ${ticker.converted_last.eth.toFixed(6)} \nVolume: $${ticker.volume.toFixed(0)}\n\n`;
                msg += toAdd;
            }

            message.lineReplyNoMention(new MessageEmbed()
                .setColor(ee.color)
                .setFooter(ee.footertext, ee.footericon)
                .setDescription('```' + msg + '```')
            );

        } catch (e) {
            console.log(String(e.stack).bgRed)
            return message.lineReplyNoMention(new MessageEmbed()
                .setColor(ee.wrongcolor)
                .setFooter(ee.footertext, ee.footericon)
                .setTitle(`❌ ERROR | An error occurred`)
                .setDescription(`\`\`\`${e.stack}\`\`\``)
            );
        }
    }
}

/** Template by Tomato#6966 | https://github.com/Tomato6966/Discord-Js-Handler-Template */
