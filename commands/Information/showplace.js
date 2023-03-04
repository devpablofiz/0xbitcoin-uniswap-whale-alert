const { MessageEmbed, MessageAttachment } = require("discord.js");
require('discord-reply');
var fs = require('fs');
const config = require("../../botconfig/config.json");
const ee = require("../../botconfig/embed.json");
//const captureWebsite = require('capture-website');
const captureWebsite = (...args) => import('capture-website').then(({ default: captureWebsite }) => captureWebsite.file(...args));
module.exports = {
  name: "showplace",
  category: "Information",
  aliases: ["showplace", "show", "pixels", "0xbitcoinplace"],
  cooldown: 2,
  usage: "showplace",
  description: "Sends a screenshot from https://0xbitcoin-space.vercel.app/",
  run: async (client, message, args, user, text, prefix) => {
    try {
      fs.stat('place-file.png', function (err, stats) {
        //console.log(stats);//here we got all information of file in stats variable

        if (err) {
          return console.error(err);
        }

        fs.unlink('place-file.png', function (err) {
          if (err) return console.log(err);
          //console.log('file deleted successfully');
        });
      });
      await captureWebsite('https://0xbitcoin-space.vercel.app/', 'place-file.png', {
        width: 1000,
        height: 1000,
        element: "#root > div.site-section.smaller-section > div.canvas-wrapper > canvas",
        hideElements: ["#root > div.site-section.smaller-section > div.canvas-wrapper > div", "#root > div.navbar", "#root > section", "#root > div.site-section.smaller-section > div.sketch-picker.circle-color-picker", "#root > div.site-section.smaller-section > div.shopping-cart", "#root > div.site-section.smaller-section > div.scaling-buttons", "#root > section > div"],
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
          ]
        }
      });
      const file = new MessageAttachment(`place-file.png`);
      message.lineReplyNoMention(new MessageEmbed()
        .setColor(ee.color)
        .setFooter(ee.footertext, ee.footericon)
        .setImage(`attachment://place-file.png`)
        .setDescription('[Go to the website](https://0xbitcoin-space.vercel.app/)')
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
