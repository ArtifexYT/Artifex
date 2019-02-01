module.exports = async (client) => {
    client.awaitReply = async (msg, question, limit = 600000) => {
        const filter = m => m.author.id === msg.author.id;
        await msg.channel.send(question);

        try {
            const collected = await msg.channel.awaitMessages(filter, { max: 1, time: limit, errors: ["time"] });
            return collected.first().content;
        } catch (e) {
            return false;
        }
    };

    client.clean = async (client, text) => {
        if (text && text.constructor.name == "Promise")
        text = await text;

        if (typeof evaled !== "string")
        text = require("util").inspect(text, { depth: 1 });

        text = text
        .replace(/`/g, "`" + String.fromCharCode(8203))
        .replace(/@/g, "@" + String.fromCharCode(8203))
        .replace(client.token, "[TOKEN]");

        return text;
    };

    Object.defineProperty(String.prototype, "toProperCase", {
        value: function() {
            return this.replace(/([^\W_]+[^\s-]*) */g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
        }
    });

    Object.defineProperty(Array.prototype, "random", {
        value: function() {
            return this[Math.floor(Math.random() * this.length)];
        }
    });
};