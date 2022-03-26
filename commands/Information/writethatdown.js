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
    name: "writethatdown",
    category: "Information",
    aliases: ["writethatdown"],
    cooldown: 2,
    usage: "writethatdown",
    description: "Adds to the words of wisdom",
    run: async (client, message, args, user, text, prefix) => {
        try {

            if (!message.reference){
                return message.channel.send(new MessageEmbed()
                    .setColor(ee.wrongcolor)
                    .setFooter(ee.footertext, ee.footericon)
                    .setTitle(`❌ ERROR | Must be a reply to the wise words`)
                );
            }            

            const repliedTo = await message.channel.messages.fetch(message.reference.messageID);

            //if the sender is not apexmfer.eth
            if(repliedTo.author.id !== "219123933767532544"){
                return message.channel.send(new MessageEmbed()
                    .setColor(ee.color)
                    .setFooter(ee.footertext, ee.footericon)
                    .setTitle(`These words were not spoken by the Deployer`)
                    .setDescription('```'+"Beware of false prophets, who come to you in sheep's clothing but inwardly are ravenous wolves. You will know them by their fruits. Are grapes gathered from thorns, or figs from thistles? So, every sound tree bears good fruit, but the bad tree bears evil fruit. A sound tree cannot bear evil fruit, nor can a bad tree bear good fruit. Every tree that does not bear good fruit is cut down and thrown into the fire. Thus you will know them by their fruits."+'```')
                );    
            }

            var stream = fs.createWriteStream("./botconfig/comments.txt", {flags:'a'});
            stream.write(repliedTo.content+"\n")
            message.channel.send(new MessageEmbed()
                .setColor(ee.color)
                .setFooter(ee.footertext, ee.footericon)
                .setTitle(`These incredibly wise words have been written down`)
                .setDescription('```'+repliedTo.content+'```')
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
