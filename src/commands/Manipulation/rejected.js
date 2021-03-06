const { Command } = require("../../index");

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            cooldown: 8,
            requiredPermissions: ["ATTACH_FILES", "USE_EXTERNAL_EMOJIS", "EMBED_LINKS"],
            description: language => language.get("COMMAND_REJECT_DESCRIPTION"),
            extendedHelp: "No extended help available.",
            usage: "[rejectwho:username]"
        });
    }

    async run(msg, [rejectwho = msg.author]) {
        const image = await this.client.funcs.images("overlay/rejected", { avatar: rejectwho.displayAvatarURL({ format: "png", size: 512 }) })
            .catch(() => null);
        if (!image) return msg.reply(msg.language.get("ER_TRY_AGAIN"));
        return msg.channel.sendFile(image);
    }

};
