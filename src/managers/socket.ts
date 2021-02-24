import { Collection, TextChannel } from "discord.js";
import { createServer } from "http";
import { ObjectId } from "mongodb";
import { Server, Socket } from "socket.io";
import { Constants } from "../constants";
import Logger from "../logger";
import type { activeGame } from "../typings/activeGame";
import { GamePlayer, GameState, Team } from "../typings/games";
import type { Player } from "../typings/players";
import type { SocketAPI } from "../typings/socket";
import { activeGames, BotManager, Game, gameReport, calculateElo, Players, updateRoles, getBanDuration } from "../utils";
import { defaultGuild } from "./bot";
import database from "./database";

export const bots = new Collection<string, Socket>();

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

const logger = new Logger("Socket Manager");
export const devLogger = new Logger("Socket Manager (Dev)");

export { logger as socketManagerLogger };

const { SOCKET_KEY, NODE_ENV } = process.env;

if(!SOCKET_KEY){
    logger.error("Required environment variable SOCKET_KEY is not defined.");
    process.exit(1);
}

if(NODE_ENV === "development") devLogger.warn("Additional logging enabled because the app is running in development mode. Remember to set NODE_ENV to production on release.");

const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;

const server = createServer();

const io = new Server(server);

io.use((socket, next) => {
    const { key, bot } = socket.handshake.query as SocketAPI.Query;
    if(!key){
        if(NODE_ENV === "development") devLogger.warn("Refusing connection from unauthenticated socket.");
        return next(new Error("Authentication failed."));
    }

    if(SOCKET_KEY !== key){
        if(NODE_ENV === "development") devLogger.warn("Refusing connection from socket using an invalid key.");
        return next(new Error("Authentication failed."));
    }

    if(bots.get(bot) && NODE_ENV === "development") {
        logger.info(JSON.stringify(bots));
        return devLogger.info(`${bot} has connected, but is already in the socket cache.`);
    }

    bots.set(bot, socket);

    if(NODE_ENV === "development") devLogger.info(`${bot} has connected successfully.`);

    socket.on("reconnect", () => {
        if(NODE_ENV === "development") devLogger.info(`${bot} has reconnected.`);
        bots.set(bot, socket);
    });

    socket.on("disconnect", () => {
        if(NODE_ENV === "development") devLogger.info(`${bot} has disconnected.`);
        bots.delete(bot);
    });

    socket.on("gameFinish", async (resultsObject: any) => {
        const db = await database;
        const game: any = await db.activeGame.findOne({ "botIGN": bot }) || { gameNumber: resultsObject.number, _id: new ObjectId(), botIGN: bot };

        const results: any = Object.values(resultsObject.players);           
        const players = (await (await database).players.find({ discord: { $in: results.map((r: any) => r.discord) } }).toArray()).reduce((a: any, b) => {
            a[b.discord] = b;

            return a;
        }, {});

        const calculations = Object.values(resultsObject.players).map((p: any) => {
            const user = players[p.discord];

            const player = {
                minecraft: { name: p.minecraft.name },
                elo: user?.elo ?? 400,
                kills: p.kills || 0,
                winstreak: user?.winstreak || 0,
                bedstreak: user?.bedstreak || 0,
                team: p.team
            };

            return player;
        });

        const winner = results.find((p: any) => p.wins > 0)?.team ?? '§a';
        const [ ratings ] = calculateElo(calculations, winner);

        const guild = await defaultGuild;
        const teams: any = {};

        const statistics = Object.values(resultsObject.players).map((p: any) => {
            const player = players[p.discord];
            const rating = ratings[p.minecraft.name];

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
                .catch(() => {});

            if (p.team) {
                const entry: any = {
                    kills: p.kills || 0,
                    deaths: p.deaths || 0,
                    destroyedBed: (p.bedsLost ?? 0) > 0,
                    username: p.minecraft.name,
                    winstreak: (player?.winstreak || 0),
                    bedstreak: (player?.bedstreak || 0),
                    discord: player?.discord || null,
                    oldRating: player?.elo || 400,
                    newRating: updated.elo
                };

                if (!teams[p.team]) teams[p.team] = { players: [ entry ], winner: (p.wins ?? 0) > 0 };
                else
                    teams[p.team].players.push(entry);
            }

            return updated;
        }).filter((s: any) => s !== null);

        const _operation = db.players.initializeUnorderedBulkOp();

        for (const player of statistics) {
            _operation.find({ discord: player.discord }).replaceOne(player);
        }

        const teamColours = Object.keys(teams);
                
        await Promise.all([
            gameReport(teams, winner, resultsObject.number, results.map((r: any) => `<@${r.discord}>`).join(''), colourMap, guild),
            _operation.execute(),
            db.games.updateOne({
                _id: game._id 
            },
            {
                $set: {
                    state: GameState.FINISHED,
                    team1: teams[teamColours[0]],
                    team2: teams[teamColours[1]],
                    number: resultsObject.number
                }
            },
            {
                upsert: true,
            })
        ]);

        BotManager.release(bot);

        if (!guild) return;

        setTimeout(async () => {

            if(!(game.textChannel && game.team1Channel && game.team2Channel)) return; 

            guild.channels.cache.get(game.textChannel)!.delete().catch(_ => null);

            const team1Channel = guild.channels.cache.get(game.team1Channel);
            const team2Channel = guild.channels.cache.get(game.team2Channel);

            if(team1Channel){
                await Promise.all(team1Channel!.members.map(member => member.voice.setChannel(Constants.WAITING_ROOM))).catch(_ => null);
                team1Channel?.delete().catch(_ => null);
            }
            if(team2Channel){
                await Promise.all(team2Channel!.members.map(member => member.voice.setChannel(Constants.WAITING_ROOM))).catch(_ => null);
                team2Channel?.delete().catch(_ => null);
            }
        }, 10000);

        await db.activeGame.deleteOne({ _id: game._id });
        logger.info(`Successfully finished game ${game._id} (managed by ${bot}).`);
    });
    
    socket.on("alertStaff", async (nickIGN, gamePlayers) => {
        try {
            ((await defaultGuild).channels.cache.get('801294842914930698') as TextChannel).send(`**Nick Exploit Detected:** Nick --> ${nickIGN} Players --> ${gamePlayers}`);
        }
        catch {
            logger.info(`Failed to send player info. Nick --> ${nickIGN} Players --> ${gamePlayers}`);
        }
    });

    socket.on('playerStrike', async ({ id, strikes, reason }) => {
        const channel = (await defaultGuild).channels.cache.get(Constants.STRIKE_UNSTRIKE.AUTOSTRIKE_RESPONSE_CHANNEL) as TextChannel;
        
        channel.send(`<@${id}> Held banned item`);

        if (reason === 'afk') {
            const strike = (await defaultGuild).channels.cache.get(Constants.STRIKE_UNSTRIKE.CHANNELS[0]) as TextChannel;
            strike.send(`=strike <@${id}> 1 AFK during game`);
        }
    });

    socket.on('playerBan', async ({ id }) => {
        const channel = (await defaultGuild).channels.cache.get(Constants.COMMANDS_CHANNEL) as TextChannel;
        const strike = (await defaultGuild).channels.cache.get(Constants.STRIKE_UNSTRIKE.CHANNELS[0]) as TextChannel;
        
        channel.send(`<@${id}> Used banned item`);
        strike.send(`=strike <@${id}> 1 Used banned item`);
    });

    socket.on("ActualGameStart", async (uuids: string[]) => {
        const new_players = (await Players.getManyByMinecraft(uuids)).array();
        if(process.env.NODE_ENV === "development") devLogger.info(`Received gameStart: ${JSON.stringify(new_players)}`);
        const _game = await BotManager.getAssignedGame(bot);
        if(!_game) return logger.warn(`Received ActualGameStart event from bot ${bot} that is not currently bound to a game. Ignoring invocation.`);
        const game = activeGames.get(_game);
        if(!game || game.state === GameState.VOID) return logger.warn(`Received ActualGameStart event from bot ${bot} that is not currently bound to game ${_game} that does not exist. Ignoring invocation.`);

        const socket = bots.get(bot);
        if(socket) socket.emit("actualgamestart", new_players);
    })

    next();
});

server.listen(port, () => {
    logger.info(`Now listening on port ${port}.`);
});

export default io;