const { MessageEmbed, MessageAttachment } = require("discord.js");
require('discord-reply');
var fs = require('fs');
const config = require("../../botconfig/config.json");
const ee = require("../../botconfig/embed.json");
//const captureWebsite = require('capture-website');
const captureWebsite = (...args) => import('capture-website').then(({default: captureWebsite}) => captureWebsite.file(...args));
module.exports = {
    name: "halvening",
    category: "Information",
    aliases: ["halving"],
    cooldown: 2,
    usage: "halvening",
    description: "Sends a screenshot from halvening.0xbitcoin.xyz",
    run: async (client, message, args, user, text, prefix) => {
    try{ 
      fs.stat('local-file.png', function (err, stats) {
        //console.log(stats);//here we got all information of file in stats variable
        
        if (err) {
            return console.error(err);
        }
      
        fs.unlink('local-file.png',function(err){
             if(err) return console.log(err);
             //console.log('file deleted successfully');
        });  
      });
      await captureWebsite('https://0xbitcoin.xyz/halvening','local-file.png', {
          width: 420,
          height: 420,
          waitForElement: "#root > div > div:nth-child(1) > div > div > div:nth-child(2) > div",
          hideElements: [
            '#root > div > div.container', '#background-video'
            ],
          launchOptions: {
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        }
      });
      const file = new MessageAttachment(`local-file.png`);
      message.lineReplyNoMention(new MessageEmbed()
        .setColor(ee.color)
        .setFooter(ee.footertext, ee.footericon)
        .setImage(`attachment://local-file.png`)
        .setDescription('[Go to the website](https://halvening.0xbitcoin.xyz/)')
        .attachFiles(file)
      )
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
