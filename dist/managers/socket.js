"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketManagerLogger = exports.devLogger = exports.bots = void 0;
const discord_js_1 = require("discord.js");
const http_1 = require("http");
const mongodb_1 = require("mongodb");
const socket_io_1 = require("socket.io");
const constants_1 = require("../constants");
const logger_1 = __importDefault(require("../logger"));
const games_1 = require("../typings/games");
const utils_1 = require("../utils");
const bot_1 = require("./bot");
const database_1 = __importDefault(require("./database"));
exports.bots = new discord_js_1.Collection();
const colourMap = new Map([
    ['§a', 'Green'],
    ['Green', '§a'],
    ['§b', 'Aqua'],
    ['Aqua', '§b'],
    ['§c', 'Red'],
    ['Red', '§c'],
    ['§d', 'Pink'],
    ['Pink', '§d'],
    ['§e', 'Yellow'],
    ['Yellow', '§e'],
    ['§f', 'White'],
    ['White', '§f'],
    ['§8', 'Gray'],
    ['Gray', '§8'],
    ['§9', 'Blue'],
    ['Blue', '§9']
]);
const logger = new logger_1.default("Socket Manager");
exports.socketManagerLogger = logger;
exports.devLogger = new logger_1.default("Socket Manager (Dev)");
const { SOCKET_KEY, NODE_ENV } = process.env;
if (!SOCKET_KEY) {
    logger.error("Required environment variable SOCKET_KEY is not defined.");
    process.exit(1);
}
if (NODE_ENV === "development")
    exports.devLogger.warn("Additional logging enabled because the app is running in development mode. Remember to set NODE_ENV to production on release.");
const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;
const server = http_1.createServer();
const io = new socket_io_1.Server(server);
io.on('connection', socket => {
    const { key, bot } = socket.handshake.query;
    console.log(key, bot);
    if (SOCKET_KEY !== key) {
        if (NODE_ENV === "development")
            exports.devLogger.warn("Refusing connection from socket using an invalid key.");
        return socket.disconnect();
    }
    if (exports.bots.get(bot) && NODE_ENV === "development") {
        logger.info(JSON.stringify(exports.bots));
        socket.disconnect();
        return exports.devLogger.info(`${bot} has connected, but is already in the socket cache.`);
    }
    exports.bots.set(bot, socket);
    if (NODE_ENV === "development")
        exports.devLogger.info(`${bot} has connected successfully.`);
    socket.on("reconnect", () => {
        if (NODE_ENV === "development")
            exports.devLogger.info(`${bot} has reconnected.`);
        exports.bots.set(bot, socket);
    });
    socket.on("disconnect", () => {
        if (NODE_ENV === "development")
            exports.devLogger.info(`${bot} has disconnected.`);
        exports.bots.delete(bot);
    });
    socket.on("gameFinish", async (resultsObject) => {
        const db = await database_1.default;
        const game = await db.games.findOne({ number: resultsObject.number }) ?? { number: resultsObject.number, _id: new mongodb_1.ObjectId() };
        const results = Object.values(resultsObject.players);
        const players = (await (await database_1.default).players.find({ discord: { $in: results.map((r) => r.discord) } }).toArray()).reduce((a, b) => {
            a[b.discord] = b;
            return a;
        }, {});
        const calculations = Object.values(resultsObject.players).map((p) => {
            const user = players[p.discord];
            const player = {
                minecraft: { name: p.minecraft.name },
                elo: user?.elo ?? 400,
                kills: p.kills || 0,
                wins: p.wins || 0,
                winstreak: user?.winstreak || 0,
                bedstreak: user?.bedstreak || 0,
                team: p.team
            };
            return player;
        });
        const winner = results.find((p) => p.wins > 0)?.team ?? '§a';
        const [ratings] = utils_1.calculateElo(calculations, winner);
        const guild = await bot_1.defaultGuild;
        const teams = {};
        const statistics = Object.values(resultsObject.players).map((p) => {
            const player = players[p.discord] ?? {};
            const rating = ratings[p.minecraft.name] ?? 400;
            const updated = {
                ...player,
                bedstreak: p.bedsBroken ? (player?.bedstreak ?? 0) + 1 : 0,
                winstreak: p.wins ? (player?.winstreak ?? 0) + 1 : 0,
                losestreak: p.losses ? (player?.losestreak ?? 0) + 1 : 0,
                kills: (player?.kills || 0) + (p.kills || 0),
                deaths: (player?.deaths || 0) + (p.deaths || 0),
                bedsLost: (player?.bedsLost || 0) + (p.bedsLost || 0),
                bedsBroken: (player?.bedsBroken || 0) + (p.bedsBroken || 0),
                games: (player?.games || 0) + 1
            };
            updated.elo = Math.max(0, (p.bedsBroken || 0) * 10 + rating);
            guild.members.fetch(p.discord)
                .then(m => m.setNickname(`[${updated.elo}] ${p.minecraft.name}`))
                .catch(() => { });
            if (p.team) {
                const entry = {
                    kills: p.kills || 0,
                    deaths: p.deaths || 0,
                    destroyedBed: (p.bedsLost ?? 0) > 0,
                    username: p.minecraft.name,
                    winstreak: (player?.winstreak || 0),
                    bedstreak: (player?.bedstreak || 0),
                    discord: p?.discord || player?.discord || null,
                    oldRating: player?.elo || 400,
                    newRating: updated.elo
                };
                if (!teams[p.team])
                    teams[p.team] = { players: [entry], winner: (p.wins ?? 0) > 0 };
                else
                    teams[p.team].players.push(entry);
            }
            return updated;
        }).filter((s) => s !== null);
        const _operation = db.players.initializeUnorderedBulkOp();
        for (const player of statistics) {
            _operation.find({ discord: player.discord }).replaceOne(player);
        }
        const teamColours = Object.keys(teams);
        await Promise.all([
            utils_1.gameReport(teams, winner, resultsObject.number, results.map((r) => `<@${r.discord}>`).join(''), colourMap, guild),
            _operation.execute(),
            db.games.updateOne({
                number: resultsObject.number
            }, {
                $set: {
                    state: games_1.GameState.FINISHED,
                    team1: teams[teamColours[0]],
                    team2: teams[teamColours[1]]
                }
            }, {
                upsert: true,
            })
        ]);
        console.log(game);
        utils_1.BotManager.release(bot);
        if (!guild)
            return;
        setTimeout(async () => {
            const teamOneVoice = guild.channels.cache.get(game.team1Channel);
            const teamTwoVoice = guild.channels.cache.get(game.team2Channel);
            const textChannel = guild.channels.cache.get(game.textChannel);
            if (textChannel)
                textChannel.delete();
            if (teamOneVoice) {
                await Promise.allSettled(teamOneVoice.members.map(m => m.voice.setChannel(constants_1.Constants.WAITING_ROOM)));
                await teamOneVoice.delete().catch(() => { });
            }
            if (teamTwoVoice) {
                await Promise.allSettled(teamTwoVoice.members.map(m => m.voice.setChannel(constants_1.Constants.WAITING_ROOM)));
                await teamTwoVoice.delete().catch(() => { });
            }
        }, 10000);
        await db.activeGame.deleteOne({ number: resultsObject.number });
        logger.info(`Successfully finished game ${game._id} (managed by ${bot}).`);
    });
    socket.on("alertStaff", async (nickIGN, gamePlayers) => {
        try {
            (await bot_1.defaultGuild).channels.cache.get('801294842914930698').send(`**Nick Exploit Detected:** Nick --> ${nickIGN} Players --> ${gamePlayers}`);
        }
        catch {
            logger.info(`Failed to send player info. Nick --> ${nickIGN} Players --> ${gamePlayers}`);
        }
    });
    socket.on('playerStrike', async ({ id, strikes, reason }) => {
        const channel = (await bot_1.defaultGuild).channels.cache.get(constants_1.Constants.STRIKE_UNSTRIKE.AUTOSTRIKE_RESPONSE_CHANNEL);
        channel.send(`<@${id}> Held banned item`);
        if (reason === 'afk') {
            const strike = (await bot_1.defaultGuild).channels.cache.get(constants_1.Constants.STRIKE_UNSTRIKE.CHANNELS[0]);
            strike.send(`=strike <@${id}> 1 AFK during game`);
        }
    });
    socket.on('playerBan', async ({ id }) => {
        const channel = (await bot_1.defaultGuild).channels.cache.get(constants_1.Constants.COMMANDS_CHANNEL);
        const strike = (await bot_1.defaultGuild).channels.cache.get(constants_1.Constants.STRIKE_UNSTRIKE.CHANNELS[0]);
        channel.send(`<@${id}> Used banned item`);
        strike.send(`=strike <@${id}> 1 Used banned item`);
    });
    socket.on("ActualGameStart", async (uuids) => {
        const new_players = (await utils_1.Players.getManyByMinecraft(uuids)).array();
        if (process.env.NODE_ENV === "development")
            exports.devLogger.info(`Received gameStart: ${JSON.stringify(new_players)}`);
        const _game = await utils_1.BotManager.getAssignedGame(bot);
        if (!_game)
            return logger.warn(`Received ActualGameStart event from bot ${bot} that is not currently bound to a game. Ignoring invocation.`);
        const game = utils_1.activeGames.get(_game);
        if (!game || game.state === games_1.GameState.VOID)
            return logger.warn(`Received ActualGameStart event from bot ${bot} that is not currently bound to game ${_game} that does not exist. Ignoring invocation.`);
        const socket = exports.bots.get(bot);
        if (socket)
            socket.emit("actualgamestart", new_players);
    });
});
server.listen(port, () => {
    logger.info(`Now listening on port ${port}.`);
});
exports.default = io;
