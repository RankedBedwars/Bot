import { MongoClient } from "mongodb";
import Logger from "../logger";
import type { Database } from "../typings/database";

const logger = new Logger("Database Manager");

const { DB_URL } = process.env;

if(!DB_URL){
    logger.error("Required environment variable DB_URL is not defined.");
    process.exit(1);
}

/** Gets the database. */
export default new Promise<Database>((res, rej) => {

    MongoClient.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true }).then(client => {

        const db = client.db("rbw_dev");

        res({
            bots: db.collection("bots"),
            games: db.collection("games"),
            players: db.collection("players"),
            activeGame: db.collection("activeGame")
        });

    }).catch(rej);
});