import { Client, Guild } from "discord.js";
import fetch from "node-fetch";
import commands from "../commands.json";
import Logger from "../logger";

const { GUILD, TOKEN } = process.env;

const logger = new Logger("Bot Manager");

if(!GUILD){
    logger.error("Required environment variable GUILD is not defined.");
    process.exit(1);
}

if(!TOKEN){
    logger.error("Required environment variable TOKEN is not defined.");
    process.exit(1);
}

const bot = new Promise<Client>((res, rej) => {
    const client = new Client();

    client.login(TOKEN).catch(err => {
        logger.error("Failed to login to Discord.");
        rej(err);
    });

    client.on("ready", async () => {
        if(!Array.isArray(commands)){
            logger.warn("Contents of commands.json is not an array, skipping command registration.");
            return res(client);
        }

        logger.info("Registering commands...");

        try {
            const responses = await Promise.all(commands.map(command => fetch(`https://discord.com/api/v8/applications/${client.user!.id}/guilds/${GUILD}/commands`, {
                method: "POST",
                headers: {
                    authorization: `Bot ${TOKEN}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(command),
            })));
            responses.forEach(async (v, i) => {
                if(v.status === 200) return;
                logger.warn(`Command ${commands[i].name} failed to register:\n${await v.text()}`);
            });
            logger.info("All commands registered.");
        } catch(e){
            logger.error(`Failed to register commands:\n${e.stack}`);
        }

        res(client);
    });
});

/** Gets the discord bot. */
export default bot;

export const defaultGuild = new Promise<Guild>(async res => {
    const guild = (await bot).guilds.cache.get(GUILD);
    if(!guild){
        logger.error(`Unknown guild: ${GUILD}`);
        return process.exit(1);
    }
    res(guild);
});