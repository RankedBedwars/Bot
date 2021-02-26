"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toEscapedFormat = exports.checkStatus = exports.findOpenCategory = exports.delay = exports.updateRoles = exports.gameReport = exports.getBanDuration = exports.BotManager = exports.createNewGame = exports.hasPerms = exports.activeGames = exports.LocalGame = exports.calculateElo = exports.Game = exports.Players = exports.Player = void 0;
const discord_js_1 = require("discord.js");
const mongodb_1 = require("mongodb");
const constants_1 = require("./constants");
const logger_1 = __importDefault(require("./logger"));
const bot_1 = __importStar(require("./managers/bot"));
const database_1 = __importDefault(require("./managers/database"));
const games_1 = require("./typings/games");
const { HYPIXEL_KEY } = process.env;
const socket_1 = require("./managers/socket");
const Hypixel = require('hypixel-api-reborn');
const hypixel = new Hypixel.Client(HYPIXEL_KEY);
const maps_object = {
    "Extinction": { img: "https://media.discordapp.net/attachments/796082875475689506/810012638955175986/extiction-png.png", limit: "+95" },
    "Enchanted": { img: "https://media.discordapp.net/attachments/796082875475689506/810015425155825687/enchanted-png.png", limit: "+100" },
    "Aquarium": { img: "https://cdn.discordapp.com/attachments/799897234128764958/800008639342575667/aquariumold-png.png", limit: "+110" },
    "Katsu": { img: "https://cdn.discordapp.com/attachments/799897234128764958/800010460429942794/NEW-Katsu-bw-3v3v3v3-4v4v4v4.png", limit: "+96" },
    "Invasion": { img: "https://cdn.discordapp.com/attachments/799897234128764958/800014465294008370/image0.jpg", limit: "+115" },
    "Rise": { img: "https://cdn.discordapp.com/attachments/800022796301369344/800024134217629706/rise-png.png", limit: "+96" },
    "Temple": { img: "https://cdn.discordapp.com/attachments/800022796301369344/800023969918746624/templebedwars-png.png", limit: "+106" },
    "Lectus": { img: "https://cdn.discordapp.com/attachments/799897234128764958/800014149232492594/image0.jpg", limit: "+90" },
    "Catalyst": { img: "https://media.discordapp.net/attachments/796082875475689506/811700045085671514/catalyst-png.png", limit: "+101" },
    "Treenan": { img: "https://media.discordapp.net/attachments/796082875475689506/811700135339622430/treenan-png.png", limit: "+121" },
};
class Player {
    constructor(data) {
        this.data = data;
    }
    ;
    get _id() {
        return this.data._id;
    }
    get discord() {
        return this.data.discord;
    }
    get minecraft() {
        return this.data.minecraft;
    }
    get registeredAt() {
        return this.data.registeredAt;
    }
    get wins() {
        return this.data.wins ?? 0;
    }
    get losses() {
        return this.data.losses ?? 0;
    }
    get bedsBroken() {
        return this.data.bedsBroken ?? 0;
    }
    get bedsLost() {
        return this.data.bedsLost ?? 0;
    }
    get elo() {
        return this.data.elo ?? 0;
    }
    get kills() {
        return this.data.kills ?? 0;
    }
    get deaths() {
        return this.data.deaths ?? 0;
    }
    get roles() {
        return this.data.roles ?? [];
    }
    get banExpires() {
        return this.data.banExpires ?? 0;
    }
    get banned() {
        return this.banExpires < 0 || this.banExpires >= Date.now();
    }
    get strikes() {
        return this.data.strikes ?? 0;
    }
    get games() {
        return this.data.games ?? 0;
    }
    get winstreak() {
        return this.data.winstreak ?? 0;
    }
    get bedstreak() {
        return this.data.bedstreak ?? 0;
    }
    get info_card_background() {
        return this.data.info_card_background ?? 0;
    }
    get info_card_text() {
        return this.data.info_card_text ?? 0;
    }
    get messages() {
        return this.data.messages;
    }
    get loseMessage() {
        return this.data.loseMessage;
    }
    get emoji() {
        return this.data.emoji;
    }
    get winMessage() {
        return this.data.winMessage;
    }
    async update(data) {
        this.data = (await (await database_1.default).players.findOneAndUpdate({ _id: this._id }, {
            $set: data,
        }, {
            upsert: true,
        })).value;
        return this;
    }
    async ban(duration = -1) {
        if (this.banned && ((this.banExpires - Date.now())) + duration < 0)
            this.data = (await (await database_1.default).players.findOneAndUpdate({ _id: this._id }, {
                $set: {
                    banExpires: 0,
                },
            }, {
                upsert: true,
            })).value;
        else if (duration === -1)
            this.data = (await (await database_1.default).players.findOneAndUpdate({ _id: this._id }, {
                $set: {
                    banExpires: -1,
                },
            }, {
                upsert: true,
            })).value;
        else {
            if (this.banned)
                this.data = (await (await database_1.default).players.findOneAndUpdate({ _id: this._id }, {
                    $inc: {
                        banExpires: duration,
                    },
                }, {
                    upsert: true,
                })).value;
            else
                this.data = (await (await database_1.default).players.findOneAndUpdate({ _id: this._id }, {
                    $set: {
                        banExpires: Date.now() + duration,
                    },
                }, {
                    upsert: true,
                })).value;
        }
        return this;
    }
    async unban() {
        this.data = (await (await database_1.default).players.findOneAndUpdate({ _id: this._id }, {
            $unset: {
                banExpires: ""
            },
        }, {
            upsert: true,
        })).value;
        return this;
    }
    toGamePlayer() {
        return { username: this.minecraft.name, winstreak: this.winstreak, bedstreak: this.bedstreak, discord: this.discord };
    }
    toJSON() {
        return {
            _id: this._id,
            discord: this.discord,
            minecraft: this.minecraft,
            registeredAt: this.registeredAt,
            banExpires: this.banExpires,
            bedsBroken: this.bedsBroken,
            bedsLost: this.bedsLost,
            bedstreak: this.bedstreak,
            deaths: this.deaths,
            elo: this.elo,
            games: this.games,
            kills: this.kills,
            losses: this.losses,
            roles: this.roles,
            strikes: this.strikes,
            wins: this.wins,
            winstreak: this.winstreak,
            info_card_text: this.info_card_text,
            info_card_background: this.info_card_background,
            messages: this.messages,
            winMessage: this.winMessage,
            loseMessage: this.loseMessage,
            emoji: this.emoji
        };
    }
    async strikeELO(mode) {
        let rate = 1;
        if (mode === 'Strike') {
            rate = this.elo < 1200 ? 0.975 : 0.9875;
        }
        else if (mode === 'Unstrike') {
            rate = this.elo < 1200 ? 1.025 : 1.0125;
        }
        await this.update({ elo: Math.round(this.elo * rate) });
        return Math.round(this.elo * rate);
    }
}
exports.Player = Player;
var Players;
(function (Players) {
    async function getById(id) {
        const data = await (await database_1.default).players.findOne({ _id: id });
        return data ? new Player(data) : null;
    }
    Players.getById = getById;
    async function getByDiscord(id) {
        const data = await (await database_1.default).players.findOne({ discord: id });
        return data ? new Player(data) : null;
    }
    Players.getByDiscord = getByDiscord;
    async function getByMinecraft(uuid) {
        const data = await (await database_1.default).players.findOne({ "minecraft.uuid": uuid });
        return data ? new Player(data) : null;
    }
    Players.getByMinecraft = getByMinecraft;
    async function getManyById(ids) {
        const data = await (await database_1.default).players.find({
            _id: {
                $in: ids
            }
        }).toArray();
        const players = new discord_js_1.Collection();
        data.forEach(player => players.set(player._id, new Player(player)));
        return players;
    }
    Players.getManyById = getManyById;
    async function getManyByDiscord(ids) {
        const data = await (await database_1.default).players.find({
            discord: {
                $in: ids
            }
        }).toArray();
        const players = new discord_js_1.Collection();
        data.forEach(player => players.set(player.discord, new Player(player)));
        return players;
    }
    Players.getManyByDiscord = getManyByDiscord;
    async function getManyByMinecraft(uuids) {
        const data = await (await database_1.default).players.find({
            "minecraft.uuid": {
                $in: uuids
            }
        }).toArray();
        data.sort(function (a, b) { return uuids.indexOf(a.minecraft.uuid) - uuids.indexOf(b.minecraft.uuid); });
        const players = new discord_js_1.Collection();
        data.forEach(player => players.set(player.minecraft.uuid, new Player(player)));
        return players;
    }
    Players.getManyByMinecraft = getManyByMinecraft;
    async function updateBans() {
        const logger = new logger_1.default("Background Ban Processing");
        try {
            const [db, client, guild] = await Promise.all([database_1.default, bot_1.default, bot_1.defaultGuild]);
            const players = await db.players.find({
                banExpires: {
                    $lt: Date.now(),
                    $gte: 0,
                }
            }).toArray();
            await Promise.all(players.map(async ({ discord }) => {
                guild.members.cache.get(discord)?.roles.remove(guild.roles.cache.get(constants_1.Constants.RANKBANNED));
                guild.members.unban(discord).catch(() => null);
            }));
            if (players.length > 0) {
                let msg = 'Players';
                if (players.length === 1) {
                    msg = 'Player';
                }
                guild.channels.cache.get(constants_1.Constants.BAN_UNBAN.UNBAN_RESPONSE_CHANNEL).send(new discord_js_1.MessageEmbed()
                    .setTitle('Ranked Bedwars')
                    .setColor("#228B22")
                    .setDescription(`Unbanned ${players.map(p => client.users.cache.get(p.discord)).join(" ")}`)
                    .setFooter(`© Ranked Bedwars | Unbanned → ${players.length} ${msg} this wave.`, constants_1.Constants.BRANDING_URL)).catch(err => null);
                logger.info(`Unbanned ${players.length} ${msg} automatically.`);
            }
            await db.players.updateMany({
                _id: {
                    $in: players.map(({ _id }) => _id)
                }
            }, {
                $unset: {
                    banExpires: ""
                }
            });
        }
        catch (e) {
            logger.error(`Failed to execute successfully:\n${e.stack}`);
        }
    }
    Players.updateBans = updateBans;
})(Players = exports.Players || (exports.Players = {}));
class Game {
    constructor(data) {
        this.data = data;
    }
    ;
    get _id() {
        return this.data._id;
    }
    get voiceChannel() {
        return this.data.voiceChannel;
    }
    get textChannel() {
        return this.data.textChannel;
    }
    get team1() {
        return this.data.team1;
    }
    get team2() {
        return this.data.team2;
    }
    async update(data) {
        this.data = (await (await database_1.default).games.findOneAndUpdate({ _id: this._id }, {
            $set: data,
        }, {
            upsert: true,
        })).value;
        return this;
    }
}
exports.Game = Game;
function f(x) {
    return (x > 1
        ? 1 / (0.333333 + 1.09915 * Math.E ** (1 - 1.5 * x))
        : x) / 2;
}
function w(x) {
    return x <= 1 ? 0
        : 1 <= x && x <= 10 ? (x - 1) / 9
            : 1;
}
function b(x) {
    return x <= 10 ? x / 10
        : 1;
}
function calculateElo(players, winner, K = 64) {
    const [kills, teams] = players.reduce((a, b) => {
        if (!b)
            return a;
        b.team = b.team || winner;
        a[0] += b.kills || 0;
        if (!a[1][b.team]) {
            a[1][b.team] = {
                players: []
            };
        }
        a[1][b.team].players.push(b);
        return a;
    }, [0, {}]);
    const colours = Object.keys(teams);
    const opponents = colours.length - 1;
    for (const colour in teams) {
        const team = teams[colour];
        const R = team.players.reduce((a, b) => a + b.elo || 0, 0) / team.players.length;
        team.R = R;
        team.S = colour === winner ? 1 : 0;
    }
    let averageRating = 0;
    for (const colour in teams) {
        const team = teams[colour];
        const R = colours.reduce((a, b) => a + (b === colour ? 0 : teams[b].R), 0) / opponents;
        averageRating += R;
        const E = 1 / (opponents + 10 ** ((R - team.R) / 400));
        team.E = E;
    }
    averageRating = (averageRating / players.length) || 1;
    const averageKills = (kills / players.length) || 1;
    const ratings = players.reduce((a, player) => {
        const team = teams[player.team];
        const E = 1 / (1 + 10 ** ((averageRating - player.elo) / 400));
        const L = f(player.kills / averageKills);
        let rating = Math.round(K * (team.S - team.E) + 0.5 * K * (L - E) + 0.5 * K * w(player.winstreak) + K * b(player.bedstreak));
        if (team.S) {
            while (rating <= 10)
                rating += Math.round((5000 - (player.elo || 400)) / 300);
        }
        else {
            while (rating >= 0)
                rating -= Math.round((5000 - (player.elo || 400)) / 300);
        }
        a[player.minecraft.name] = rating + (player.elo || 400);
        return a;
    }, {});
    return [ratings, teams];
}
exports.calculateElo = calculateElo;
class LocalGame {
    constructor(gameNumber, id) {
        this.gameNumber = gameNumber;
        this.id = id;
        this.logger = new logger_1.default(`Game #${this.gameNumber}`);
        this._state = games_1.GameState.PRE_GAME;
    }
    ;
    get state() {
        return this._state;
    }
    get textChannel() {
        return this._textChannel;
    }
    get voiceChannel() {
        return this._voiceChannel;
    }
    get teams() {
        return [this.team1, this.team2];
    }
    get teamPlayers() {
        return [this.team1Players, this.team2Players];
    }
    get gameMembers() {
        return this.gamePlayers ?? [];
    }
    async createChannels(members, vc) {
        const guild = await bot_1.defaultGuild;
        const index = constants_1.Constants.QUEUES_ARRAY.findIndex(q => q.includes(vc.id));
        const textCategory = await findOpenCategory(constants_1.Constants.CATEGORY_ARRAY[index].map(cat => guild.channels.cache.get(cat)));
        const [textChannel] = await Promise.all([
            guild.channels.create(`game-${this.gameNumber}`, {
                type: "text",
                permissionOverwrites: [
                    {
                        id: (await bot_1.defaultGuild).id,
                        deny: ["VIEW_CHANNEL"]
                    }
                ],
                parent: textCategory
            })
        ]);
        this._textChannel = textChannel;
        this._voiceChannel = vc;
        this.gamePlayers = members.map(mem => mem.id);
        return { textChannel };
    }
    async end() {
        await Promise.all([
            this.update({
                $set: {
                    state: games_1.GameState.FINISHED,
                    team1: this.team1,
                    team2: this.team2,
                }
            }),
            ...this._bot ? [BotManager.release(this._bot)] : [],
        ]);
        this._state = games_1.GameState.FINISHED;
        setTimeout(async () => {
            this._textChannel?.delete().catch(_ => null);
            if (this.team1Channel) {
                await Promise.all(this.team1Channel.members.map(member => member.voice.setChannel(constants_1.Constants.WAITING_ROOM))).catch(_ => null);
                this.team1Channel?.delete().catch(_ => null);
            }
            if (this.team2Channel) {
                await Promise.all(this.team2Channel.members.map(member => member.voice.setChannel(constants_1.Constants.WAITING_ROOM))).catch(_ => null);
                this.team2Channel?.delete().catch(_ => null);
            }
        }, 10000);
    }
    async start(team1, team2) {
        this.team1 = {
            players: team1.map(player => player.toGamePlayer())
        };
        this.team1Players = team1;
        this.team2 = {
            players: team2.map(player => player.toGamePlayer())
        };
        this.team2Players = team2;
        await this.update({
            $set: {
                state: games_1.GameState.ACTIVE,
                team1: {
                    players: this.team1.players,
                },
                team2: {
                    players: this.team2.players,
                },
            }
        });
        this._state = games_1.GameState.ACTIVE;
    }
    getPlayer(player) {
        return this.team1?.players.find(({ username }) => username === player) ?? this.team2?.players.find(({ username }) => username === player) ?? null;
    }
    getFullPlayer(player) {
        return this.team1Players?.find(({ minecraft }) => minecraft.name === player) ?? this.team2Players?.find(({ minecraft }) => minecraft.name === player) ?? null;
    }
    async cancel(deleteChannels = false) {
        this._state = games_1.GameState.VOID;
        try {
            await Promise.all([
                this.update({
                    $set: {
                        state: games_1.GameState.VOID,
                    }
                }),
                ...this._bot ? [BotManager.release(this._bot)] : [],
            ]);
        }
        catch (e) {
            console.error(`Failed to cancel the game:\n${e.stack}`);
        }
        if (deleteChannels) {
            this._textChannel?.delete().catch(_ => null);
            if (this.team1Channel) {
                await Promise.all(this.team1Channel.members.map(member => member.voice.setChannel(constants_1.Constants.WAITING_ROOM))).catch(_ => null);
                this.team1Channel?.delete().catch(_ => null);
            }
            if (this.team2Channel) {
                await Promise.all(this.team2Channel.members.map(member => member.voice.setChannel(constants_1.Constants.WAITING_ROOM))).catch(_ => null);
                this.team2Channel?.delete().catch(_ => null);
            }
        }
        return;
    }
    async enterStartingState() {
        try {
            await this.update({
                $set: {
                    state: games_1.GameState.STARTING,
                }
            });
            this._state = games_1.GameState.STARTING;
        }
        catch (e) {
            this.logger.error(`Failed to entering the starting phase:\n${e.stack}`);
        }
    }
    async getAssignedBot() {
        if (this._state === games_1.GameState.VOID)
            return { error: true, reason: 'GAME_VOID' };
        if (this._bot)
            return { error: false, username: this._bot };
        const bot = await BotManager.assign(this.id);
        if (bot === null)
            return { error: true, reason: 'NONE_AVAILABLE' };
        return { error: false, username: this._bot = bot };
    }
    async update(update, options) {
        return await (await database_1.default).games.updateOne({
            _id: this.id,
        }, update, options);
    }
    setTeamChannels(team1, team2) {
        this.team1Channel = team1;
        this.team2Channel = team2;
    }
    pickMap() {
        return new Promise(async (res, rej) => {
            const reject = () => rej(new Error("MESSAGE_DELETED"));
            const playerCount = (this.team1Players?.length ?? 0) + (this.team2Players?.length ?? 0);
            let maps = Object.keys(maps_object), firstMap, secondMap, pick, rankedlogo = "https://cdn.discordapp.com/attachments/759444475818278942/805517822360027146/rbw_white_logo.jpg";
            firstMap = maps[Math.floor(Math.random() * maps.length)];
            maps = maps.filter(map => map !== firstMap);
            secondMap = maps[Math.floor(Math.random() * maps.length)];
            let [, , m] = await Promise.all([
                this.textChannel.send(new discord_js_1.MessageEmbed()
                    .setColor("ORANGE")
                    .setTitle(`1️⃣ ${firstMap}`)
                    .addField("Build Limit", `Y: ${maps_object[firstMap].limit}`)
                    .setImage(maps_object[firstMap].img)
                    .setFooter("© Ranked Bedwars", rankedlogo)),
                this.textChannel.send(new discord_js_1.MessageEmbed()
                    .setColor("ORANGE")
                    .setTitle(`2️⃣ ${secondMap}`)
                    .addField("Build Limit", `Y: ${maps_object[secondMap].limit}`)
                    .setImage(maps_object[secondMap].img)
                    .setFooter("© Ranked Bedwars", rankedlogo)),
                await this.textChannel.send(new discord_js_1.MessageEmbed()
                    .setColor("ORANGE")
                    .setTitle("Map Picking")
                    .addField(`1️⃣ ${firstMap}`, "\u200b")
                    .addField(`2️⃣ ${secondMap}`, "\u200b")
                    .addField("♻️ Reroll", "\u200b")
                    .setFooter("© Ranked Bedwars | Map Picking", rankedlogo)),
            ]);
            let reactions = ["1️⃣", "2️⃣", "♻️"];
            await Promise.all(reactions.map(reaction => m.react(reaction).catch(rej)));
            let optionone = [], optiontwo = [], optionthree = [];
            if (m.deleted)
                return reject();
            let collector = m.createReactionCollector((reaction) => {
                return reactions.includes(reaction.emoji.name);
            }, { time: 30000 });
            collector.on('collect', async (reaction, user) => {
                reaction.users.remove(user);
                switch (reaction.emoji.name) {
                    case "1️⃣": {
                        if (optionone.includes(user))
                            return;
                        optionone.push(user);
                        optiontwo = optiontwo.filter(u => u !== user);
                        optionthree = optionthree.filter(u => u !== user);
                        await m.edit(new discord_js_1.MessageEmbed()
                            .setColor("ORANGE")
                            .setTitle("Map Picking")
                            .addField(`1️⃣ ${firstMap}`, "\u200b" + optionone.join("\n"))
                            .addField(`2️⃣ ${secondMap}`, "\u200b" + optiontwo.join("\n"))
                            .addField("♻️ Reroll", "\u200b" + optionthree.join("\n"))
                            .setFooter("© Ranked Bedwars | Map Picking", rankedlogo));
                        break;
                    }
                    case "2️⃣": {
                        if (optiontwo.includes(user))
                            return;
                        optionone = optionone.filter(u => u !== user);
                        optiontwo.push(user);
                        optionthree = optionthree.filter(u => u !== user);
                        await m.edit(new discord_js_1.MessageEmbed()
                            .setColor("ORANGE")
                            .setTitle("Map Picking")
                            .addField(`1️⃣ ${firstMap}`, "\u200b" + optionone.join("\n"))
                            .addField(`2️⃣ ${secondMap}`, "\u200b" + optiontwo.join("\n"))
                            .addField("♻️ Reroll", "\u200b" + optionthree.join("\n"))
                            .setFooter("© Ranked Bedwars | Map Picking", rankedlogo));
                        break;
                    }
                    case "♻️": {
                        if (optionthree.includes(user))
                            return;
                        optionone = optionone.filter(u => u !== user);
                        optiontwo = optiontwo.filter(u => u !== user);
                        optionthree.push(user);
                        await m.edit(new discord_js_1.MessageEmbed()
                            .setColor("ORANGE")
                            .setTitle("Map Picking")
                            .addField(`1️⃣ ${firstMap}`, "\u200b" + optionone.join("\n"))
                            .addField(`2️⃣ ${secondMap}`, "\u200b" + optiontwo.join("\n"))
                            .addField("♻️ Reroll", "\u200b" + optionthree.join("\n"))
                            .setFooter("© Ranked Bedwars | Map Picking", rankedlogo));
                        break;
                    }
                }
            });
            collector.on('end', async () => {
                if (m.deleted)
                    return reject();
                m.reactions.removeAll().catch(err => console.log(err));
                if (optionone.length > optiontwo.length && optionone.length > optionthree.length)
                    pick = firstMap;
                else if (optiontwo.length > optionone.length && optiontwo.length > optionthree.length)
                    pick = secondMap;
                else
                    pick = null;
                if (pick) {
                    await m.edit(new discord_js_1.MessageEmbed()
                        .setColor("ORANGE")
                        .setTitle("Map Picking")
                        .setDescription(`The map **${pick}** has been chosen, by a margin of ${Math.abs(optionone.length - optiontwo.length)} vote${Math.abs(optionone.length - optiontwo.length) > 1 ? "s" : ""}!`)
                        .setFooter("© Ranked Bedwars | Map Picking", rankedlogo));
                    return res(pick);
                }
                else {
                    maps = maps.filter(map => map !== secondMap);
                    firstMap = maps[Math.floor(Math.random() * maps.length)];
                    maps = maps.filter(map => map !== firstMap);
                    secondMap = maps[Math.floor(Math.random() * maps.length)];
                    const [, , m] = await Promise.all([
                        this.textChannel.send(new discord_js_1.MessageEmbed()
                            .setColor("ORANGE")
                            .setTitle(`1️⃣ ${firstMap}`)
                            .addField("Build Limit", `Y: ${maps_object[firstMap].limit}`)
                            .setImage(maps_object[firstMap].img)
                            .setFooter("© Ranked Bedwars", rankedlogo)),
                        this.textChannel.send(new discord_js_1.MessageEmbed()
                            .setColor("ORANGE")
                            .setTitle(`2️⃣ ${secondMap}`)
                            .addField("Build Limit", `Y: ${maps_object[secondMap].limit}`)
                            .setImage(maps_object[secondMap].img)
                            .setFooter("© Ranked Bedwars", rankedlogo)),
                        this.textChannel.send(new discord_js_1.MessageEmbed()
                            .setColor("ORANGE")
                            .setTitle("Map Picking | Reroll")
                            .addField(`1️⃣ ${firstMap}`, "\u200b")
                            .addField(`2️⃣ ${secondMap}`, "\u200b")
                            .setFooter("© Ranked Bedwars | Map Picking", rankedlogo))
                    ]);
                    optionone = [], optiontwo = [];
                    reactions = ["1️⃣", "2️⃣"];
                    for (const reaction of reactions) {
                        await m.react(reaction).catch(rej);
                    }
                    ;
                    if (m.deleted)
                        return reject();
                    collector = m.createReactionCollector((reaction) => {
                        return reactions.includes(reaction.emoji.name);
                    }, { time: 30000 });
                    collector.on('collect', async (reaction, user) => {
                        reaction.users.remove(user);
                        if (reaction.emoji.name === "1️⃣") {
                            if (optionone.includes(user))
                                return;
                            optionone.push(user);
                            optiontwo = optiontwo.filter(u => u !== user);
                            await m.edit(new discord_js_1.MessageEmbed()
                                .setColor("ORANGE")
                                .setTitle("Map Picking | Reroll")
                                .addField(`1️⃣ ${firstMap}`, "\u200b" + optionone.join("\n"))
                                .addField(`2️⃣ ${secondMap}`, "\u200b" + optiontwo.join("\n"))
                                .setFooter("© Ranked Bedwars | Map Picking", rankedlogo));
                        }
                        else if (reaction.emoji.name === "2️⃣") {
                            if (optiontwo.includes(user))
                                return;
                            optionone = optionone.filter(u => u !== user);
                            optiontwo.push(user);
                            await m.edit(new discord_js_1.MessageEmbed()
                                .setColor("ORANGE")
                                .setTitle("Map Picking | Reroll")
                                .addField(`1️⃣ ${firstMap}`, "\u200b" + optionone.join("\n"))
                                .addField(`2️⃣ ${secondMap}`, "\u200b" + optiontwo.join("\n"))
                                .setFooter("© Ranked Bedwars | Map Picking", rankedlogo));
                        }
                    });
                    collector.on('end', async () => {
                        if (m.deleted)
                            return reject();
                        m.reactions.removeAll().catch(err => console.log(err));
                        if (optionone.length > optiontwo.length)
                            pick = firstMap;
                        else if (optiontwo.length > optionone.length)
                            pick = secondMap;
                        else
                            pick = null;
                        if (pick) {
                            await m.edit(new discord_js_1.MessageEmbed()
                                .setColor("ORANGE")
                                .setTitle("Map Picking | Reroll")
                                .setDescription(`The map **${pick}** has been chosen, by a margin of ${Math.abs(optionone.length - optiontwo.length)} vote${Math.abs(optionone.length - optiontwo.length) > 1 ? "s" : ""}!`)
                                .setFooter("© Ranked Bedwars | Map Picking", rankedlogo));
                        }
                        else {
                            pick = [firstMap, secondMap][Math.floor(Math.random() * 2)];
                            await m.edit(new discord_js_1.MessageEmbed()
                                .setColor("ORANGE")
                                .setTitle("Map Picking | Reroll")
                                .setDescription(`The map **${pick}** has been randomly chosen, due to a draw.`)
                                .setFooter("© Ranked Bedwars | Map Picking", rankedlogo));
                        }
                        res(pick);
                    });
                }
            });
        });
    }
}
exports.LocalGame = LocalGame;
exports.activeGames = new discord_js_1.Collection();
async function hasPerms(member, roles) {
    let hasPerms = false;
    member?.roles.cache.forEach(role => {
        if (roles.includes(role.id)) {
            hasPerms = true;
        }
    });
    if (member.id === constants_1.Constants.CLIENT_ID)
        hasPerms = true;
    return hasPerms;
}
exports.hasPerms = hasPerms;
async function createNewGame() {
    const db = await database_1.default;
    const { insertedId } = await db.games.insertOne({});
    const gameNumber = 1 + await db.games.find({
        _id: {
            $lt: insertedId
        }
    }).sort({ _id: 1 }).count();
    const game = new LocalGame(gameNumber, insertedId);
    exports.activeGames.set(insertedId, game);
    return { game, gameNumber, insertedId };
}
exports.createNewGame = createNewGame;
async function isAssigned(username) {
    const bot = socket_1.bots.get(username);
    if (!bot)
        return true;
    return new Promise(r => {
        bot.emit('isAssigned', r);
    });
}
var BotManager;
(function (BotManager) {
    const logger = new logger_1.default("Mineflayer Bot Manager");
    async function assign(game) {
        const db = await database_1.default;
        const start = Date.now();
        let value = null;
        while (!value && Date.now() - start < 60000) {
            ({ value } = await db.bots.findOneAndUpdate({
                assignedGame: {
                    $exists: false
                }
            }, {
                $set: {
                    assignedGame: game
                }
            }, { returnOriginal: true }));
            if (value && await isAssigned(value.username) === true) {
                await db.bots.updateOne({
                    username: value.username
                }, {
                    $set: {
                        assignedGame: new mongodb_1.ObjectId()
                    }
                });
                value = null;
            }
            await delay(1000);
        }
        return value?.username ?? null;
    }
    BotManager.assign = assign;
    async function release(bot) {
        console.trace(`Release ${bot}`);
        try {
            await (await database_1.default).bots.updateOne({
                username: bot,
            }, {
                $unset: {
                    assignedGame: true,
                }
            });
        }
        catch { }
        ;
    }
    BotManager.release = release;
    async function getAssignedGame(name, options = {}) {
        const data = await (await database_1.default).bots.findOne({ username: name });
        return data?.assignedGame ?? null;
    }
    BotManager.getAssignedGame = getAssignedGame;
})(BotManager = exports.BotManager || (exports.BotManager = {}));
function getBanDuration(existingStrikes, strikesToAdd) {
    socket_1.devLogger.info(`existingStrikes --> ${existingStrikes}`);
    socket_1.devLogger.info(`stringsToAdd --> ${strikesToAdd}`);
    if (existingStrikes + strikesToAdd > 10) {
        return '0d';
    }
    const strikes = Math.max(existingStrikes, 0) + strikesToAdd;
    const durations = [3, 6, 12, 1, 2, 3, 4, 5, 6, 0];
    return `${durations[strikes - 2]}${strikes > 4 ? 'd' : 'h'}`;
}
exports.getBanDuration = getBanDuration;
function getRole(p) {
    return constants_1.Constants.ELO_ROLES[Math.floor(Math.abs(p) / 100)];
}
async function gameReport(teams, winner, number, tag, nameMap, guild) {
    const scoring = new discord_js_1.MessageEmbed()
        .setAuthor(`Automatic Scoring: Score Request [#${number}]`, 'https://cdn.discordapp.com/attachments/799897234128764958/804020431576105000/Daco_3568543.png');
    for (const team in teams) {
        const name = nameMap.get(team);
        const users = teams[team].players.map((p) => {
            const oldRole = getRole(p.oldRating);
            const newRole = getRole(p.newRating);
            const updated = oldRole && newRole && oldRole !== newRole;
            if (updated) {
                guild.members.fetch(p.discord)
                    .then((m) => {
                    m.roles.add(newRole).catch(() => { });
                    m.roles.remove(oldRole).catch(() => { });
                    if (!m.roles.cache.has(constants_1.Constants.SUPPORT_ROLE_ID))
                        m.setNickname(`[${p.newRating}] ${p.username}`).catch(() => { });
                })
                    .catch(() => { });
            }
            return `**${p.username}** | \`[${p.oldRating} → ${p.newRating}]\`${updated ? ` <@&${oldRole}> → <@&${newRole}>` : ''}`;
        }).join('\n');
        scoring.addField(`${name} Team`, users);
    }
    scoring.addField('Winning Team', `\`•\` ${nameMap.get(winner)}`);
    const channel = guild.channels.cache.get(constants_1.Constants.GAME_REPORT_CHANNEL);
    try {
        const m = await channel.send(tag, scoring);
    }
    catch (e) {
        console.log('GAME_ERROR', e);
        console.log(`Couldn't send Game Report for game: ${number}`);
    }
}
exports.gameReport = gameReport;
async function updateRoles(member_id, role1_id, role2_id) {
    const guild = await bot_1.defaultGuild;
    const member = guild.members.cache.get(member_id);
    await member?.roles.remove(role1_id).catch(() => null);
    await member?.roles.add(role2_id).catch(() => null);
}
exports.updateRoles = updateRoles;
function delay(delay) {
    return new Promise(r => setTimeout(r, delay, true));
}
exports.delay = delay;
function findOpenCategory(categories) {
    return new Promise(res => {
        const cat = categories.find(cat => cat.children.size <= 20);
        if (cat)
            return res(cat);
        const checker = setInterval(() => {
            const cat = categories.find(cat => cat.children.size <= 20);
            if (cat) {
                clearInterval(checker);
                return res(cat);
            }
        }, 5000);
    });
}
exports.findOpenCategory = findOpenCategory;
async function checkStatus(username) {
    let bool = false;
    await hypixel.getPlayer(username).then((player) => {
        console.log(`isOnline --> ${player.isOnline}`);
        bool = player.isOnline;
    }).catch((e) => {
        console.error('ASD', e);
    });
    return bool;
}
exports.checkStatus = checkStatus;
function toEscapedFormat(str) {
    return str.replace("_", "\_");
}
exports.toEscapedFormat = toEscapedFormat;
