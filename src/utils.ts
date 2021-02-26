import { CategoryChannel, Collection, GuildMember, MessageEmbed, MessageReaction, TextChannel, User, VoiceChannel } from "discord.js";
import type { ObjectId as ObjectIdType, UpdateOneOptions, UpdateQuery } from "mongodb";
import { ObjectId } from 'mongodb';
import { Constants } from "./constants";
import Logger from "./logger";
import bot, { defaultGuild } from "./managers/bot";
import database from "./managers/database";
import { Game as _Game, GamePlayer, GameState, Team } from "./typings/games";
import type { Player as _Player } from "./typings/players";
const { HYPIXEL_KEY } = process.env;
import { bots, devLogger } from "./managers/socket";
const Hypixel = require('hypixel-api-reborn');
const hypixel = new Hypixel.Client(HYPIXEL_KEY);

interface _Map {
    img: string;
    limit: string;
}

const maps_object: { [key: string]: _Map } = {
    "Extinction": {img:"https://media.discordapp.net/attachments/796082875475689506/810012638955175986/extiction-png.png", limit:"+95"},
    "Enchanted": {img:"https://media.discordapp.net/attachments/796082875475689506/810015425155825687/enchanted-png.png", limit:"+100"},
    "Aquarium": {img:"https://cdn.discordapp.com/attachments/799897234128764958/800008639342575667/aquariumold-png.png", limit:"+110"},
    "Katsu": {img:"https://cdn.discordapp.com/attachments/799897234128764958/800010460429942794/NEW-Katsu-bw-3v3v3v3-4v4v4v4.png", limit:"+96"},
    "Invasion": {img:"https://cdn.discordapp.com/attachments/799897234128764958/800014465294008370/image0.jpg", limit:"+115"},
    "Rise": {img:"https://cdn.discordapp.com/attachments/800022796301369344/800024134217629706/rise-png.png", limit:"+96"},
    "Temple": {img:"https://cdn.discordapp.com/attachments/800022796301369344/800023969918746624/templebedwars-png.png", limit:"+106"}, 
    "Lectus": {img:"https://cdn.discordapp.com/attachments/799897234128764958/800014149232492594/image0.jpg", limit:"+90"},
    "Catalyst": {img:"https://media.discordapp.net/attachments/796082875475689506/811700045085671514/catalyst-png.png", limit:"+101"},
    "Treenan": {img:"https://media.discordapp.net/attachments/796082875475689506/811700135339622430/treenan-png.png", limit:"+121"},
}

export class Player {

    constructor(private data: _Player){};

    get _id(){
        return this.data._id;
    }

    get discord(){
        return this.data.discord;
    }

    get minecraft(){
        return this.data.minecraft;
    }

    get registeredAt(){
        return this.data.registeredAt;
    }

    get wins(){
        return this.data.wins ?? 0;
    }

    get losses(){
        return this.data.losses ?? 0;
    }

    get bedsBroken(){
        return this.data.bedsBroken ?? 0;
    }

    get bedsLost(){
        return this.data.bedsLost ?? 0;
    }

    get elo(){
        return this.data.elo ?? 0;
    }

    get kills(){
        return this.data.kills ?? 0;
    }

    get deaths(){
        return this.data.deaths ?? 0;
    }

    get roles() {
        return this.data.roles ?? [];
    }

    get banExpires() {
        return this.data.banExpires ?? 0;
    }

    /** Get if the player is currently banned. */
    get banned(){
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

    get messages(): { [key: number]: string } {
        return this.data.messages;
    }

    get loseMessage(): string | undefined {
        return this.data.loseMessage;
    }

    get emoji() {
        return this.data.emoji;
    }

    get winMessage(): string | undefined {
        return this.data.winMessage;
    }

    async update(data: Partial<_Player>){
        this.data = (await (await database).players.findOneAndUpdate({ _id: this._id }, {
            $set: data,
        }, {
            upsert: true,
        })).value!;
        return this;
    }

    async ban(duration = -1){
        if(this.banned && ((this.banExpires - Date.now())) + duration < 0) this.data = (await (await database).players.findOneAndUpdate({ _id: this._id }, {
            $set: {
                banExpires: 0,
            },
        }, {
            upsert: true,
        })).value!;
        else if(duration === -1) this.data = (await (await database).players.findOneAndUpdate({ _id: this._id }, {
            $set: {
                banExpires: -1,
            },
        }, {
            upsert: true,
        })).value!;
        else {
            if(this.banned) this.data = (await (await database).players.findOneAndUpdate({ _id: this._id }, {
                $inc: {
                    banExpires: duration,
                },
            }, {
                upsert: true,
            })).value!;
            else this.data = (await (await database).players.findOneAndUpdate({ _id: this._id }, {
                $set: {
                    banExpires: Date.now() + duration,
                },
            }, {
                upsert: true,
            })).value!;
        }
        return this;
    }

    async unban(){
        this.data = (await (await database).players.findOneAndUpdate({ _id: this._id }, {
            $unset: {
                banExpires: ""
            },
        }, {
            upsert: true,
        })).value!;
        return this;
    }

    toGamePlayer(): GamePlayer {
        return { username: this.minecraft.name, winstreak: this.winstreak, bedstreak: this.bedstreak, discord: this.discord };
    }

    toJSON(): _Player {
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

    async strikeELO(mode: string) {

        let rate = 1;

        if(mode === 'Strike') {
            rate = this.elo < 1200 ? 0.975 : 0.9875;
        }
        else if(mode === 'Unstrike') {
            rate = this.elo < 1200 ? 1.025 : 1.0125;
        }
        
        await this.update({ elo: Math.round(this.elo * rate) });
        return Math.round(this.elo * rate);
    }

}

/** Ways to fetch player data.  */
export namespace Players {

    /** Gets a player by their **Competitive Bedwars ID**. */
    export async function getById(id: ObjectIdType){
        const data = await (await database).players.findOne({ _id: id });
        return data ? new Player(data) : null;
    }

    /** Gets a player by their **Discord ID**. */
    export async function getByDiscord(id: string){
        const data = await (await database).players.findOne({ discord: id });
        return data ? new Player(data) : null;
    }

    /** Gets a player by their **Minecraft UUID**. */
    export async function getByMinecraft(uuid: string){
        const data = await (await database).players.findOne({ "minecraft.uuid": uuid });
        return data ? new Player(data) : null;
    }

    /** Gets multiple players by their **Competitive Bedwars ID**. */
    export async function getManyById(ids: ObjectIdType[]){
        const data = await (await database).players.find({
            _id: {
                $in: ids
            }
        }).toArray();
        const players = new Collection<ObjectIdType, Player>();
        data.forEach(player => players.set(player._id, new Player(player)));
        return players;
    }

    /** Gets multiple players by their **Discord ID**. */
    export async function getManyByDiscord(ids: string[]){

        const data = await (await database).players.find({
            discord: {
                $in: ids
            }
        }).toArray();

        const players = new Collection<string, Player>();
        data.forEach(player => players.set(player.discord, new Player(player)));
        return players;
    }

    /** Gets multiple players by their **Minecraft UUID**. */
    export async function getManyByMinecraft(uuids: string[]){
        const data = await (await database).players.find({
            "minecraft.uuid": {
                $in: uuids
            }
        }).toArray();

        data.sort(function(a, b) {return uuids.indexOf(a.minecraft.uuid) - uuids.indexOf(b.minecraft.uuid)})

        const players = new Collection<string, Player>();
        data.forEach(player => players.set(player.minecraft.uuid, new Player(player)));
        return players;
    }

    /** Update roles + player data for all players that should be unbanned (ban has expired.) */
    export async function updateBans(){
        const logger = new Logger("Background Ban Processing");
        try {
            const [db, client, guild] = await Promise.all([database, bot, defaultGuild]);
    
            const players = await db.players.find({
                banExpires: {
                    $lt: Date.now(),
                    $gte: 0,
                }
            }).toArray();
    
            await Promise.all(players.map(async ({ discord }) => {
                guild.members.cache.get(discord)?.roles.remove(guild.roles.cache.get(Constants.RANKBANNED)!);
                guild.members.unban(discord).catch(() => null);
            }));
    
            if(players.length > 0) {
    
                let msg = 'Players';
    
                if(players.length === 1) {
                    msg = 'Player';
                }
    
                (guild.channels.cache.get(Constants.BAN_UNBAN.UNBAN_RESPONSE_CHANNEL)! as TextChannel).send(new MessageEmbed() 
                    .setTitle('Ranked Bedwars')
                    .setColor("#228B22")
                    .setDescription(`Unbanned ${players.map(p => client.users.cache.get(p.discord)).join(" ")}`)
                    .setFooter(`© Ranked Bedwars | Unbanned → ${players.length} ${msg} this wave.`, Constants.BRANDING_URL)
                ).catch(err => null);

                logger.info(`Unbanned ${players.length} ${msg} automatically.`);
            }
    
            // Update all players in the db
            await db.players.updateMany({
                _id: {
                    $in: players.map(({ _id }) => _id)
                }
            }, {
                $unset: {
                    banExpires: ""
                }
            });
        } catch(e){
            logger.error(`Failed to execute successfully:\n${e.stack}`);
        }

    }

}

export class Game {

    constructor(private data: _Game){};

    get _id(){
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

    async update(data: Partial<_Game>){
        this.data = (await (await database).games.findOneAndUpdate({ _id: this._id }, {
            $set: data,
        }, {
            upsert: true,
        })).value!;
        return this;
    }

}

// I'm dedicating this function in the src code of the bot to HerrStahly. Assume all arrays taken in are in order of P0 to P7 
// where P0 to P3 are Team 1 players and P4 to P7 are Team 2 players and S is the outcome of the game relative to Team 1

function f(x: number) {
	return (x > 1
		? 1 / (0.333333 + 1.09915 * Math.E ** (1 - 1.5 * x))
		: x) / 2;
}

function w(x: number) {
	return x <= 1 ? 0
		: 1 <= x && x <= 10 ? (x - 1) / 9
		: 1;
}

function b(x: number) {
	return x <= 10 ? x / 10
		: 1;
}

export function calculateElo(players: any[], winner: string, K = 64) {
	const [ kills, teams ] = players.reduce((a, b) => {
		if (!b) return a;

        b.team = b.team || winner;
		a[0] += b.kills || 0;

		if (!a[1][b.team]) {
			a[1][b.team] = {
				players: []
			};
		}

		a[1][b.team].players.push(b);

		return a;
	}, [ 0, {} ]);

	const colours = Object.keys(teams);
	const opponents = colours.length - 1;

	for (const colour in teams) {
		const team = teams[colour];
		const R = team.players.reduce((a: any, b: any) => a + b.elo || 0, 0) / team.players.length;

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

	const ratings = players.reduce((a: any, player) => {
		const team = teams[player.team];

		const E = 1 / (1 + 10 ** ((averageRating - player.elo) / 400));
		const L = f(player.kills / averageKills);

		let rating = Math.round(K * (team.S - team.E) + 0.5 * K * (L - E) + 0.5 * K * w(player.winstreak) + K * b(player.bedstreak));

        if (team.S) {
            while (rating <= 10)
                rating += Math.round((5000 - (player.elo || 400)) / 300);
        } else {
            while (rating >= 0)
                rating -= Math.round((5000 - (player.elo || 400)) / 300);
        }

        a[player.minecraft.name] = rating + (player.elo || 400);

        return a;
	}, {});

	return [ ratings, teams ];
}

export class LocalGame {

    public readonly logger = new Logger(`Game #${this.gameNumber}`);
    private gamePlayers?: string[];
    private _textChannel?: TextChannel;
    private _voiceChannel?: VoiceChannel;
    private _bot?: string;
    private _state = GameState.PRE_GAME;
    private team1?: Team;
    private team2?: Team;
    private team1Players?: Player[];
    private team2Players?: Player[];
    private team1Channel?: VoiceChannel;
    private team2Channel?: VoiceChannel;

    constructor(public readonly gameNumber: number, public readonly id: ObjectIdType){};

    get state(){
        return this._state;
    }

    get textChannel(){
        return this._textChannel;
    }

    get voiceChannel(){
        return this._voiceChannel;
    }

    get teams(): [ Team | undefined, Team | undefined ] {
        return [ this.team1, this.team2 ];
    }

    get teamPlayers(): [ Player[] | undefined, Player[] | undefined ] {
        return [ this.team1Players, this.team2Players ];
    }

    get gameMembers(){
        return this.gamePlayers ?? [];
    }

    async createChannels(members: GuildMember[], vc: VoiceChannel){
        const guild = await defaultGuild;

        const index = Constants.QUEUES_ARRAY.findIndex(q => q.includes(vc.id));

        const textCategory = await findOpenCategory(Constants.CATEGORY_ARRAY[index].map(cat => guild.channels.cache.get(cat)! as CategoryChannel));

        const [ textChannel ] = await Promise.all([
            guild.channels.create(`game-${this.gameNumber}`, {
                type: "text",
                permissionOverwrites: [
                    {
                        id: (await defaultGuild).id,
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

    async end(){
        await Promise.all<any>([
            this.update({
                $set: {
                    state: GameState.FINISHED,
                    team1: this.team1,
                    team2: this.team2,
                }
            }),
            ...this._bot ? [BotManager.release(this._bot)] : [],
        ]);
        this._state = GameState.FINISHED;
        setTimeout(async () => {
            this._textChannel?.delete().catch(_ => null);
            if(this.team1Channel){
                await Promise.all(this.team1Channel!.members.map(member => member.voice.setChannel(Constants.WAITING_ROOM))).catch(_ => null);
                this.team1Channel?.delete().catch(_ => null);
            }
            if(this.team2Channel){
                await Promise.all(this.team2Channel!.members.map(member => member.voice.setChannel(Constants.WAITING_ROOM))).catch(_ => null);
                this.team2Channel?.delete().catch(_ => null);
            }
        }, 10000);
    }

    async start(team1: Player[], team2: Player[]){
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
                state: GameState.ACTIVE,
                team1: {
                    players: this.team1.players,
                },
                team2: {
                    players: this.team2.players,
                },
            }
        });
        this._state = GameState.ACTIVE;
    }

    getPlayer(player: string){
        return this.team1?.players.find(({ username }) => username === player) ?? this.team2?.players.find(({ username }) => username === player) ?? null;
    }

    /** Gets the full `Player` object of a player cached by this game. */
    getFullPlayer(player: string){
        return this.team1Players?.find(({ minecraft }) => minecraft.name === player) ?? this.team2Players?.find(({ minecraft }) => minecraft.name === player) ?? null;
    }

    async cancel(deleteChannels: boolean = false) {
        this._state = GameState.VOID;
        try {
            await Promise.all<any>([
                this.update({
                    $set: {
                        state: GameState.VOID,
                    }
                }),
                ...this._bot ? [BotManager.release(this._bot)] : [],
            ])
        } catch(e){
            console.error(`Failed to cancel the game:\n${e.stack}`);
        }

        if (deleteChannels) {
            this._textChannel?.delete().catch(_ => null);
            if(this.team1Channel){
                await Promise.all(this.team1Channel!.members.map(member => member.voice.setChannel(Constants.WAITING_ROOM))).catch(_ => null);
                this.team1Channel?.delete().catch(_ => null);
            }
            if(this.team2Channel){
                await Promise.all(this.team2Channel!.members.map(member => member.voice.setChannel(Constants.WAITING_ROOM))).catch(_ => null);
                this.team2Channel?.delete().catch(_ => null);
            }
        }

        return;
    }

    async enterStartingState(){
        try {
            await this.update({
                $set: {
                    state: GameState.STARTING,
                }
            });
            this._state = GameState.STARTING;
        } catch(e){
            this.logger.error(`Failed to entering the starting phase:\n${e.stack}`);
        }
    }

    /** Gets the bot assigned to this game, or assigns a bot to this game if it doesn't have one. If no bots are available, will wait until one is. */
    async getAssignedBot(): Promise<{ error: boolean, reason?: string, username?: string }> {
        if (this._state === GameState.VOID) return { error: true, reason: 'GAME_VOID' };
        if (this._bot) return { error: false, username: this._bot };

        const bot = await BotManager.assign(this.id);

        if (bot === null) return { error: true, reason: 'NONE_AVAILABLE' };

        return { error: false, username: this._bot = bot };
    }

    async update(update: UpdateQuery<_Game> | Partial<_Game>, options?: UpdateOneOptions | undefined){
        return await (await database).games.updateOne({
            _id: this.id,
        }, update, options);
    }

    setTeamChannels(team1: VoiceChannel, team2: VoiceChannel){
        this.team1Channel = team1;
        this.team2Channel = team2;
    }

    pickMap(){
        return new Promise(async (res, rej) => { 
            const reject = () => rej(new Error("MESSAGE_DELETED"));
            const playerCount = (this.team1Players?.length ?? 0) + (this.team2Players?.length ?? 0);
            let maps = Object.keys(maps_object), firstMap: string, secondMap: string, pick, rankedlogo = "https://cdn.discordapp.com/attachments/759444475818278942/805517822360027146/rbw_white_logo.jpg";

            firstMap = maps[Math.floor(Math.random() * maps.length)];
            maps = maps.filter(map => map !== firstMap);
            secondMap = maps[Math.floor(Math.random() * maps.length)];

            let [,, m] = await Promise.all([
                this.textChannel!.send(
                    new MessageEmbed()
                    .setColor("ORANGE")
                    .setTitle(`1️⃣ ${firstMap}`)
                    .addField("Build Limit", `Y: ${maps_object[firstMap].limit}`)
                    .setImage(maps_object[firstMap].img)
                    .setFooter("© Ranked Bedwars", rankedlogo)
                ),
                this.textChannel!.send(
                    new MessageEmbed()
                    .setColor("ORANGE")
                    .setTitle(`2️⃣ ${secondMap}`)
                    .addField("Build Limit", `Y: ${maps_object[secondMap].limit}`)
                    .setImage(maps_object[secondMap].img)
                    .setFooter("© Ranked Bedwars", rankedlogo)
                ),
                await this.textChannel!.send(
                    new MessageEmbed()
                    .setColor("ORANGE")
                    .setTitle("Map Picking")
                    .addField(`1️⃣ ${firstMap}`, "\u200b")
                    .addField(`2️⃣ ${secondMap}`, "\u200b")
                    .addField("♻️ Reroll", "\u200b")
                    .setFooter("© Ranked Bedwars | Map Picking", rankedlogo)
                ),
            ]);

            let reactions = ["1️⃣", "2️⃣", "♻️"];

            await Promise.all(reactions.map(reaction => m.react(reaction).catch(rej)));

            let optionone: User[] = [], optiontwo: User[] = [], optionthree: User[] = [];

            if (m.deleted) return reject();
            
            let collector = m.createReactionCollector((reaction: MessageReaction) => {
                return reactions.includes(reaction.emoji.name);
            }, { time: 30000 });
            
            collector.on('collect', async (reaction, user) => {
                reaction.users.remove(user);
                switch (reaction.emoji.name) {
                    case "1️⃣": {
                        if (optionone.includes(user)) return;
                        optionone.push(user);
                        optiontwo = optiontwo.filter(u => u !== user);
                        optionthree = optionthree.filter(u => u !== user);

                        await m.edit(
                            new MessageEmbed()
                            .setColor("ORANGE")
                            .setTitle("Map Picking")
                            .addField(`1️⃣ ${firstMap}`, "\u200b"+optionone.join("\n"))
                            .addField(`2️⃣ ${secondMap}`, "\u200b"+optiontwo.join("\n"))
                            .addField("♻️ Reroll", "\u200b"+optionthree.join("\n"))
                            .setFooter("© Ranked Bedwars | Map Picking", rankedlogo)
                        );
                        break;
                    }
                    case "2️⃣": {
                        if (optiontwo.includes(user)) return;
            
                        optionone = optionone.filter(u => u !== user);
                        optiontwo.push(user);
                        optionthree = optionthree.filter(u => u !== user);
                
                        await m.edit(
                            new MessageEmbed()
                            .setColor("ORANGE")
                            .setTitle("Map Picking")
                            .addField(`1️⃣ ${firstMap}`, "\u200b"+optionone.join("\n"))
                            .addField(`2️⃣ ${secondMap}`, "\u200b"+optiontwo.join("\n"))
                            .addField("♻️ Reroll", "\u200b"+optionthree.join("\n"))
                            .setFooter("© Ranked Bedwars | Map Picking", rankedlogo)
                        );
                        break;
                    }
                    case "♻️": {
                        if (optionthree.includes(user)) return;
            
                        optionone = optionone.filter(u => u !== user);
                        optiontwo = optiontwo.filter(u => u !== user);
                        optionthree.push(user);
                
                        await m.edit(
                            new MessageEmbed()
                            .setColor("ORANGE")
                            .setTitle("Map Picking")
                            .addField(`1️⃣ ${firstMap}`, "\u200b"+optionone.join("\n"))
                            .addField(`2️⃣ ${secondMap}`, "\u200b"+optiontwo.join("\n"))
                            .addField("♻️ Reroll", "\u200b"+optionthree.join("\n"))
                            .setFooter("© Ranked Bedwars | Map Picking", rankedlogo)
                        );
                        break;
                    }
                }
            });
            
            collector.on('end', async () => {
                if (m.deleted) return reject();
                m.reactions.removeAll().catch(err => console.log(err));
                
                if(optionone.length > optiontwo.length && optionone.length > optionthree.length) pick = firstMap
                else if (optiontwo.length > optionone.length && optiontwo.length > optionthree.length) pick = secondMap
                else pick = null;
            
                if (pick) {
                    // assign a bot and then tell it which map has been picked
                    await m.edit(
                        new MessageEmbed()
                        .setColor("ORANGE")
                        .setTitle("Map Picking")
                        .setDescription(`The map **${pick}** has been chosen, by a margin of ${Math.abs(optionone.length-optiontwo.length)} vote${Math.abs(optionone.length-optiontwo.length) > 1 ? "s" : ""}!`)
                        .setFooter("© Ranked Bedwars | Map Picking", rankedlogo)
                    );
                    return res(pick);
                } else {
                    
                    maps = maps.filter(map => map !== secondMap);
                    firstMap = maps[Math.floor(Math.random() * maps.length)];
                    maps = maps.filter(map => map !== firstMap);
                    secondMap = maps[Math.floor(Math.random() * maps.length)];

                    const [,, m] = await Promise.all([
                        this.textChannel!.send(
                            new MessageEmbed()
                            .setColor("ORANGE")
                            .setTitle(`1️⃣ ${firstMap}`)
                            .addField("Build Limit", `Y: ${maps_object[firstMap].limit}`)
                            .setImage(maps_object[firstMap].img)
                            .setFooter("© Ranked Bedwars", rankedlogo)
                        ),
                        this.textChannel!.send(
                            new MessageEmbed()
                            .setColor("ORANGE")
                            .setTitle(`2️⃣ ${secondMap}`)
                            .addField("Build Limit", `Y: ${maps_object[secondMap].limit}`)
                            .setImage(maps_object[secondMap].img)
                            .setFooter("© Ranked Bedwars", rankedlogo)
                        ),
                        this.textChannel!.send(
                            new MessageEmbed()
                            .setColor("ORANGE")
                            .setTitle("Map Picking | Reroll")
                            .addField(`1️⃣ ${firstMap}`, "\u200b")
                            .addField(`2️⃣ ${secondMap}`, "\u200b")
                            .setFooter("© Ranked Bedwars | Map Picking", rankedlogo)
                        )
                    ]);
            
                    optionone = [], optiontwo = [];
            
                    reactions = ["1️⃣", "2️⃣"];
            
                    for (const reaction of reactions) {
                        await m.react(reaction).catch(rej);
                    };

                    if (m.deleted) return reject();
            
                    collector = m.createReactionCollector((reaction: MessageReaction) => {
                        return reactions.includes(reaction.emoji.name);
                    }, { time: 30000 });
            
                    collector.on('collect', async (reaction, user) => {
                        reaction.users.remove(user);
                        if (reaction.emoji.name === "1️⃣") {
            
                            if (optionone.includes(user)) return;
            
                            optionone.push(user);
                            optiontwo = optiontwo.filter(u => u !== user);
            
                            await m.edit(
                                new MessageEmbed()
                                .setColor("ORANGE")
                                .setTitle("Map Picking | Reroll")
                                .addField(`1️⃣ ${firstMap}`, "\u200b"+optionone.join("\n"))
                                .addField(`2️⃣ ${secondMap}`, "\u200b"+optiontwo.join("\n"))
                                .setFooter("© Ranked Bedwars | Map Picking", rankedlogo)
                            );
            
                        } else if (reaction.emoji.name === "2️⃣") {
            
                            if (optiontwo.includes(user)) return;
            
                            optionone = optionone.filter(u => u !== user);
                            optiontwo.push(user);
            
                            await m.edit(
                                new MessageEmbed()
                                .setColor("ORANGE")
                                .setTitle("Map Picking | Reroll")
                                .addField(`1️⃣ ${firstMap}`, "\u200b"+optionone.join("\n"))
                                .addField(`2️⃣ ${secondMap}`, "\u200b"+optiontwo.join("\n"))
                                .setFooter("© Ranked Bedwars | Map Picking", rankedlogo)
                            );
            
                        }
                    });
            
                    collector.on('end', async () => {
                        if (m.deleted) return reject();
                        m.reactions.removeAll().catch(err => console.log(err));
                        
                        if(optionone.length > optiontwo.length) pick = firstMap
                        else if(optiontwo.length > optionone.length) pick = secondMap
                        else pick = null;
                        
                        if (pick) {
                            // assign a bot and then tell it which map has been picked
                            await m.edit(
                                new MessageEmbed()
                                .setColor("ORANGE")
                                .setTitle("Map Picking | Reroll")
                                .setDescription(`The map **${pick}** has been chosen, by a margin of ${Math.abs(optionone.length-optiontwo.length)} vote${Math.abs(optionone.length-optiontwo.length) > 1 ? "s" : ""}!`)
                                .setFooter("© Ranked Bedwars | Map Picking", rankedlogo)
                            );
                        } else {
                            pick = [firstMap, secondMap][Math.floor(Math.random() * 2)];
                            // assign a bot and then tell it which map has been picked
                            await m.edit(
                                new MessageEmbed()
                                .setColor("ORANGE")
                                .setTitle("Map Picking | Reroll")
                                .setDescription(`The map **${pick}** has been randomly chosen, due to a draw.`)
                                .setFooter("© Ranked Bedwars | Map Picking", rankedlogo)
                            );
                        }
                        res(pick);
                    });
                }
            });
        });
    }

}

export const activeGames = new Collection<ObjectIdType, LocalGame>();

export async function hasPerms(member: GuildMember, roles: string[]) {
    let hasPerms = false;
    member?.roles.cache.forEach(role => {
        if(roles.includes(role.id)) {
            hasPerms = true;
        }
    });

    if(member.id === Constants.CLIENT_ID) hasPerms = true;

    return hasPerms;
}

export async function createNewGame(){
    const db = await database;

    const { insertedId } = await db.games.insertOne({});

    const gameNumber = 1 + await db.games.find({
        _id: {
            $lt: insertedId
        }
    }).sort({ _id: 1 }).count();

    const game = new LocalGame(gameNumber, insertedId);

    activeGames.set(insertedId, game);

    return { game, gameNumber, insertedId };
}

async function isAssigned(username: string) {
    const bot = bots.get(username);

    if (!bot) return true;

    return new Promise(r => {
        bot.emit('isAssigned', r);
    });
}

export namespace BotManager {

    const logger = new Logger("Mineflayer Bot Manager");

    /** Assigns an available bot to the given game. Rejects if no bots are available. Resolves to the username of the bot that's been assigned to the game. */
    export async function assign(game: ObjectId): Promise<string | null> {
        const db = await database;
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
                        assignedGame: new ObjectId()
                    }
                });

                value = null;
            }

            await delay(1000);
        }

        return value?.username ?? null;
    }

    /** Releases the specified bot from its game, allowing it to be assigned to a new game. */
    export async function release(bot: string){
        console.trace(`Release ${bot}`);

        try {
            await (await database).bots.updateOne({
                username: bot,
            }, {
                $unset: {
                    assignedGame: true,
                }
            });
        } catch {};
    }

    export interface GetAssignedGameOptions {
        /** If true, fetches the status of the bot from the database. */
        update?: boolean;
    }

    /** Gets the game a bot is currently assigned to. */
    export async function getAssignedGame(name: string, options: GetAssignedGameOptions = {}) {
        const data = await (await database).bots.findOne({ username: name });

        return data?.assignedGame ?? null;
    }
}

export function getBanDuration(existingStrikes: number, strikesToAdd: number) {

    devLogger.info(`existingStrikes --> ${existingStrikes}`);
    devLogger.info(`stringsToAdd --> ${strikesToAdd}`);

    if (existingStrikes + strikesToAdd > 10) {
        return '0d';
    }

    const strikes = Math.max(existingStrikes, 0) + strikesToAdd;
    const durations = [ 3, 6, 12, 1, 2, 3, 4, 5, 6, 0 ];
    
    return `${durations[strikes - 2]}${strikes > 4 ? 'd' : 'h'}`;
}

function getRole(p: number) {
    return Constants.ELO_ROLES[Math.floor(Math.abs(p)/100)];
}

export async function gameReport(teams: any, winner: string, number: number, tag: string, nameMap: Map<string, string>, guild: any) {
    const scoring = new MessageEmbed()
        .setAuthor(`Automatic Scoring: Score Request [#${number}]`, 'https://cdn.discordapp.com/attachments/799897234128764958/804020431576105000/Daco_3568543.png');

    for (const team in teams) {
        const name = nameMap.get(team);
        const users = teams[team].players.map((p: any) => {
            const oldRole = getRole(p.oldRating);
            const newRole = getRole(p.newRating);
            const updated = oldRole && newRole && oldRole !== newRole;

            if (updated) {
                guild.members.fetch(p.discord)
                    .then((m: any) => {
                        m.roles.add(newRole).catch(() => {});
                        m.roles.remove(oldRole).catch(() => {});

                        if (!m.roles.cache.has(Constants.SUPPORT_ROLE_ID))
                            m.setNickname(`[${p.newRating}] ${p.username}`).catch(() => {});
                    })
                    .catch(() => {});
            }

            return `**${p.username}** | \`[${p.oldRating} → ${p.newRating}]\`${updated ? ` <@&${oldRole}> → <@&${newRole}>` : ''}`;
        }).join('\n');

        scoring.addField(`${name} Team`, users);
    }

    scoring.addField('Winning Team', `\`•\` ${nameMap.get(winner)}`);

    const channel = guild.channels.cache.get(Constants.GAME_REPORT_CHANNEL) as TextChannel;
    
    try {
        const m = await channel.send(tag, scoring);
    }
    catch(e) {
        console.log('GAME_ERROR', e);
        console.log(`Couldn't send Game Report for game: ${number}`);
    }
}

export async function updateRoles(member_id: string, role1_id: string, role2_id: string) {
    const guild = await defaultGuild;
    const member = guild.members.cache.get(member_id);
    await member?.roles.remove(role1_id).catch(() => null);
    await member?.roles.add(role2_id).catch(() => null);
}

export function delay(delay: number) {
    return new Promise(r => setTimeout(r, delay, true));
}

/** Given an array of CategoryChannels, resolves with any CategoryChannel currently open. */
export function findOpenCategory(categories: CategoryChannel[]){
    return new Promise<CategoryChannel>(res => {
        const cat = categories.find(cat => cat.children.size <= 20);
        if(cat) return res(cat);
        const checker = setInterval(() => {
            const cat = categories.find(cat => cat.children.size <= 20);
            if(cat){
                clearInterval(checker);
                return res(cat);
            }
        }, 5000);
    });
}

export async function checkStatus(username: string) {

    let bool = false;

    await hypixel.getPlayer(username).then((player: { isOnline: boolean; }) => {
        console.log(`isOnline --> ${player.isOnline}`);
        bool = player.isOnline;
    }).catch((e: any) => {
        console.error('ASD', e);
    })

    return bool;
}

export function toEscapedFormat(str: string) {
    return str.replace("_", "\_");
}