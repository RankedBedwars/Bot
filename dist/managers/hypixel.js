"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHypixelPlayer = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const logger_1 = __importDefault(require("../logger"));
const logger = new logger_1.default("Hypixel Manager");
const { HYPIXEL_KEY } = process.env;
if (!HYPIXEL_KEY) {
    logger.error("Required environment variable HYPIXEL_KEY is not defined.");
    process.exit(1);
}
async function getHypixelPlayer(uuid) {
    return (await node_fetch_1.default(`https://api.hypixel.net/player?key=${HYPIXEL_KEY}&uuid=${uuid}`)).json();
}
exports.getHypixelPlayer = getHypixelPlayer;
