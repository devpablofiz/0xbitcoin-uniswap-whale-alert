const { MessageEmbed } = require("discord.js");
require('discord-reply');
const config = require("../../botconfig/config.json");
const ee = require("../../botconfig/embed.json");
const { AlchemyProvider } = require("@ethersproject/providers");
const ethSigUtil = require("eth-sig-util");

function checkSignature(nonce, signature) {
    const msgParams = {
        data: nonce,
        sig: signature
    };
    return ethSigUtil.recoverPersonalSignature(msgParams);
}

module.exports = {
    name: "verify",
    category: "Information",
    aliases: ["latency"],
    cooldown: 2,
    usage: "verify <hash> <ensName>",
    description: "verifies your ownership and ads roles",
    run: async (client, message, args, user, text, prefix) => {
        try {
            if (!args[0] || !args[1]) {
                return message.lineReplyNoMention(new MessageEmbed()
                    .setColor(ee.color)
                    .setFooter(ee.footertext, ee.footericon)
                    .setTitle(`**How to verify ownership**`)
                    .setDescription('Browse to https://etherscan.io/verifiedSignatures **(or google "Etherscan sign message")** \n \n' +
                        'Click on Sign Message \n \nUnder "message to sign" insert your Discord username and tag (example: Fappablo#8171) \n \n' +
                        'Click on Sign Message, Metamask will prompt you to sign and you will see your discord username in the "message" field \n \n' +
                        'Copy the Signature Hash you received and use this command again \n \n' +
                        'Usage example: -verify 0xv3r1l0ng...s1gn4tur3 fappablo.0xbitcoin.eth')
                )
            } else {
                const provider = new AlchemyProvider("homestead", config.alchemyKey);

                let hash = args[0];
                let ensName = args[1].toLowerCase();

                if(!ensName.includes(".0xbitcoin.eth") && !ensName.includes(".erc918.eth")){
                    let arr = ensName.split(".");
                    arr.shift();
                    let str = arr.join(".");
                    return message.channel.send(new MessageEmbed()
                        .setColor(ee.wrongcolor)
                        .setFooter(ee.footertext, ee.footericon)
                        .setTitle(`❌ ERROR | ${str} is not a domain in the store`)
                        .setDescription('try -verify help')
                    );
                }

                let userTag = message.member.user.tag;
                let address = await provider.resolveName(ensName);
                let sigAddress = checkSignature(userTag,hash)

                if(address.toLowerCase() === sigAddress.toLowerCase()){
                    let subdomainRole = message.guild.roles.cache.find(r => r.name === "subdomain gang");
                    message.member.roles.add(subdomainRole).catch(console.error);

                    return message.lineReplyNoMention(new MessageEmbed()
                        .setColor(ee.color)
                        .setFooter(ee.footertext, ee.footericon)
                        .setTitle(`Verified`)
                        .setDescription(`**ENS owner:** ${address} \n \n**User tag:** ${userTag} \n \n**Signer:** ${sigAddress}`)
                    );
                }else{
                    return message.lineReplyNoMention(new MessageEmbed()
                        .setColor(ee.color)
                        .setFooter(ee.footertext, ee.footericon)
                        .setTitle(`Could not verify`)
                        .setDescription(`**ENS owner:** ${address} \n \n**User tag:** ${userTag} \n \n**Signer:** ${sigAddress}`)
                    ); 
                }
            }
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
