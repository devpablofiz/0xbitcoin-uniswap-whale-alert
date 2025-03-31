const { MessageEmbed, MessageAttachment } = require("discord.js");
require('discord-reply');
var fs = require('fs');
const config = require("../../botconfig/config.json");
const { CoinGeckoClient } = require('coingecko-api-v3');
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
            const coinGecko = new CoinGeckoClient({
  timeout: 10000,
  autoRetry: true,
});
            const data = await coinGecko.simplePrice({vs_currencies:"usd",ids:"oxbitcoin"});

            message.lineReplyNoMention(new MessageEmbed()
                .setColor(ee.color)
                .setFooter(ee.footertext, ee.footericon)
                .setDescription('``` $' + data.oxbitcoin.usd.toFixed(3) + '```')
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
