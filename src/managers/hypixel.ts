import fetch from "node-fetch";
import Logger from "../logger";

const logger = new Logger("Hypixel Manager");

const { HYPIXEL_KEY } = process.env;

if(!HYPIXEL_KEY){
    logger.error("Required environment variable HYPIXEL_KEY is not defined.");
    process.exit(1);
}

// TODO: Queue system?

export async function getHypixelPlayer(uuid: string){
    return (await fetch(`https://api.hypixel.net/player?key=${HYPIXEL_KEY}&uuid=${uuid}`)).json();
}