const { MessageEmbed, MessageAttachment } = require("discord.js");
require('discord-reply');
const config = require("../../botconfig/config.json");
const ee = require("../../botconfig/embed.json");
const fs = require('fs');

const { Contract } = require("@ethersproject/contracts");
const { AlchemyProvider } = require("@ethersproject/providers");
const contractAddress = "0x6c10511DdEA5f3ED38A0163224198e37b81525bC";
const contractAbi = [{ "constant": true, "inputs": [{ "name": "_interfaceId", "type": "bytes4" }], "name": "supportsInterface", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "name", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [{ "name": "_tokenId", "type": "uint256" }], "name": "getApproved", "outputs": [{ "name": "", "type": "address" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_tokenId", "type": "uint256" }], "name": "approve", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "InterfaceId_ERC165", "outputs": [{ "name": "", "type": "bytes4" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_from", "type": "address" }, { "name": "_to", "type": "address" }, { "name": "_tokenId", "type": "uint256" }], "name": "transferFrom", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }, { "name": "_index", "type": "uint256" }], "name": "tokenOfOwnerByIndex", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "ipfs", "type": "string" }], "name": "mintToken", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "_from", "type": "address" }, { "name": "_to", "type": "address" }, { "name": "_tokenId", "type": "uint256" }], "name": "safeTransferFrom", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "new_baseurl", "type": "string" }], "name": "manageBaseURL", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "_client", "type": "address" }, { "name": "ipfs", "type": "string" }], "name": "mintTokenForClient", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "_tokenId", "type": "uint256" }], "name": "exists", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [{ "name": "_index", "type": "uint256" }], "name": "tokenByIndex", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_ids", "type": "uint256[]" }, { "name": "_to", "type": "address" }], "name": "transferOwnTokens", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "_tokenId", "type": "uint256" }], "name": "ownerOf", "outputs": [{ "name": "", "type": "address" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [{ "name": "get_ipfsID", "type": "uint256" }], "name": "getIpfs", "outputs": [{ "name": "nof_addresses", "type": "uint256" }, { "name": "_ipfsID", "type": "uint256" }, { "name": "_ipfsHash", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [], "name": "renounceOwnership", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "owner", "outputs": [{ "name": "", "type": "address" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "myTokens", "outputs": [{ "name": "", "type": "uint256[]" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "symbol", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "viewBaseURL", "outputs": [{ "name": "base_url", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_approved", "type": "bool" }], "name": "setApprovalForAll", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "_from", "type": "address" }, { "name": "_to", "type": "address" }, { "name": "_tokenId", "type": "uint256" }, { "name": "_data", "type": "bytes" }], "name": "safeTransferFrom", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "ipfsID", "type": "uint256" }, { "name": "newHash", "type": "string" }], "name": "editIpfs", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "_ID", "type": "uint256" }], "name": "tokenURI", "outputs": [{ "name": "URI", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }, { "name": "_operator", "type": "address" }], "name": "isApprovedForAll", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "payable": false, "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "buyer", "type": "address" }, { "indexed": false, "name": "tokenId", "type": "uint256" }], "name": "BoughtToken", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "previousOwner", "type": "address" }], "name": "OwnershipRenounced", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "previousOwner", "type": "address" }, { "indexed": true, "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "_from", "type": "address" }, { "indexed": true, "name": "_to", "type": "address" }, { "indexed": true, "name": "_tokenId", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "_owner", "type": "address" }, { "indexed": true, "name": "_approved", "type": "address" }, { "indexed": true, "name": "_tokenId", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "_owner", "type": "address" }, { "indexed": true, "name": "_operator", "type": "address" }, { "indexed": false, "name": "_approved", "type": "bool" }], "name": "ApprovalForAll", "type": "event" }];
const provider = new AlchemyProvider("homestead", config.alchemyKey);
const contract = new Contract(contractAddress, contractAbi, provider);

const baseEtherscanLink = "https://etherscan.io/address/";
const baseOpenseaLink = "https://opensea.io/assets/0x6c10511ddea5f3ed38a0163224198e37b81525bc/";

module.exports = {
    name: "meme",
    category: "Information",
    aliases: ["memes"],
    cooldown: 10,
    usage: "meme <memeID>",
    description: "Shows an image of the 0xbitcoin meme",
    run: async (client, message, args, user, text, prefix) => {
        try {
            if (!args[0]) {
                return message.lineReplyNoMention(new MessageEmbed()
                    .setColor(ee.wrongcolor)
                    .setFooter(ee.footertext, ee.footericon)
                    .setTitle(`❌ ERROR | You didn't provide an ID`)
                    .setDescription(`Usage: \`${prefix}${this.usage}\``)
                );
            } else {
                let id = args[0];
                
                if (id == "?") {
                    id = Math.floor(Math.random() * 70) + 1;
                }else if (isNaN(id)){
                    let address = await provider.resolveName(id);

                    if(address){
                        let bal = await contract
                            .balanceOf(address)
                            .catch((err) => console.log(err)
                        );
                        id = await contract.tokenOfOwnerByIndex(address,Math.floor(Math.random() * bal))    
                    }
                }
                

                if (isNaN(id) || id > 70) {
                    return message.lineReplyNoMention(new MessageEmbed()
                        .setColor(ee.wrongcolor)
                        .setFooter(ee.footertext, ee.footericon)
                        .setTitle(`❌ ERROR | The ID you provided does not exist`)
                        .setDescription(`Usage: \`${prefix}${this.usage}\``)
                    );
                } else {
                    let owner = await contract
                        .ownerOf(id)
                        .catch((err) => console.log(err)
                    );

                    let ensName = await provider.lookupAddress(owner);

                    let files = fs.readdirSync('./memes/')
                    let filename = "";
                    let prefix = id + ".";

                    for (const file of files) {
                        if (file.startsWith(prefix)) {
                            filename = file;
                            break;
                        }
                    }

                    const file = new MessageAttachment("./memes/" + filename);

                    return message.lineReplyNoMention(new MessageEmbed()
                        .setColor(ee.color)
                        .setFooter(ee.footertext, ee.footericon)
                        .setTitle(`**0xBitcoin Meme #${id}**`)
                        .setDescription(`Owned by [` + (ensName ? ensName : owner.substring(0, 8)) + "](" + baseEtherscanLink + owner + ") \n"
                            + "[Opensea](" + baseOpenseaLink + id + ")")
                        .setImage(`attachment://${filename}`)
                        .attachFiles(file)
                    )
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
