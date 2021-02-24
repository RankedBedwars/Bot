"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const logger_1 = __importDefault(require("../logger"));
const logger = new logger_1.default("Database Manager");
const { DB_URL } = process.env;
if (!DB_URL) {
    logger.error("Required environment variable DB_URL is not defined.");
    process.exit(1);
}
exports.default = new Promise((res, rej) => {
    mongodb_1.MongoClient.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true }).then(client => {
        const db = client.db("rbw_dev");
        res({
            bots: db.collection("bots"),
            games: db.collection("games"),
            players: db.collection("players"),
            activeGame: db.collection("activeGame")
        });
    }).catch(rej);
});
