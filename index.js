const Discord = require("discord.js");
const client = new Discord.Client({
    disableEveryone: true,
    fetchAllMembers: true,
    sync: false
});

const { inspect } = require("util");
const { post } = require("snekfetch");
const { version } = require("discord.js");
const fs = require("fs");

const moment = require("moment");
require("moment-duration-format");

const settings = require("./settings.js");
const instance = require("./package.json");

require("./modules/functions.js");
require("./modules/server.js");

// Basic Configuration Variables
var prefix = "--";
var bot = client.user.username;
var guilds = client.guilds.size;
var channels = client.channels.size;
var users = client.users.size;

// Status Objects
var statuses = {
    online: "online",
    idle: "idle",
    dnd: "dnd",
    offline: "invisible"
};

client.on("error", (error) => {
    console.error(`An unexpected error has occurred: ${JSON.stringify(error)}`);
    process.exit(1);
});

// Invite Logger Utilities
const invites = {};
const wait = require("util").promisify(setTimeout);

// Music Queue Utilities
const queue = {};

client.on("ready", () => {
    console.log(`==[Instance Launching]==`);
    console.log(`Client User: ${bot}`);
    console.log(`Guilds: ${guilds}`);
    console.log(`Channels: ${channels}`);
    console.log(`Users: ${users}`);
    console.log(`Prefix: ${prefix}`);
    console.log(`Release: ${instance.version}`);
    console.log(`Bot Library: ${version}`);
    console.warn("[WARN]:", "Do not share your bots token with anybody, you're the only one that needs it.");
    console.log(`Successfully connected to the WebSocket. The bot is now online.`);

    client.user.setStatus(statuses.idle);

    wait(1000);

    client.guilds.forEach(g => {
        g.fetchInvites().then(guildInvites => {
            invites[g.id] = guildInvites;
        });
    });
});

client.on("resume", () => {
    console.info("Successfully resumed the WebSocket connection.");
});

client.on("reconnecting", () => {
    console.info("Currently reconnecting to the WebSocket.");
});

client.on("disconnect", () => {
    console.info("Disconnected from the WebSocket, attempting to reconnect.");
});

client.on("rateLimit", () => {
    console.error("You are being ratelimited.");
});

client.on("guildCreate", (guild) => {
    fs.readFile("./modules/guildDB.json", "utf-8", (err, data) => {
        if (err !== null) {
            console.error(`An unexpected error has occurred whilst reading data: ${JSON.stringify(err)}`);
        } else {
            const allowedGuild = JSON.parse(data);

            if (allowedGuild.serverID.includes(guild.id)) {
                console.info(`[AUTHORIZED]: The guild: '${guild.name}' has been authorized.`);
                return;
            } else {
                console.warn(`[UNAUTHORIZED]: The user: ${guild.owner.user.tag} tried to add me to the guild named ${guild.name}.`);
                return guild.leave(guild.id);
            }
        }
    });
});


client.on("guildDelete", (guild) => {
    console.info(`I have been removed from the guild named ${guild.name}.`);
});

client.on("guildUnavailable", (guild) => {
    console.warn(`[GUILD UNAVAILABLE]: The guild named ${guild.name} has became unavailable.`);
});

client.on("guildMemberAdd", (member) => {
    const channel = member.guild.channels.find(ch => ch.name === "meet-and-greet");
    if (!channel) return;
    channel.send(`**${member.user.username}** has just joined.`);

    const joinRole = member.guild.roles.find(r => r.name === "Supporter");
    if (!joinRole) return;

    setInterval(() => member.addRole(joinRole), 600000);

    member.guild.fetchInvites().then(guildInvites => {
        const ei = invites[member.guild.id];
        invites[member.guild.id] = guildInvites;

        const invite = guildInvites.find(i => ei.get(i.code).uses < i.uses);
        const inviter = client.users.get(invite.inviter.id);
        const logChannel = member.guild.channels.find(channel => channel.name === "invite-logs");

        if (!logChannel) return;

        logChannel.send(`**${member.user.username}** was invited by **${inviter.tag}** and this invite has been used **${invite.uses}** times since it was created.`);
    });
});

client.on("guildMemberRemove", (member) => {
    const channel = member.guild.channels.find(ch => ch.name === "meet-and-greet");
    if (!channel) return;
    channel.send(`**${member.user.username}** has just left.`);
});

client.on("message", async (message) => {
    if (message.channel.type === "dm") return;
    if (message.author.bot) return;
    if (message.content.indexOf(prefix) !== 0) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command === "ping") {
        const embed = new Discord.RichEmbed()
        embed.setTitle("Pong!");
        embed.addField("Bot Latency", `${Date.now() - message.createdTimestamp()} milliseconds`); // Might be false.
        embed.addField("API Latency", `${Math.round(client.ping)} milliseconds`);
        embed.addField("Shard Latency", `${Math.round(client.ping)} milliseconds`); // Same as API latency.
        embed.setColor("BLACK");
        message.channel.send({embed});
    }

    if (command === "stats") {
        const duration = moment.duration(client.uptime).format(" D [Days], H [Hours], m [Minutes], s [Seconds]");
        const memUsage = `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}`;

        const embed = new Discord.RichEmbed()
        embed.addField("Statistics", "Here are my statistics.");
        embed.addField("Uptime", `${duration}`);
        embed.addField("Memory Usage", `${memUsage}`);
        embed.addField("Guilds", `${guilds}`);
        embed.addField("Channels", `${channels}`);
        embed.addField("Users", `${users}`);
        embed.addField("Bot Version", `${instance.version}`);
        embed.addField("Bot Library", `${version}`);
        embed.setColor("BLACK");
        message.channel.send({embed});
    }

    if (command === "cluster") {
        const duration = moment.duration(client.uptime).format(" D [Days], H [Hours], m [Minutes], s [Seconds]");
        const memUsage = `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}`;

        const embed = new Discord.RichEmbed()
        embed.addField("Shard", `1 (Default)`);
        embed.addField("Uptime", `${duration}`);
        embed.addField("Memory Usage", `${memUsage}`);
        embed.addField("Process File", "`shardReady.js`");
        embed.setColor("BLACK");
        message.channel.send({embed});
    }

    if (command === "help") {
        message.channel.send("There is a documentation site being developed, please check back later.");
    }

    if (command === "suggestion") {
        const dataSuggestion = args.join(" ");
        if (dataSuggestion > 12) return message.reply("To prevent spam, suggestions must be more than 12 characters.");

        const channel = message.guild.channels.find(ch => ch.name === "suggestions");
        if (!channel) return;

        const embed = new Discord.RichEmbed()
        embed.setTitle("New Suggestion");
        embed.addField("Suggested By", `${message.author.username}`);
        embed.addField("Suggestion", `${dataSuggestion}`);
        embed.setColor("BLACK");
        await channel.send({embed});

        const detailEmbed = new Discord.RichEmbed()
        embed.addField("Suggestion Information", `Here is some information about your suggestion.`);
        embed.addField("Suggestion", `${dataSuggestion}`);
        embed.setFooter("Other Information", `An admin or moderator will review your suggestion, they will Direct Message you with further information and if it was accepted or not.`);
        embed.setColor("BLACK");
        message.author.send({embed}).catch(() => {
            message.reply("I was unable to send you a Direct Message, please make sure that you have Direct Messages enabled.");
        });

        return message.channel.send("Successfully posted your suggestion, please check your Direct Messages for details.");
    }

    // Finish commands below this line.
});