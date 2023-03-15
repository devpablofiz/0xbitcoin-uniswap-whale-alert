const { MessageEmbed, MessageAttachment } = require("discord.js");
require('discord-reply');
const config = require("../../botconfig/config.json");
const ee = require("../../botconfig/embed.json");
const fs = require('fs');
const fetch = require("node-fetch");
const { BigNumber } = require("ethers");

const { Contract } = require("@ethersproject/contracts");
const { AlchemyProvider } = require("@ethersproject/providers");
const { memesNFTAddress, memesAuctionAddress, memesNFTAbi, memesAuctionAbi } = require("../../config.js");

const provider = new AlchemyProvider("homestead", config.alchemyKey);
const nftContract = new Contract(memesNFTAddress, memesNFTAbi, provider);
const auctionContract = new Contract(memesAuctionAddress, memesAuctionAbi, provider);

const baseEtherscanLink = "https://etherscan.io/address/";
const baseOpenseaLink = "https://opensea.io/assets/0xabdFb5eb2ac4d43dC18d8253494A6002A363effd/";

module.exports = {
    name: "jpeg",
    category: "Information",
    aliases: ["jpeg", "0xjpeg"],
    cooldown: 10,
    usage: "jpeg <jpegID> | <ensName>",
    description: "Shows an image of the 0xjpeg",
    run: async (client, message, args, user, text, prefix) => {
        try {
            if (!args[0]) {
                return message.lineReplyNoMention(new MessageEmbed()
                    .setColor(ee.wrongcolor)
                    .setFooter(ee.footertext, ee.footericon)
                    .setTitle(`❌ ERROR | You didn't provide an ID`)
                    .setDescription(`Usage: \`${prefix}${this.usage}\``)
                );
            } else if (args[0] === "price") {
                const mintedTokenCount = await nftContract.mintedTokenCount().catch((err) => console.log(err));
                const blockNum = await provider.getBlockNumber();
                const price = await auctionContract.getMintPrice(blockNum);
                const uriExtension = await nftContract.uriExtensions(mintedTokenCount).catch((err) => console.log(err));
                const metadata = await fetch(`https://arweave.net/${uriExtension}`).then(res => res.json());
                return message.lineReplyNoMention(new MessageEmbed()
                    .setColor(ee.color)
                    .setFooter(ee.footertext, ee.footericon)
                    .setTitle(`**Current buyout for 0xJPEG #${mintedTokenCount}** is ${((price / Math.pow(10, 8)).toFixed(0)).toString().replace(/(.)(?=(\d{3})+$)/g, '$1,')} 0xBTC`)
                    .setDescription("[View Auction]( https://0xjpegs.com/ )")
                    .setImage(metadata.image)
                )
            } else {
                let id = args[0];

                if (id == "?") {
                    id = Math.floor(Math.random() * 30) + 1;
                } else if (isNaN(id)) {
                    const address = await provider.resolveName(id);

                    if (address) {
                        const bal = await nftContract
                            .balanceOf(address)
                            .catch((err) => console.log(err)
                            );
                        if (bal <= 0) {
                            return message.lineReplyNoMention(new MessageEmbed()
                                .setColor(ee.wrongcolor)
                                .setFooter(ee.footertext, ee.footericon)
                                .setTitle(`❌ ERROR | This ens name does not own any 0xjpegs`)
                                .setDescription(`Usage: \`${prefix}${this.usage}\``)
                            );
                        }
                        id = await nftContract.tokenOfOwnerByIndex(address, Math.floor(Math.random() * bal))
                    }
                }

                if (isNaN(id) || id > 30) {
                    return message.lineReplyNoMention(new MessageEmbed()
                        .setColor(ee.wrongcolor)
                        .setFooter(ee.footertext, ee.footericon)
                        .setTitle(`❌ ERROR | The ID you provided does not exist`)
                        .setDescription(`Usage: \`${prefix}${this.usage}\``)
                    );
                } else {
                    const owner = await nftContract
                        .ownerOf(id)
                        .catch((err) => console.log("Couldnt fetch ownerOf in jpeg.js"));
                    let ensName;

                    const uriExtension = await nftContract.uriExtensions(id).catch((err) => console.log(err));
                    const metadata = await fetch(`https://arweave.net/${uriExtension}`).then(res => res.json());

                    if (owner) {
                        ensName = await provider.lookupAddress(owner).catch(err => console.log(err));
                        return message.lineReplyNoMention(new MessageEmbed()
                            .setColor(ee.color)
                            .setFooter(ee.footertext, ee.footericon)
                            .setTitle(`**0xJPEG #${id}**`)
                            .setDescription(`Owned by [` + (ensName ? ensName : owner.substring(0, 8)) + "](" + baseEtherscanLink + owner + ") \n"
                                + "[Opensea](" + baseOpenseaLink + id + ")")
                            .setImage(metadata.image)
                        )
                    } else {
                        return message.lineReplyNoMention(new MessageEmbed()
                            .setColor(ee.color)
                            .setFooter(ee.footertext, ee.footericon)
                            .setTitle(`**0xJPEG #${id}**`)
                            .setDescription(`This 0xJPEG has yet to be minted`)
                            .setImage(metadata.image)
                        )
                    }

                }
            }
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
