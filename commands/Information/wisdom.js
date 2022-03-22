const { MessageEmbed } = require("discord.js");
require('discord-reply');
var fs = require('fs');
const config = require("../../botconfig/config.json");
const ee = require("../../botconfig/embed.json");

function getRandomLine(filename) {
    var data = fs.readFileSync(filename, "utf8");
    var lines = data.split('\n');
    return lines[Math.floor(Math.random() * lines.length)];
}

module.exports = {
    name: "wisdom",
    category: "Information",
    aliases: ["wisdom"],
    cooldown: 2,
    usage: "wisdom",
    description: "Gives you words of wisdom",
    run: async (client, message, args, user, text, prefix) => {
        try {
            let the_random_line_text = getRandomLine("./botconfig/comments.txt");
            message.channel.send(new MessageEmbed()
                .setColor(ee.color)
                .setFooter(ee.footertext, ee.footericon)
                .setTitle(`Words of wisdom from the Deployer`)
                .setDescription('```'+the_random_line_text+'```')
            );
        } catch (e) {
            console.log(String(e.stack).bgRed)
            return message.channel.send(new MessageEmbed()
                .setColor(ee.wrongcolor)
                .setFooter(ee.footertext, ee.footericon)
                .setTitle(`❌ ERROR | An error occurred`)
                .setDescription(`\`\`\`${e.stack}\`\`\``)
            );
        }
    }
}

/** Template by Tomato#6966 | https://github.com/Tomato6966/Discord-Js-Handler-Template */
