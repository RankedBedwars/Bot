"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultGuild = void 0;
const discord_js_1 = require("discord.js");
const node_fetch_1 = __importDefault(require("node-fetch"));
const commands_json_1 = __importDefault(require("../commands.json"));
const logger_1 = __importDefault(require("../logger"));
const { GUILD, TOKEN } = process.env;
const logger = new logger_1.default("Bot Manager");
if (!GUILD) {
    logger.error("Required environment variable GUILD is not defined.");
    process.exit(1);
}
if (!TOKEN) {
    logger.error("Required environment variable TOKEN is not defined.");
    process.exit(1);
}
const bot = new Promise((res, rej) => {
    const client = new discord_js_1.Client();
    client.login(TOKEN).catch(err => {
        logger.error("Failed to login to Discord.");
        rej(err);
    });
    client.on("ready", async () => {
        if (!Array.isArray(commands_json_1.default)) {
            logger.warn("Contents of commands.json is not an array, skipping command registration.");
            return res(client);
        }
        logger.info("Registering commands...");
        try {
            const responses = await Promise.all(commands_json_1.default.map(command => node_fetch_1.default(`https://discord.com/api/v8/applications/${client.user.id}/guilds/${GUILD}/commands`, {
                method: "POST",
                headers: {
                    authorization: `Bot ${TOKEN}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(command),
            })));
            responses.forEach(async (v, i) => {
                if (v.status === 200)
                    return;
                logger.warn(`Command ${commands_json_1.default[i].name} failed to register:\n${await v.text()}`);
            });
            logger.info("All commands registered.");
        }
        catch (e) {
            logger.error(`Failed to register commands:\n${e.stack}`);
        }
        res(client);
    });
});
exports.default = bot;
exports.defaultGuild = new Promise(async (res) => {
    const guild = (await bot).guilds.cache.get(GUILD);
    if (!guild) {
        logger.error(`Unknown guild: ${GUILD}`);
        return process.exit(1);
    }
    res(guild);
});
