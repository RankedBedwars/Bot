import dotenv from "dotenv";
dotenv.config();

import Logger from "./logger";
import createScorecard from './app';

const logger = new Logger("Main");

import { ObjectId } from 'mongodb';
import { CategoryChannel, Collection, CollectorFilter, ColorResolvable, Message, MessageEmbed, MessageReaction, TeamMember, TextChannel, User } from "discord.js";
import https from "https";
import fetch from "node-fetch";
import bot, { defaultGuild } from "./managers/bot";
import database from "./managers/database";
import { getHypixelPlayer } from "./managers/hypixel";
import type { InteractionPayload } from "./typings/commands";
import { Constants } from "./constants";
import { activeGames, BotManager, createNewGame, delay, findOpenCategory, getBanDuration, hasPerms, Player, Players, toEscapedFormat, gameReport, calculateElo } from "./utils";
import { GameState, helpCommand, strikeCheck } from "./typings/games";
import { bots } from "./managers/socket";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

let game_cache: strikeCheck[] = [];
let help_cmd_cache: helpCommand[] = [];

!async function(){

    const [ db, client, guild ] = await Promise.all([database, bot, defaultGuild]).catch(err => {
        logger.error(`Startup failed:\n${err.stack}`);
        return process.exit(1);
    });

    function createEmbed(description?: string, color: ColorResolvable = "#228B22", footerSuffix = `Watching ${guild!.memberCount} Players!`){
        const embed = new MessageEmbed() 
            .setColor(color)
            .setFooter(`© Ranked Bedwars | ${footerSuffix}`, Constants.BRANDING_URL);

        if(description) embed.setDescription(description);
        
        return embed;
    }

    function getRole(p: number) {
        let index = Math.floor(Math.abs(p)/100);
        index = index === 17?16 : (index >= 18 && index < 20) ? 17 : index >= 20? 18 : index;
        return guild?.roles.cache.get(Constants.ELO_ROLES[index]);
    }

    type LeaderboardStat = "kills" | "wins" | "bedsBroken" | "elo" | "losses" | "games" | "winstreak";

    // Custom slash commands until discord.js officially supports it
    client.on("raw", async (payload: InteractionPayload) => {
        if(payload.t !== "INTERACTION_CREATE") return;

        const logger = new Logger("Command Handler");

        const { token, data, id, member, channel_id } = payload.d;

        const { user } = member;

        const { name: cmd } = data;

        const req = https.request(`${Constants.DISCORD_API_BASE_URL}/interactions/${id}/${token}/callback`, {
            method: "POST",
            headers: {
                authorization: `Bot ${process.env.TOKEN}`,
                "Content-Type": "application/json",
            }
        });

        function respond(message: string | MessageEmbed){
            return new Promise(res => {
                req.write(JSON.stringify({
                    type: 4,
                    data: typeof message === "string" ? {
                        content: message
                    } : {
                        content: "",
                        embeds: [message.toJSON()]
                    }
                }));
                req.end();
                req.on("error", () => null);
                req.on("finish", res);
            });
        }

        switch (cmd) {
            case "register": {

                if(Constants.REGISTER_CHANNEL !== channel_id) {
                    respond(createEmbed(`<@${user.id}> you cannot register in this channel. Please do /register [IGN] in ${guild.channels.cache.get(Constants.REGISTER_CHANNEL)}`, "RED"));
                    break;
                }
 
                const player = payload.d.data.options[0].value;
                try {
                    const mojang = await (await fetch(`https://api.mojang.com/users/profiles/minecraft/${player}`)).text();
                    if(!mojang){
                        respond(createEmbed("Minecraft account not found.", "RED"));
                        break;
                    }
                    const d = JSON.parse(mojang);
                    if(!d.id){
                        respond(createEmbed("Minecraft account not found.", "RED"));
                        break;
                    }
                    const hypixelData = await getHypixelPlayer(d.id);
                    const discord = hypixelData?.player?.socialMedia?.links?.DISCORD;
                    if(!discord){
                        respond(createEmbed(`**${d.name}** does not have a Discord account linked. For more information, read ${guild.channels.cache.get('800070737091624970')}`, "RED"));
                        break;
                    }
                    if(discord !== `${user.username}#${user.discriminator}`){
                        respond(createEmbed(`**${d.name}** has another Discord account or server linked. If this is you, change your linked Discord to **${user.username}#${user.discriminator}**.\n\n**Changed your Discord username?** You'll need to change your linked account in game.`, "RED"));
                        break;
                    }
                    const { value } = await db.players.findOneAndUpdate({ discord: user.id }, {
                        $set: {
                            minecraft: {
                                uuid: d.id,
                                name: d.name,
                            },
                            registeredAt: Date.now(),
                        },
                        $setOnInsert: {
                            discord: user.id,
                            elo: 400,
                        },
                    }, {
                        upsert: true,
                    });
                    if(!value){
                        const mem = guild.members.cache.get(user.id); 
                        if(mem && !mem.roles.cache.has(Constants.SUPPORT_ROLE_ID)) await mem.setNickname(`[400] ${d.name}`).catch(e => logger.error(`Failed to update a new member's nickname:\n${e.stack}`));
                        respond(createEmbed(`You have successfully registered with the username **${toEscapedFormat(d.name)}**. Welcome to Ranked Bedwars!`, "#228B22"));
                        const member = guild.members.cache.get(user.id);
                        
                        member?.roles.cache.forEach(async role => {
                            if(Constants.ELO_ROLES.includes(role.id)) {
                                await member.roles.remove(role).catch(() => null);
                            }
                        })
                        
                        await member!.roles.add(Constants.ELO_ROLES[4]).catch(() => null);
                        await member!.roles.add(Constants.REGISTERED_ROLE).catch(() => null);
                        
                        break;
                    }
                    const member = guild.members.cache.get(user.id);
                    if(!member) return;
                    if(!member.roles.cache.has(Constants.SUPPORT_ROLE_ID)) await member?.setNickname(`[${value.elo ?? 400}] ${d.name}`).catch(e => logger.error(`Failed to update an existing member's nickname on re-registration:\n${e.stack}`));
                    respond(createEmbed(`You have successfully changed your linked Minecraft account to **${toEscapedFormat(d.name)}**.`, "#228B22"))
                    
                    const member_roles = member.roles.cache.array();
                    for(let i = 0; i < member_roles.length; i++) {
                        const role = member_roles[i];
                        if(Constants.ELO_ROLES.includes(role.id)) {
                            await member.roles.remove(role).catch(() => null);
                        }
                    }

                    if(!member.roles.cache.has(Constants.RANKBANNED)) await member!.roles.add(getRole(value.elo ?? 400)!).catch(() => null);
                    await member!.roles.remove(Constants.UNREGISTERED_ROLE).catch(() => null);
                    await member!.roles.add(Constants.REGISTERED_ROLE).catch(() => null);

                } catch(e){
                    logger.error(`An error occurred while using the /register command:\nDeclared username: ${player}\n${e.stack}`);
                    respond(createEmbed('Something went wrong while registering your account. Please try again later. If the issue persists, please contact a staff member.', "RED"));
                }   
                    
                break;
            }

            case "info": {
                const lookup: string = payload.d.data.options[0].value;
                try {
                    const player = await Players.getByDiscord(lookup);
                    if(!player){
                        respond(createEmbed(`<@${lookup}> is not a registered Ranked Bedwars player.`, "RED"));
                        break;
                    }
                    //const WLR = player.losses === 0 ? player.wins : Math.round((player.wins/player.losses + Number.EPSILON) * 100) / 100;
                    
                    const card = await createScorecard(player.minecraft.uuid, player.minecraft.name, 'discord.gg/rbw', '#363942', player);

                    respond(new MessageEmbed().attachFiles([{ attachment: card, name: 'profile.png' }]));
                } catch(e){
                    logger.error(`An error occurred while using the /info command:\nUser: ${lookup}\n${e.stack}`);
                    respond(createEmbed("Something went wrong while requesting a player's stats. Please try again later. If the issue persists, please contact a staff member.", "RED"));
                }
                break;
            }

            case "leaderboard": {

                if(Constants.CHAT === channel_id) {
                    respond(createEmbed(`<@${user.id}> commands are disabled in this channel.`, "RED"));
                    break;
                }

                try {
                    let { name, options } = payload.d.data.options[0];
                    if(name === "bedsbroken") name = "bedsBroken";
                    let page = options ? options[0].value as number : 1;
                    const nPerPage = 10;

                    const division = ['wl', 'kd', 'bblr'].includes(name);
                    const values = name === 'wl' ? ['$wins', '$losses']
                        : name === 'kd' ? ['$kills', '$deaths']
                            : ['$bedsbroken', '$losses'];
                    const search = division ? {
                        [name === 'wl' ? 'wins' : name === 'kd' ? 'kills' : 'bedsbroken']: {
                            $exists: true
                        }
                    } : {
                        [name]: {
                            $exists: true
                        }
                    };

                    const total = await db.players.find(search).count();

                    if(total < 1){
                        respond(createEmbed("There's no players on this leaderboard yet. Play now, and claim a top spot!", "RED"));
                        break;
                    }

                    let prettyName = name;
                    switch (name) {
                        case "kills":
                            prettyName = "Top Kills";
                            break;
                        case "elo":
                            prettyName = "Top ELO";
                            break;
                        case "wins":
                            prettyName = "Top Wins";
                            break;
                        case "losses":
                            prettyName = "Top Losses";
                            break;
                        case "bedsBroken":
                            prettyName = "Most Beds Broken";
                            break;
                        case "games":
                            prettyName = "Most Games Played";
                            break;
                        case "wl":
                            prettyName = "Highest W/L";
                            break;
                        case "kd":
                            prettyName = "Highest K/D";
                            break;
                        case "bblr":
                            prettyName = "Highest BBLR";
                            break;
                        case "losestreak":
                            prettyName = "Highest Losestreak";
                            break;
                        case "deaths":
                            prettyName = "Most Deaths";
                            break;
                        case "bedslost":
                            prettyName = "Most Beds Lost";
                            break;
                    }

                    const pages = Math.ceil(total / nPerPage);
                    if(page > pages) page = pages;

                    const players = division ?
                        await db.players
                            .aggregate([{
                                $project: {
                                    computed: {
                                        $cond: [ { $eq: [ values[1], 0 ] }, values[0], { $divide: values } ]
                                    },
                                    elo: true,
                                    minecraft: true
                                }
                            }, {
                                $sort: { computed: -1 }
                            }])
                            .skip(page > 0 ? ((page - 1) * nPerPage) : 0)
                            .limit(nPerPage)
                            .toArray() :
                        await db.players
                            .find(search)
                            .sort({ [name]: -1 })
                            .skip(page > 0 ? ((page - 1) * nPerPage) : 0)
                            .limit(nPerPage)
                            .toArray();
                    
                    respond(createEmbed(players.map((player: any, i) => `\n\`#${i + 1 + (nPerPage * (page - 1))}\` ${Constants.ELO_EMOJIS[Constants.ELO_ROLES.indexOf(getRole(player.elo ?? 400)?.id!)]} **${toEscapedFormat(player.minecraft.name)}** : ${division ? player.computed : (player[name as LeaderboardStat] ?? 0)}`).join(""), "#228B22")
                        .setTitle(`${prettyName} | Page ${page}/${pages}`)
                    );
                } catch(e){
                    logger.error(`An error occurred while using the /leaderboard command:\n${e.stack}`);
                    respond(createEmbed("Something went wrong while requesting the leaderboard. Please try again later. If the issue persists, please contact a staff member.", "RED"));
                }
            }
        }
    });

    client.on('ready', async () => {
        
    });

    client.on("voiceStateUpdate", async (oldState, newState) => {
        await strikeEmbed();

        if(oldState.channelID === newState.channelID) return;
        if(!newState.channelID || !newState.channel) return;
        const gameMembers = [...newState.channel!.members.array()];
        const ids = gameMembers.map(mem => mem.id);
        if(!Constants.QUEUES_ARRAY.flat().includes(newState.channelID)) return;

        if(gameMembers.length !== newState.channel.userLimit) return;

        try {
            const queueChannel = newState.channel;
            const { game } = await createNewGame();

            const { textChannel } = await game.createChannels(gameMembers, queueChannel);

            const strike: strikeCheck = {
                members: ids,
                timeOfLastPick: Date.now(),
                textChannelID: textChannel.id,
                voiceChannelID: newState.channelID,
                pickingOver: false,
            }
    
            game_cache.push(strike);

            const { gameNumber, logger, id: insertedId } = game;
            
            const index = Constants.QUEUES_ARRAY.findIndex(q => q.includes(queueChannel.id));

            const textCategory = await findOpenCategory(Constants.CATEGORY_ARRAY[index].map(cat => guild.channels.cache.get(cat)! as CategoryChannel));
            const teamCallCategory = await findOpenCategory(Constants.TEAM_CALLS.map(cat => guild.channels.cache.get(cat)! as CategoryChannel));
        
            if(!(textCategory && teamCallCategory)) {
                return logger.warn('No category assigned.');
            }

            await Promise.all([
                textChannel.overwritePermissions(gameMembers.map<any>(member => ({
                    id: member.id,
                    allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"],
                })).concat({
                    id: (await defaultGuild).id,
                    deny: ["VIEW_CHANNEL"]
                }).concat({
                    id: '801187544267489330',
                    allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"]
                }).concat({
                    id: '688981950295572643',
                    allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"]
                })),
            ]).catch(() => null);

            const [message, players] = await Promise.all<any>([
                textChannel.send(gameMembers.join("")),
                Players.getManyByDiscord(gameMembers.map(({ id }) => id)),
                db.games.updateOne({
                    _id: insertedId
                }, {
                    $set: {
                        textChannel: textChannel.id,
                        voiceChannel: queueChannel.id,
                    }
                }),
            ]) as [Message, Collection<string, Player>];

            const unregistered = gameMembers.filter(mem => !players.map(p => p.discord).includes(mem.id))
            let unreg = unregistered.length > 0? unregistered.join(' '):'';

            if(8 !== players.size){
                let msg = `${unreg} **unregistered player(s)** are in your queue. Please make sure to register in ${guild.channels.cache.get(Constants.REGISTER_CHANNEL)} before queuing.\n\n**NOTE:** Please ensure that no unregistered/ingame player exists in the queue and that queues are currently open.`;
                if(gameMembers.length < 8) {
                    msg = `The **queues are not open** right now. Please be patient. Thank you! `;
                }
                message.channel.send(msg);
                return setTimeout(await game.cancel(), 10000);
            }

            const asArray = [...players.values()];

            const [ cap1 ] = asArray.splice(Math.floor(Math.random() * asArray.length), 1);
            const [ cap2 ] = asArray.splice(Math.floor(Math.random() * asArray.length), 1);

            const team1: Player[] = [cap1];
            const team2: Player[] = [cap2];

            let firstPick = true;

            // Picking starts here
            while(asArray.length !== 0) {

                if(game.state === GameState.VOID) break;

                if(asArray.length === 1) {
                    team2.push(asArray.shift()!);
                    textChannel.send(createEmbed(undefined, "#00FFFF", `Team Picking for Game #${gameNumber}`)
                        .addFields(
                            { name: 'Team 1', value: `\`•\`Captain: <@${cap1.discord}>\n${team1.slice(1).map(({ discord }) => `\`•\` <@${discord}>`).join("\n")}` },
                            { name: 'Team 2', value: `\`•\`Captain: <@${cap2.discord}>\n${team2.slice(1).map(({ discord }) => `\`•\` <@${discord}>`).join("\n")}` },
                        )
                    );
                    continue;
                }
 
                textChannel.send(createEmbed(undefined, "#00FFFF", `Team Picking for Game #${gameNumber}`)
                    .addFields(
                        { name: 'Team 1', value: `\`•\`Captain: <@${cap1.discord}>\n${team1.slice(1).map(({ discord }) => `\`•\` <@${discord}>`).join("\n")}` },
                        { name: 'Team 2', value: `\`•\`Captain: <@${cap2.discord}>\n${team2.slice(1).map(({ discord }) => `\`•\` <@${discord}>`).join("\n")}` },
                        { name: 'Remaining Players', value: asArray.map(({ discord }) => `\`•\` <@${discord}>`).join("\n") }
                    )
                );
                textChannel.send(`<@${firstPick? cap1.discord:cap2.discord}>`).then(secondPing => secondPing.delete({ timeout: 50 }).catch(() => logger.info("Failed to ping second captain."))).catch(e => logger.error(`Failed to ping captain:\n${e}`));
                textChannel.send(createEmbed(`<@${firstPick? cap1.discord:cap2.discord}> it is your turn to pick. Use \`=p @user\` to pick one of the remaining players!`, 	"AQUA", `Team Picking for Game #${gameNumber}`));
                
                const msg: any = (await textChannel.awaitMessages((message: Message) => {
                    const { author, content } = message;
                    if(game.state === GameState.VOID) {
                        asArray.splice(0, asArray.length);
                        return false;
                    }
                    if(!(content.toLowerCase().startsWith('=pick ') || content.toLowerCase().startsWith('=p ') || content.toLowerCase().startsWith('=P '))) {
                        return false;
                    }
                    if(![cap1.discord, cap2.discord].includes(author.id)){
                        textChannel.send(createEmbed(`${author} you are not a team captain.`, "RED", `Team Picking for Game #${gameNumber}`));
                        return false;
                    }
                    if((firstPick ? cap2 : cap1).discord === author.id){
                        textChannel.send(createEmbed(`${author}, it's the other captain's turn to pick right now.`, "RED", `Team Picking for Game #${gameNumber}`));
                        return false;
                    }
                    if(!message.mentions.users.first()) {
                        message.channel.send(createEmbed(`${author}, you have to mention someone to pick them.`, "RED", `Team Picking for Game #${gameNumber}`));
                        return false;
                    }
                    if(!asArray.map(({ discord }) => discord).includes(message.mentions.users.first()!.id)) {
                        message.channel.send(createEmbed(`${author}, you cannot pick a user who is already on a team or isn't in the game.`, "RED", `Team Picking for Game #${gameNumber}`));
                        return false;
                    }
                    return true;
                }, { max: 1 })).first();

                if(!msg) continue;

                const g: any = game_cache.find(g => g.textChannelID === textChannel.id);
                if(g) g.timeOfLastPick = Date.now();

                const user = msg.mentions.users.first()!;

                const chosen = players.get(user.id)!;

                asArray.splice(asArray.indexOf(chosen), 1);

                (firstPick ? team1 : team2).push(chosen);
                firstPick = !firstPick;
            }

            if(team1.length !== 4 || team2.length !== 4) {
                return;
            }

            const g = game_cache.find(g => g.textChannelID === textChannel.id);
            if(g) g.pickingOver = true;

            const [ tc1, tc2 ] = await Promise.all([
                guild.channels.create(`Team #1 - Game #${gameNumber}`, {
                    type: "voice",
                    permissionOverwrites: team1.map(player => ({
                        id: player.discord,
                        allow: ["CONNECT", "SPEAK"],
                    })),
                    userLimit: team1.length,
                }),
                guild.channels.create(`Team #2 - Game #${gameNumber}`, {
                    type: "voice",
                    permissionOverwrites: team2.map(player => ({
                        id: player.discord,
                        allow: ["CONNECT", "SPEAK"],
                    })),
                    userLimit: team2.length,
                })
            ]);

            game.setTeamChannels(tc1, tc2);

            await game.enterStartingState();

            await Promise.all([
                tc1.setParent(teamCallCategory),
                tc2.setParent(teamCallCategory),
            ]);

            await db.activeGame.updateOne({ "_id": game.id }, { $set: { team1Channel: tc1.id, team2Channel: tc2.id } }, { upsert: true });

            for await (const member of team1.map(p1 => guild.members.cache.get(p1.discord))) {
                await member?.voice.setChannel(tc1.id).catch(() => logger.info('failed to send players to teams'));
                await delay(200);
            }

            for await (const member of team2.map(p2 => guild.members.cache.get(p2.discord))) {
                await member?.voice.setChannel(tc2.id).catch(() => logger.info('failed to send players to teams'));
                await delay(200);
            }

            const map = await game.pickMap();
            if(!map) throw new Error("pickMap returned nothing");

            if(game.state === GameState.VOID){
                tc1.delete().catch(() => logger.info('Failed to delete tc1'));
                return tc2.delete().catch(() => logger.info('Failed to delete tc1'));
            }

            const start = Date.now();
            const loading = await textChannel.send(createEmbed('Looking for an available bot...'));
            const { reason, username: bot } = await game.getAssignedBot();

            if (reason === 'GAME_VOID') {
                await loading.edit(createEmbed('This game is not active. Please re-queue to start a new game.', "RED"));

                tc1.delete().catch(() => logger.info("Failed to delete tc1"));
                tc2.delete().catch(() => logger.info("Failed to delete tc2"));

                await delay(5000);

                return textChannel.send('=fclose');
            }

            if (reason === 'NONE_AVAILABLE' || !bot) {
                await loading.edit(createEmbed('The maximum waiting time has been exceeded. No bots are available right now. Please try again later.', "RED"));

                await delay(5000);

                return textChannel.send('=fclose');
            }

            const _bot = bots.get(bot);

            if (!_bot) {
                await loading.edit(createEmbed(`Failed to bind to **${bot}** after **${dayjs(start).from(dayjs(), true)}**.`, 'RED'));

                return game.cancel();
            }

            await loading.edit(createEmbed(`The bot **${bot}** has been assigned to your game after **${dayjs(start).from(dayjs(), true)}**.`));

            logger.info(JSON.stringify(bots) + `, size → ${bots.size}`);
            logger.info(`Sending data: ${JSON.stringify([...team1.map(player => player.toJSON()), ...team2.map(player => player.toJSON())])}`);

            _bot.once('gameCancel', () => {
                try {
                    setTimeout(game.cancel, 10000);
                } catch(e) {
                    logger.error(`Bot failed to cancel game:\n${e.stack}`);
                }
            });

            _bot.emit('gameStart', {
                players: [...team1.map(player => player.toJSON()), ...team2.map(player => player.toJSON())],
                map, number: gameNumber
            });

            game.start(team1, team2);
        } catch(e){
            logger.error(`Failed to start a new game:\n${e.stack}`);
        }
    });

    client.on("message", async function(message: any){

        if(!message.guild) {
            return;
        }

        if (message.content === '=help') {

            if(Constants.CHAT === message.channel.id) {
                return message.reply(createEmbed(`${message.author} commands are disabled in this channel.`, "RED"));
            }

            const reactions = ['🛠️', '⚔️', '📋', '⚙️', '🪧', '❌'];
            const embed = new MessageEmbed().setTitle('Ranked Bedwars Elo Bot Commands').setDescription(`\n**Main Menu:**\n\n${reactions[0]} \`Management\`\n\n${reactions[1]} \`Gameplay\`\n\n${reactions[2]} \`Scoring\`\n\n${reactions[3]} \`Moderation\`\n\n${reactions[4]} \`Leaderboards\``).setFooter('© Ranked Bedwars | Main Menu', 'https://i.imgur.com/Nk0fcf8.jpg');
            const replied_embed = await message.channel.send(embed);
            
            for (let i = 0; i < reactions.length; i++) {
                await replied_embed.react(reactions[i]);
            }

            const helpCommandObj: helpCommand = {
                message: replied_embed,
                user: message.author,
                timeOfCreation: Date.now(),
            }

            help_cmd_cache.push(helpCommandObj);

            const filtered = [...reactions, '◀️', '▶️'];

            const collector = replied_embed.createReactionCollector((r: any, u: any) => u.id === message.author.id && filtered.includes(r.emoji.name), {
                idle: 60000
            });

            let page = 0, paged = false;

            const embeds: any = [
                new MessageEmbed().setTitle('Management').setDescription(`\n- \`Bot Restart\`\n\`•\` **Usage**: =restart \`@IGN\`\n\`•\` **Description**: *Gets a bot back online.*\n- \`Force Close\`\n\`•\` **Usage**: =forceclose\n\`•\` **Aliases**: =fclose\n\`•\` **Description**: *Force closes a queue.*\n- \`Info Card Background Modifier\`\n\`•\` **Usage**: =setbackground \`@User/User_ID <PNG>\`\n\`•\` **Description**: *Modifies a user's info card background.*\n- \`Info Card Text Modifier\`\n\`•\` **Usage**: =settext \`@User/User_ID <text>\`\n\`•\` **Description**: *Modifies a user's info card text.*`).setFooter('© Ranked Bedwars | Management Commands | Page 1', 'https://i.imgur.com/Nk0fcf8.jpg'),
                new MessageEmbed().setTitle('Gameplay').setDescription(`\n- \`Stats\`\n\`•\` **Usage**: /info \`@User\`\n\`•\` **Aliases**: =info, =i\n\`•\` **Description**: *Shows a user stats.*\n- \`Pick\`\n\`•\` **Usage**: =pick \`@User\`\n\`•\` **Aliases**: =p\n\`•\` **Description**: *Allows captains to pick a remaining player in the queue.*\n- \`Strikes\`\n\`•\` **Usage**: =strikes \`@User/User_ID\`\n\`•\` **Aliases**: =getuser\n\`•\` **Description**: *Displays total strikes and ban duration.*\n- \`Queue Stats\`\n\`•\` **Usage**: =qs\n\`•\` **Aliases**: =queuestats\n\`•\` **Description**: *Displays stats of everyone in the current queue.*`).setFooter('© Ranked Bedwars | Gameplay Commands | Page 1', 'https://i.imgur.com/Nk0fcf8.jpg'),
                new MessageEmbed().setTitle('Scoring').setDescription(`\n- \`Win\`\n\`•\` **Usage**: =win \`@User/User_ID\`\n\`•\` **Aliases**: =w\n\`•\` **Description**: *Manually scores a single win, modifies elo by +25.*\n- \`Loss\`\n\`•\` **Usage**: =loss \`@User/User_ID\`\n\`•\` **Aliases**: =l\n\`•\` **Description**: *Manually scores a single loss, modifies elo by -25.*\n- \`Strike\`\n\`•\` **Usage**: =strike \`@User/User_ID ±[number]\`\n\`•\` **Description**: *Modifies a user's strikes.*\n- \`Modify\`\n\`•\` **Usage**: =modify \`wins|losses|kills|deaths|bedsbroken|bedslost|\n|winstreak|bedstreak @User/User_ID ±[number]\`\n\`•\` **Description**: *Modifies a user's stats.*`).setFooter('© Ranked Bedwars | Scoring Commands | Page 1', 'https://i.imgur.com/Nk0fcf8.jpg'),
                new MessageEmbed().setTitle('Moderation').setDescription(`\n- \`Freeze\`\n\`•\` **Usage**: .ss \`@User/User_ID [Reason]\`\n\`•\` **Description**: *Sends a screenshare request to our team.*\n- \`Ban\`\n\`•\` **Usage**: =ban \`@User/User_ID x(h)/(d) [Reason]\`\n\`•\` **Description**: *Temporarily bans a user.*\n- \`Unban\`\n\`•\` **Usage**: =unban \`@User/User_ID\`\n\`•\` **Description**: *Unbans a user.*`).setFooter('© Ranked Bedwars | Moderation Commands | Page 1', 'https://i.imgur.com/Nk0fcf8.jpg'),
                [
                    new MessageEmbed().setTitle('Leaderboards')
                        .setDescription(`- \`Leaderboard Elo\`\n\`•\` **Usage**: /leaderboard elo <page>\n\`•\` **Aliases**: =leaderboard elo, =lb elo \n\`•\` **Description**: *View the players with the current highest ELO.*\n- \`Leaderboard Games\`\n\`•\` **Usage**: /leaderboard games <page>\n\`•\` **Aliases**: =leaderboard games, =lb games\n\`•\` **Description**: *View the players with the most games.*\n- \`Leaderboard Wins\`\n\`•\` **Usage**: /leaderboard wins <page>\n\`•\` **Aliases**: =leaderboard wins, =lb wins\n\`•\` **Description**: *View the players with the most wins.*\n- \`Leaderboard Losses\`\n\`•\` **Usage**: /leaderboard losses <page>\n\`•\` **Aliases**: =leaderboard losses, =lb losses\n\`•\` **Description**: *View the players with the most losses.*\n- \`Leaderboard W/L\`\n\`•\` **Usage**: /leaderboard w/l <page>\n\`•\` **Aliases**: =leaderboard w/l, =lb w/l\n\`•\` **Description**: *View the players with the current highest W/L.*`)
                        .setFooter('© Ranked Bedwars | Leaderboard Commands | Page 1', 'https://i.imgur.com/Nk0fcf8.jpg'),
                    new MessageEmbed().setTitle('Leaderboards')
                        .setDescription(`- \`Leaderboard Kills\`\n\`•\` **Usage**: /leaderboard kills <page>\n\`•\` **Aliases**: =leaderboard kills, =lb kills\n\`•\` **Description**: View the players with the most kills.\n- \`Leaderboard Deaths\`\n\`•\` **Usage**: /leaderboard deaths <page>\n\`•\` **Aliases**: =leaderboard deaths, =lb deaths\n\`•\` **Description**: View the players with the most deaths.\n- \`Leaderboard K/D\`\n\`•\` **Usage**: /leaderboard k/d <page>\n\`•\` **Aliases**: =leaderboard k/d, =lb k/d\n\`•\` **Description**: View the players with the current highest K/D.\n- \`Leaderboard Winstreak\`\n\`•\` **Usage**: /leaderboard winstreak <page>\n\`•\` **Aliases**: =leaderboard winstreak, =lb winstreak\n\`•\` **Description**: View the players with the current highest winstreak.\n- \`Leaderboard Losestreak\`\n\`•\` **Usage**: /leaderboard losestreak <page>\n\`•\` **Aliases**: =leaderboard losestreak, =lb losestreak\n\`•\` **Description**: View the players with the current highest losestreak.`)
                        .setFooter('© Ranked Bedwars | Leaderboard Commands | Page 2', 'https://i.imgur.com/Nk0fcf8.jpg'),
                    new MessageEmbed().setTitle('Leaderboards')
                        .setDescription(`- \`Leaderboard BedsBroken\`\n\`•\` **Usage**: /leaderboard bedsbroken <page>\n\`•\` **Aliases**: =leaderboard bedsbroken, =lb bedbroken, =lb bb\n\`•\` **Description**: View the players with the most beds broken.\n- \`Leaderboard BedsLost\`\n\`•\` **Usage**: /leaderboard bedslost <page>\n\`•\` **Aliases**: =leaderboard bedslost, =lb bedslost, =lb bl\n\`•\` **Description**: View the players with the most beds lost.\n- \`Leaderboard BBLR\`\n\`•\` **Usage**: /leaderboard bblr <page>\n\`•\` **Aliases**: =leaderboard bblr, =lb bblr\n\`•\` **Description**: View the players with the current highest BBLR.`)
                        .setFooter('© Ranked Bedwars | Leaderboard Commands | Page 3', 'https://i.imgur.com/Nk0fcf8.jpg'),
                ],
                new MessageEmbed().setTitle('Ranked Bedwars Elo Bot Commands').setDescription(`\n**Main Menu:**\n\n${reactions[0]} \`Management\`\n\n${reactions[1]} \`Gameplay\`\n\n${reactions[2]} \`Scoring\`\n\n${reactions[3]} \`Moderation\`\n\n${reactions[4]} \`Leaderboards\``).setFooter('© Ranked Bedwars | Main Menu', 'https://i.imgur.com/Nk0fcf8.jpg')
            ];

            collector.on('collect', async (reaction: any, user: any) => {
                const embed = embeds[reactions.indexOf(reaction.emoji.name)];

                if (Array.isArray(embed)) {
                    paged = true;

                    await replied_embed.reactions.removeAll();

                    for (const emoji of ['▶️', '❌']) {
                        await replied_embed.react(emoji);
                    }
                } else if (embed) {
                    if (paged === true) {
                        paged = false, page = 0;

                        await replied_embed.reactions.removeAll();

                        for (const emoji of reactions) {
                            await replied_embed.react(emoji);
                        }
                    } else
                        reaction.users.remove(user);
                }

                const index = ['◀️', '▶️'].indexOf(reaction.emoji.name) * 2 - 1;

                if (index >= -1 && paged) {

                    const next = Math.min(Math.max(0, page + index), 2);
                    
                    if (next === embeds[4].length - 1)
                        replied_embed.reactions.cache.get('▶️').remove();
                    else if (next === 0)
                        replied_embed.reactions.cache.get('◀️').remove();
                    else if (page === 0 || page === embeds[4].length - 1) {
                        await replied_embed.reactions.removeAll();

                        for (const emoji of ['◀️', '▶️', '❌']) {
                            await replied_embed.react(emoji);
                        }
                    } else {
                        reaction.users.remove(user);
                    }

                    page = next;
                    return replied_embed.edit(embeds[4][page]);
                }

                replied_embed.edit(Array.isArray(embed) ? embed[0] : embed);
            });
        }

        if (message.content.toLowerCase().startsWith('=lb') || message.content.toLowerCase().startsWith('=leaderboard')) {
            const formatName: { [key: string]: string } = {
                kills: 'Top Kills',
                elo: 'Top Elo',
                wins: 'Top Wins',
                losses: 'Top Losses',
                bedsBroken: 'Most Beds Broken',
                games: 'Most Games Played',
                wl: 'Highest W/L',
                kd: 'Highest K/D',
                bblr: 'Highest BBLR',
                losestreak: 'Highest Losestreak',
                deaths: 'Most Deaths',
                bedsLost: 'Most Beds Lost'
            };

            let [, name, page = 1 ] = message.content.split(' ');
            const prettyName: string | undefined = formatName[name];

            if (!name) {
                return message.reply(createEmbed(`${message.author}, you did not provide a valid type:\n\n**TYPES**: ${Object.keys(formatName).join(', ')}`, "RED"));
            }

            try {
                const nPerPage = 10;

                const division = ['wl', 'kd', 'bblr'].includes(name);
                const values = name === 'wl' ? ['$wins', '$losses']
                    : name === 'kd' ? ['$kills', '$deaths']
                        : ['$bedsBroken', '$losses'];
                const search = division ? {
                    [name === 'wl' ? 'wins' : name === 'kd' ? 'kills' : 'bedsBroken']: {
                        $exists: true
                    }
                } : {
                    [name]: {
                        $exists: true
                    }
                };

                const total = await db.players.find(search).count();

                if(total < 1){
                    return message.channel.send(createEmbed("There's no players on this leaderboard yet. Play now, and claim a top spot!", "RED"));
                }

                const pages = Math.ceil(total / nPerPage);
                if(page > pages) page = pages;

                const players = division ?
                    await db.players
                        .aggregate([{
                            $project: {
                                computed: {
                                    $cond: [ { $eq: [ values[1], 0 ] }, values[0], { $divide: values } ]
                                },
                                elo: true,
                                minecraft: true
                            }
                        }, {
                            $sort: { computed: -1 }
                        }])
                        .skip(page > 0 ? ((page - 1) * nPerPage) : 0)
                        .limit(nPerPage)
                        .toArray() :
                    await db.players
                        .find(search)
                        .sort({ [name]: -1 })
                        .skip(page > 0 ? ((page - 1) * nPerPage) : 0)
                        .limit(nPerPage)
                        .toArray();
                
                message.channel.send(createEmbed(players.map((player: any, i) => `\n\`#${i + 1 + (nPerPage * (page - 1))}\` ${Constants.ELO_EMOJIS[Constants.ELO_ROLES.indexOf(getRole(player.elo ?? 400)?.id!)]} **${toEscapedFormat(player.minecraft.name)}** : ${division ? player.computed?.toFixed?.(1) ?? 0 : (player[name as LeaderboardStat] ?? 0)}`).join(""), "#228B22")
                    .setTitle(`${prettyName} | Page ${page}/${pages}`)
                );
            } catch(e){
                logger.error(`An error occurred while using the =leaderboard command:\n${e.stack}`);
                message.channel.send(createEmbed("Something went wrong while requesting the leaderboard. Please try again later. If the issue persists, please contact a staff member.", "RED"));
            }
        }

        if (message.content.toLowerCase().startsWith('=streakmessage')) {
            const hasPerms = Constants.STRIKE_UNSTRIKE.ROLES.some(r => message.member?.roles.cache.has(r));
            if (!hasPerms) return message.channel.send(createEmbed(`${message.author} you do not have the required permissions to run this command.`, "RED", "RBW Streak Messages!"));
        
            const user = message.mentions.users.first();
            if (!user) return message.reply(createEmbed("Invalid User mentioned. Use =streakmessage @User <streak> <message>", "RED"));

            let [ streak, ...content ] = message.content.split(' ').slice(2);

            streak *= 1;

            if (isNaN(streak) || content.length === 0)
                return message.reply(createEmbed(`Invalid usage. \`=streakmessage @user <streak> <message>\``, "RED"));

            if (streak !== 5 && streak !== 8 && streak !== 12)
                return message.reply(createEmbed(`Invalid usage. The streak must be either **5**, **8**, or **12**.`, "RED"));

            const player = await Players.getByDiscord(user.id);
            if(!player)
                return message.reply(createEmbed(`<@${user}> is not a registered Ranked Bedwars player.`, "RED"));

            await player.update({ [`messages.${streak}`]: content.join(' ').slice(0, 250) });

            return message.reply(`${user.tag}'s streak message at ${streak} kills has been changed.`);
        }

        if (message.content.toLowerCase().startsWith('=winmessage')) {
            const hasPerms = Constants.STRIKE_UNSTRIKE.ROLES.some(r => message.member?.roles.cache.has(r));
            if (!hasPerms) return message.channel.send(createEmbed(`${message.author} you do not have the required permissions to run this command.`, "RED", "RBW Streak Messages!"));
        
            const user = message.mentions.users.first();
            if (!user) return message.reply(createEmbed("Invalid User mentioned. Use =winmessage @User <message>", "RED"));

            const content = message.content.split(' ').slice(2).join(' ');

            if (!content)
                return message.reply(createEmbed(`Invalid usage. \`=winmessage @user <message>\``, "RED"));

            const player = await Players.getByDiscord(user.id);
            if(!player)
                return message.reply(createEmbed(`<@${user}> is not a registered Ranked Bedwars player.`, "RED"));

            await player.update({ winMessage: content.slice(0, 250) });

            return message.reply(`${user.tag}'s win message has been changed.`);
        }

        if (message.content.toLowerCase().startsWith('=losemessage')) {
            const hasPerms = Constants.STRIKE_UNSTRIKE.ROLES.some(r => message.member?.roles.cache.has(r));
            if (!hasPerms) return message.channel.send(createEmbed(`${message.author} you do not have the required permissions to run this command.`, "RED", "RBW Streak Messages!"));
        
            const user = message.mentions.users.first();
            if (!user) return message.reply(createEmbed("Invalid User mentioned. Use =losemessage @User <message>", "RED"));

            const content = message.content.split(' ').slice(2).join(' ');

            if (!content)
                return message.reply(createEmbed(`Invalid usage. \`=losemessage @user <message>\``, "RED"));

            const player = await Players.getByDiscord(user.id);
            if(!player)
                return message.reply(createEmbed(`<@${user}> is not a registered Ranked Bedwars player.`, "RED"));

            await player.update({ loseMessage: content.slice(0, 250) });

            return message.reply(`${user.tag}'s lose message has been changed.`);
        }

        if(message.content.toLowerCase().startsWith('=i' || message.content.toLowerCase().startsWith('=info'))) {

            if(Constants.CHAT === message.channel.id) {
                return message.reply(createEmbed(`<@${message.author.id}> commands are disabled in this channel.`, "RED"));
            }

            const msg_arr = message.content.split(' ');
            
            let user = message.mentions.users.first() || message.author;
            if(!user) {
                user = client.users.cache.get(msg_arr[1]);
                if(!user) {
                    return message.reply(createEmbed("Invalid User mentioned. Use =info @User/User_ID", "RED"));
                }
            }

            const lookup: string = user.id;
            try {
                const player = await Players.getByDiscord(lookup);
                if(!player){
                    return message.reply(createEmbed(`<@${lookup}> is not a registered Ranked Bedwars player.`, "RED"));
                }

                const card = await createScorecard(player.minecraft.uuid, player.minecraft.name, player.info_card_text || 'discord.gg/rbw', player.info_card_background || '#363942', player);

                message.channel.send({ files: [{ attachment: card, name: 'profile.png' }] });
            } catch(e){
                logger.error(`An error occurred while using the =info command:\nUser: ${lookup}\n${e.stack}`);
                message.reply(createEmbed("Something went wrong while requesting a player's stats. Please try again later. If the issue persists, please contact a staff member.", "RED"));
            }
            return;
        }

        if(Constants.PMODIFY_VOID.CHANNELS.includes(message.channel.id) && message.content.toLowerCase().startsWith('=modify')) {
            
            if(!message.member) return;
            if(!(await hasPerms(message.member, Constants.PMODIFY_VOID.ROLES))) return message.channel.send(createEmbed(`${message.author} you do not have the required permissions to run this command.`, "RED", "RBW Ban Hammer!"));

            const users = message.content.split(' ').slice(2, -1).map((id: string) => client.users.cache.get(id)).filter((u: any) => u);
            users.push(...message.mentions.users.array());

            const msg_arr = message.content.split(' ');

            if(msg_arr.length < 4) return message.reply(createEmbed(`Invalid Usage. Please use format \`=modify wins|losses|kills|deaths|bedsbroken|bedslost|winstreak|bedstreak @User/User_ID ±[number]\``, "RED"));

            const option = msg_arr[1].toLowerCase();
            if(![`wins`, `losses`, `kills`, `deaths`, `bedsbroken`, `bedslost`, `winstreak`, `bedstreak`].includes(option))  return message.reply(createEmbed(`Invalid Usage. Please use format \`=modify wins|losses|kills|deaths|bedsbroken|bedslost|winstreak|bedstreak @User/User_ID ±[number]\``, "RED"));

            const num = parseInt(msg_arr[3]);
            if(Number.isNaN(num)) return message.reply(createEmbed(`Number of ${option} must be an Integer or Valid Number.`));

            if(users.length > 0) {
                let ids = users.map((user: any) => user!.id);
                const players = (await Players.getManyByDiscord(ids));
                const players2 = players.map(player => player.discord);

                ids = ids.filter((id: any) => players2.includes(id));

                switch(option) {
                    case "wins": {
                        await db.players.updateMany({ "discord": { $in: ids } }, { $inc: { "wins": num } }, { upsert: true }) 
                        break;
                    };

                    case "losses": {
                        await db.players.updateMany({ "discord": { $in: ids } }, { $inc: { "losses": num } }, { upsert: true }) 
                        break;
                    };

                    case "bedsbroken": {
                        await db.players.updateMany({ "discord": { $in: ids } }, { $inc: { "bedsBroken": num, "elo": 10 * num } }, { upsert: true });
                        break;
                    };

                    case "bedslost": {
                        await db.players.updateMany({ "discord": { $in: ids } }, { $inc: { "bedsLost": num } }, { upsert: true }) 
                        break;
                    };

                    case "winstreak": {
                        await db.players.updateMany({ "discord": { $in: ids } }, { $inc: { "winstreak": num } }, { upsert: true }) 
                        break;
                    };

                    case "bedstreak": {
                        await db.players.updateMany({ "discord": { $in: ids } }, { $inc: { "bedstreak": num } }, { upsert: true }) 
                        break;
                    };
                }

                message.reply(createEmbed(`Users → ${ids.map((id: any) => `<@${id}>`).join(' ')} ${option} modified successfully.`));
            }
            else message.reply(createEmbed('Invalid User/User_ID specified.'));
            return;
        }

        if(Constants.PMODIFY_VOID.CHANNELS.includes(message.channel.id) && message.content.toLowerCase().startsWith('=win') || message.content.toLowerCase().startsWith('=loss') || message.content.toLowerCase().startsWith('=w') || message.content.toLowerCase().startsWith('=l ')) {    
            
            if(!message.member) return;
            if(!(await hasPerms(message.member, Constants.PMODIFY_VOID.ROLES))) return message.channel.send(createEmbed(`${message.author} you do not have the required permissions to run this command.`, "RED", "RBW Ban Hammer!"));

            const users = message.content.split(' ').slice(1).map((id: any) => client.users.cache.get(id)).filter((u: any) => u);
            users.push(...message.mentions.users.array());
            
            if(users.length > 0) {
                let ids = users.map((user: any) => user!.id);
                const players = (await Players.getManyByDiscord(ids));
                const players2 = players.map(player => player.discord);

                ids = ids.filter((id: any) => players2.includes(id));
                const winOrLoss = message.content.split(' ')[0].slice(1);
                const elo = winOrLoss === ('win' || 'w')? 25:-25;

                if(winOrLoss === 'win' || winOrLoss === 'w') {
                    await db.players.updateMany(
                        {
                            "discord": {
                                $in: ids
                            }
                        },
                        {
                            $inc: {
                                "wins": 1,
                                "elo": 25
                            },
                        },
                        {
                            upsert: true
                        }
                    )

                    for(let i = 0; i < players2.length; i++) {
                        const p = guild.members.cache.get(players2[i]);
                        const player = players.get(players2[i]);
                        if(p && player && !p.roles.cache.has(Constants.SUPPORT_ROLE_ID)) await p.setNickname(`[${player.elo + 25}] ${player.minecraft.name}`);
                    }
                }
                else if(winOrLoss === 'loss' || winOrLoss === 'l'){
                    await db.players.updateMany(
                        {
                            "discord": {
                                $in: ids
                            }
                        },
                        {
                            $inc: {
                                "losses": 1,
                                "elo": -25
                            },
                        },
                        {
                            upsert: true
                        }
                    )

                    for(let i = 0; i < players2.length; i++) {
                        const p = guild.members.cache.get(players2[i]);
                        const player = players.get(players2[i]);
                        if(p && player && !p.roles.cache.has(Constants.SUPPORT_ROLE_ID)) await p.setNickname(`[${player.elo - 25}] ${player.minecraft.name}`);
                    }
                }

                message.reply(createEmbed(`Users → ${ids.map((id: any) => `<@${id}>`).join(' ')} scored successfully.`));
                const ch = guild.channels.cache.get(Constants.PMODIFY_VOID.PMODIFY_RESPONSE_CHANNEL) as TextChannel;

                const ping = await ch.send(`${ids.map((id: any) => `<@${id}>`).join(' ')}`);
                ping.edit(createEmbed(`${players.map(player => `**${player.minecraft.name}** [\`${player.elo}\` → \`${player.elo + elo}\`] ${Math.floor(player.elo/100) === Math.floor((player.elo + elo)/100)? '': `${getRole(player.elo)} → ${getRole(player.elo + elo)}`}`)}\n`).setTitle("Manual Scoring").addField('Scorer Responsible', `${message.author}`));
                players.forEach(async player => {
                    if(Math.floor(player.elo/100) !== Math.floor((player.elo + elo)/100)) {
                        const member = guild.members.cache.get(player.discord);
                        member!.roles.cache.forEach(async role => {
                            if(Constants.ELO_ROLES.includes(role.id)) await member?.roles.remove(role);
                        });
                        await member?.roles.add(getRole(player.elo + elo)!);
                    }
                })
            }
            else {
                message.reply(createEmbed('Please enter valid user IDs or mention valid discord users to run this command.', "RED"));
            }
            return;
        }

        if(message.channel.id === '805363821568065558' && message.content.toLowerCase().startsWith('=restart') && message.content.split(' ').length > 1) {
            const bot = message.content.split(' ')[1];
            const _bot = bots.get(bot);
            if(!_bot) return message.reply(`${bot} is not a valid bot.`);
            _bot.emit("restart");
            BotManager.release(bot);
            return message.reply(`${bot} successfully restarted.`);
        }

        if (message.channel.type === 'text' && (message.content.toLowerCase().startsWith('=qs') || message.content.toLowerCase().startsWith('=queuestats')) && Constants.CATEGORY_ARRAY.flat().includes(message.channel.parent.id)) {
            const users = message.channel.permissionOverwrites
                .filter((p: any) => p.type === 'member')
                .map((p: any) => p.id);

            const players = await Players.getManyByDiscord(users);
            const embed = new MessageEmbed()
                .setTitle('Queue\'s Stats')
                .setDescription(players.map(p => `\`•\` <@${p.discord}>: **Wins:** ${p.wins ?? 0} | **Losses:** ${p.losses ?? 0} | **W/L:** ${((p.wins ?? 0) / (p.losses || 1)).toFixed(1)} | **K/D:** ${((p.kills ?? 0) / (p.deaths || 1)).toFixed(1)} | **Ws:** ${p.winstreak ?? 0}`).join('\n') || 'No players.');
        
            return message.channel.send(embed);
        }

        if(Constants.PMODIFY_VOID.CHANNELS.includes(message.channel.id) && message.content.toLowerCase().startsWith('=pmodify')) {
            
            if(!message.member) return;
            if(!(await hasPerms(message.member, Constants.PMODIFY_VOID.ROLES))) return message.channel.send(createEmbed(`${message.author} you do not have the required permissions to run this command.`, "RED", "RBW Ban Hammer!"));

            const msg_arr = message.content.split(' ');

            if(msg_arr.length !== 3) {
                return message.channel.send(createEmbed("Invalid Usage. Use `=pModify @user/user_id ±elo`", "RED", "Have fun scoring!"));
            }

            let user = message.mentions.users.first();

            if(!user) {
                user = client.users.cache.get(msg_arr[1]);
                if(!user) {
                    return message.channel.send(createEmbed("You need to `mention a user or provide a user id` to change their elo.", "RED", "Have fun scoring!"));
                }
            }

            let finalelo = parseInt(msg_arr[2]); 

            if(Number.isNaN(finalelo)) {
                return message.channel.send(createEmbed("Invalid Usage. `ELO must be specified as a Number.`"));
            }

            const player = await Players.getByDiscord(user.id);
            const init_role = getRole(player?.elo ?? 400);

            if(!player) {
                return message.channel.send(createEmbed(`${user} is not registered.`, "RED", "Have fun scoring!"));
            }

            finalelo += player!.elo;

            if(finalelo < 0) {
                return message.channel.send(createEmbed(`${message.author} you cannot remove \`${finalelo - player!.elo}\` elo from ${user} as they only have \`${player?.elo}\` elo remaining.`, "RED", "Have fun scoring!"));
            }

            const final_role = getRole(finalelo);

            player?.update({ elo: finalelo });
            const mem = guild.members.cache.get(user.id);
            if(mem && !mem.roles.cache.has(Constants.SUPPORT_ROLE_ID)) await mem.setNickname(`[${finalelo}] ${player?.minecraft.name}`).catch(e => logger.error(`Failed to update a new member's nickname:\n${e.stack}`));
            
            const confirmation = await message.reply(`Game Scored successfully!`);
            message.delete({ timeout: 50 });
            confirmation.delete({ timeout: 2000 });

            let msg = '';

            if(init_role && final_role && init_role!.id !== final_role!.id) {
                msg = `${init_role} → ${final_role}`;
                const member = guild.members.cache.get(user.id);
                member!.roles.cache.forEach(async role => {
                    if(Constants.ELO_ROLES.includes(role.id)) {
                        await member?.roles.remove(role);
                    }
                })
                await member?.roles.add(final_role);
            }

            const m = await (guild.channels.cache.get(Constants.PMODIFY_VOID.PMODIFY_RESPONSE_CHANNEL) as TextChannel).send(`${user}`);
            m.edit(createEmbed(`**${player.minecraft.name}** [\`${player!.elo}\` → \`${finalelo}\`] ${msg}`, "#228B22", "Have fun scoring!").addField("**Scorer Responsible:**", `${message.author}`).setTitle('Manual Scoring'));
        }  

        if(Constants.BAN_UNBAN.CHANNELS.includes(message.channel.id) && message.content.toLowerCase().startsWith('=ban')) {

            let hasPerms = false;
            message.member?.roles.cache.forEach((role: any) => {
                if(Constants.BAN_UNBAN.ROLES.includes(role.id)) {
                    hasPerms = true;
                }
            })

            if(!hasPerms) {
                return message.channel.send(createEmbed(`${message.author} you do not have the required permissions to run this command.`, "RED", "RBW Ban Hammer!"));
            }

            const msg_arr = message.content.split(' ');

            if(msg_arr.length < 3) {
                return message.channel.send(createEmbed(`Invalid Usage. \`Use =ban @user/user_id x(h)/(d) [Reason: optional]\``, "RED", "RBW Ban Hammer!"));
            }

            let user = message.mentions.users.first();
            if(!user) {
                user = client.users.cache.get(msg_arr[1]);
                if(!user) {
                    return message.channel.send(createEmbed(`${message.author} you must mention a user to ban them.`, "RED", "RBW Ban Hammer!"));
                }
            }

            const multiplier = msg_arr[2].slice(-1) === 'd' ? 24 : msg_arr[2].slice(-1) === 'h' ? 1 : undefined;
            
            if(!multiplier) {
                return message.channel.send(createEmbed(`${message.author} you must specify d for days or h for hours at the end of your message to specify ban duration.`, "RED", "RBW Ban Hammer!"));
            }
            
            if(multiplier < 0) {
                return message.channel.send(createEmbed(`${message.author} you must specify ban duration as a positive number.`, "RED", "RBW Ban Hammer!"));
            }

            const number = parseFloat(msg_arr[2].substring(0, msg_arr[2].length - 1));
            if(Number.isNaN(number)) {
                return message.channel.send(createEmbed("Invalid Usage. `Ban duration must be specified as a Integer/Decimal.`", "RED", "RBW Ban Hammer!"));
            }

            const player = await Players.getByDiscord(user.id);

            if(!player) {
                return message.channel.send(createEmbed(`${user} is not registered.`, "RED", "RBW Ban Hammer!"));
            }

            const duration = multiplier*number*60*60*1000;
            let final_msg = msg_arr[2];

            if(duration === 0) {
                player.ban();
                final_msg = 'Full Season';
            }
            else {
                player.ban(duration);
            }

            const member = guild.members.cache.get(user.id);
            try {
                await member?.roles.add(Constants.RANKBANNED);
                for(let i = 0; i < Constants.ELO_ROLES.length; i++) {
                    const role = Constants.ELO_ROLES[i];
                    if(member?.roles.cache.has(role)) {
                        await member.roles.remove(role);
                    }
                }
            }
            catch {
                logger.info(`Could not add Ban roles to ${member?.displayName}`);
            }

            let ch = message.author.id !== client.user!.id? Constants.BAN_UNBAN.MANUAL_BAN_RESPONSE_CHANNEL:Constants.BAN_UNBAN.AUTOMATIC_BAN_RESPONSE_CHANNEL;

            const m = await (guild.channels.cache.get(ch)! as TextChannel).send(`${user}`);
            const reason = msg_arr.splice(3).join(' ');

            if(reason === '') {
                m.edit(createEmbed(`User: ${user} \nDuration: ${final_msg}`, "#228B22", "RBW Ban Hammer").setTitle(`Ban`));
            }
            else {
                m.edit(createEmbed(`**User:** ${user} \n**Duration:** ${final_msg}\n**Reason:** ${reason}`, "#228B22", "RBW Ban Hammer").setTitle(`Ban`));
            }

            const confirmation = await message.reply(`${user.username} was banned successfully.`);
            confirmation.delete({ timeout: 2000 });
        }

        else if(Constants.BAN_UNBAN.CHANNELS.includes(message.channel.id) && message.content.toLowerCase().startsWith('=void')){
            let hasPerms = true;
            message.member?.roles.cache.forEach((role: any) => {
                if(Constants.PMODIFY_VOID.ROLES.includes(role.id)) {
                    hasPerms = true;
                }
            })

            if(!hasPerms) {
                return message.channel.send(createEmbed(`${message.author} you do not have the required permissions to run this command.`, "RED", "RBW Game Void")).catch(() => logger.info("Failed to send in no permissions embed."));
            }

            const msg_arr = message.content.split(' ');

            if(msg_arr.length < 1) {
                return message.channel.send(createEmbed(`Invalid Usage. \`Use =void gameID\``, "RED", "RBW Game Void")).catch(() => logger.info("Failed to send in correct =void usage embed"));
            }

            const gameId = parseInt(msg_arr[1]);

            if(Number.isNaN(gameId)) {
                return message.channel.send(createEmbed("Invalid Usage. `Game ID must be specified as a Number.`", "RED", "RBW Game Void")).catch(() => logger.info("Failed to send in enter specific number embed"));
            }

            try {
                const db = await database;
                const game = await db.games.findOne({ number: gameId });
    
                if(!game) return message.channel.send(createEmbed(`Game not found. \`Game ${gameId} does not exist.\``, "RED", "RBW Game Void")).catch(() => logger.info("Failed to send in game does not exist embed"));
    
                if(game.state === GameState.VOID) return message.channel.send(createEmbed(`Game already voided. \`Game ${gameId} is already voided.\``, "RED", "RBW Game Void")).catch(() => logger.info("Failed to send in Game already voided message"));
                if(game.state !== GameState.FINISHED) return message.channel.send(createEmbed(`Game not finished. \`Game ${gameId} has not finished yet. Only finished games can be voided.\``, "RED", "RBW Game Void")).catch(() => logger.info("Failed to send in only finished games can be voided embed"));
    
                const gamePlayers = (game.team1?.players ?? []).concat((game.team2?.players ?? [])).reduce((a: any, b: any) => {
                    a[b.username] = b;

                    return a;
                }, {});
    
                const op = db.players.initializeUnorderedBulkOp();

                for (const username in gamePlayers) {
                    const player = gamePlayers[username];

                    op.find({ discord: player.discord }).updateOne({
                        $inc: {
                            games: -1,
                            bedsBroken: -player.bedsBroken || 0,
                            bedsLost: -player.bedsLost || 0,
                            deaths: -player.deaths || 0,
                            kills: -player.kills || 0,
                            elo: -(player.newRating - player.oldRating) || 0
                        },
                        $set: {
                            losestreak: player.losestreak ?? 0,
                            winstreak: player.winstreak ?? 0,
                            bedstreak: player.bedstreak ?? 0
                        }
                    });

                    await guild.members.fetch(player.discord)
                        .then(m => m.setNickname(`[${player.oldRating}] ${username}`))
                        .catch(() => {});
                }

                await Promise.all([
                    op.execute(),
                    db.games.updateOne({ _id: game._id }, {
                        $set: {
                            state: GameState.VOID,
                        }
                    })
                ]);

                message.reply(`Game ${gameId} has been voided successfully.`).catch(() => logger.info("Failed to send in successful game void message"));
            } catch(e){
                logger.error(`Failed to void game ${gameId} using the void command:\n${e.stack}`);
                message.channel.send(createEmbed(`Failed to void the game. \`An error occurred.\``, "RED", "RBW Game Void")).catch(() => null);
            }

            return;

        }

        if (message.content.toLowerCase().startsWith('=strikes') || message.content.toLowerCase().startsWith('=getuser')) {
            const user = message.mentions.users.first();
            const hasPerms = user ? Constants.STRIKE_VIEW.ROLES.some(r => message.member?.roles.cache.has(r)) : true;

            if (hasPerms === false) {
                return message.channel.send(createEmbed(`${message.author} you do not have the required permissions to run this command.`, "RED", "RBW Strikes Again!"));
            }

            const player = await Players.getByDiscord(user ? user.id : message.author.id);
            const youThey = user ? ['They', 'Their'] : ['You', 'Your'];

            return message.channel.send(createEmbed(user ? `${user.tag}'s Strikes` : 'Your Strikes', '#228B22')
                .setDescription(`${youThey[0]} have **${player?.strikes ?? 0}** strike${player?.strikes === 1 ? '' : 's'}.${player?.banExpires ? `\n\n**BANNED**\n${player.banExpires === -1 ? `${youThey[0]} are permanently banned.` : `${youThey[1]} ban expires in **${dayjs().from(dayjs(player.banExpires), true)}**.`}` : ''}`))
        }

        if (message.content.toLowerCase().startsWith('=setbackground')) {
            const user = message.mentions.users.first();
            const hasPerms = user ? Constants.STRIKE_UNSTRIKE.ROLES.some(r => message.member?.roles.cache.has(r)) : true;

            if (hasPerms === false) {
                return message.channel.send(createEmbed(`${message.author} you do not have the required permissions to run this command.`, "RED", "RBW Info Cards!"));
            }

            if (!user) {
                return message.channel.send(createEmbed(`${message.author} you must mention a user to alter their card.`, "RED", "RBW Strikes Again!"));
            }

            const player = await Players.getByDiscord(user.id);

            if (!player) {
                return message.channel.send(createEmbed(`${user} is not registered.`, "RED", "RBW Info Cards!"));
            }

            const url = message.content.split(' ').find((m: string) => /^http.*\.(?:png|jpeg|jpg)/.test(m) || m === 'default' || /#[a-f0-9]{3,6}/i.test(m));

            if (!url && url !== 'default') {
                return message.channel.send(createEmbed('You did not provide a valid image URL.', "RED", "RBW Info Cards!"));
            }

            player?.update({ info_card_background: url === 'default' ? null : url });

            return message.reply(`${user.username}'s info card background has been updated.`);
        }

        if (message.content.toLowerCase().startsWith('=setemoji')) {
            const player = await Players.getByDiscord(message.author.id);

            if (!player) {
                return message.channel.send(createEmbed(`You are not registered.`, "RED", "RBW Info Cards!"));
            }

            const emoji = message.content.split(' ').slice(1).shift();

            if (!emoji || /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/.test(emoji) === false) {
                return message.channel.send(createEmbed(`You did not provide a valid emoji.`, "RED", "RBW Info Cards!"));
            }

            player?.update({ emoji: emoji });

            return message.reply(`your info emoji has been updated.`);
        }

        if (message.content.toLowerCase().startsWith('=settext')) {
            const user = message.mentions.users.first();
            const hasPerms = user ? Constants.STRIKE_UNSTRIKE.ROLES.some(r => message.member?.roles.cache.has(r)) : true;

            if (hasPerms === false) {
                return message.channel.send(createEmbed(`${message.author} you do not have the required permissions to run this command.`, "RED", "RBW Info Cards!"));
            }

            if (!user) {
                return message.channel.send(createEmbed(`${message.author} you must mention a user to alter their card.`, "RED", "RBW Strikes Again!"));
            }

            const player = await Players.getByDiscord(user.id);

            if (!player) {
                return message.channel.send(createEmbed(`${user} is not registered.`, "RED", "RBW Info Cards!"));
            }

            const text = message.content.split(' ').slice(2).join(' ');

            if (!text && text !== 'default') {
                return message.channel.send(createEmbed('You did not provide any text.', "RED", "RBW Info Cards!"));
            }

            player?.update({ info_card_text: text === 'default' ? null : text });

            return message.reply(`${user.username}'s info card text has been updated.`);
        }

        if((Constants.STRIKE_UNSTRIKE.CHANNELS.includes(message.channel.id) || Constants.STRIKE_UNSTRIKE.CATEGORY_CHANNEL === (message.channel as TextChannel).parentID) && message.content.toLowerCase().startsWith('=strike')) {

            let hasPerms = false;
            message.member?.roles.cache.forEach((role: any) => {
                if(Constants.STRIKE_UNSTRIKE.ROLES.includes(role.id)) {
                    hasPerms = true;
                }
            })

            if(!hasPerms) {
                return message.channel.send(createEmbed(`${message.author} you do not have the required permissions to run this command.`, "RED", "RBW Strikes Again!"));
            }
            
            const msg_arr = message.content.split(' ');

            if(msg_arr.length < 3) {
                return message.channel.send(createEmbed(`Invalid Usage. \`Use =strike @user/user_id (±)strike(s) [Reason: Optional]\``, "RED", "RBW Strikes Again!"));
            }

            let user = message.mentions.users.first();
            if(!user) {
                user = client.users.cache.get(msg_arr[1]);
                if(!user) {
                    return message.channel.send(createEmbed(`${message.author} you must mention a user to strike them.`, "RED", "RBW Strikes Again!"));
                }
            }

            let number_of_strikes = parseInt(msg_arr[2]);
            let heading;

            if(Number.isNaN(number_of_strikes)) {
                return message.channel.send(createEmbed("Invalid Usage. `Strike(s) must be specified as a Number.`"));
            }
            else if(number_of_strikes < 0) {
                heading = 'Unstrike';
            }
            else {
                heading = 'Strike';
            }

            const player = await Players.getByDiscord(user.id);

            if(!player) {
                return message.channel.send(createEmbed(`${user} is not registered.`, "RED", "RBW Strikes Again!"));
            }

            number_of_strikes += player!.strikes;

            if(number_of_strikes < 0) {
                return message.channel.send(createEmbed(`${message.author} you cannot remove \`${number_of_strikes - player!.strikes}\` strikes from ${user} as they only have \`${player?.strikes}\` strikes.`, "RED", "RBW Strikes Again!"));
            }

            player?.update({ strikes: number_of_strikes });
            const reason = msg_arr.slice(3).join(' ');

            const isBot = message.author.id === client.user!.id? true : false;
            const response_id = isBot? Constants.STRIKE_UNSTRIKE.AUTOSTRIKE_RESPONSE_CHANNEL : Constants.STRIKE_UNSTRIKE.MANUALSTRIKE_RESPONSE_CHANNEL;

            const m = await (guild.channels.cache.get(response_id) as TextChannel).send(`${user}`);

            if (reason === '') {
                if(!isBot) {
                    m.edit(createEmbed(`**${player.minecraft.name}** [\`${player!.strikes}\` → \`${number_of_strikes}\`]\n**ELO:** [\`${player.elo}\` → \`${await player.strikeELO(heading)}\`]\n**Staff Responsible:** ${message.author}`, "#228B22", `RBW ${heading}s Again!`).setTitle(`${heading}`));
                }
                else {
                    m.edit(createEmbed(`**${player.minecraft.name}** [\`${player!.strikes}\` → \`${number_of_strikes}\`]`, "#228B22", `RBW ${heading}s Again!`).setTitle(`${heading}`));
                }
            }
            else {
                if(!isBot) {
                    m.edit(createEmbed(`**${player.minecraft.name}** [\`${player!.strikes}\` → \`${number_of_strikes}\`]\n**ELO:** [\`${player.elo}\` → \`${await player.strikeELO(heading)}\`]\n**Reason:** ${reason}\n**Staff Responsible:** ${message.author}`, "#228B22", `RBW ${heading}s Again!`).setTitle(`${heading}`));
                }
                else {
                    m.edit(createEmbed(`**${player.minecraft.name}** [\`${player!.strikes}\` → \`${number_of_strikes}\`]\n**Reason:** ${reason}`, "#228B22", `RBW ${heading}s Again!`).setTitle(`${heading}`));
                }
            }

            if(number_of_strikes < player.strikes){
                return;
            }

            if(number_of_strikes >= 2) {
                (guild.channels.cache.get(Constants.COMMANDS_CHANNEL) as TextChannel)!.send(`=ban ${user!} ${getBanDuration(player.strikes, Math.abs(number_of_strikes - player.strikes))} Autoban`);
            }

            const confirmation = await message.reply(`${user} was striked successfully.`);
            confirmation.delete({ timeout: 2000 });
        }

        else if(Constants.BAN_UNBAN.CHANNELS.includes(message.channel.id) && message.content.toLowerCase().startsWith('=unban')) {

            let hasPerms = false;
            message.member?.roles.cache.forEach((role: any) => {
                if(Constants.BAN_UNBAN.ROLES.includes(role.id)) {
                    hasPerms = true;
                }
            })

            if(!hasPerms) {
                return message.channel.send(createEmbed(`${message.author} you do not have the required permissions to run this command.`, "RED", "RBW Strikes Again!"));
            }

            const msg_arr = message.content.split(' ');

            if(msg_arr.length !== 2) {
                return message.channel.send(createEmbed(`Invalid Usage. \`Use =unban @user/user_id`, "RED", "RBW Unban Hammer!"));
            }

            let user = message.mentions.users.first();
            if(!user) {
                user = client.users.cache.get(msg_arr[1]);
                if(!user) {
                    return message.channel.send(createEmbed(`${message.author} you must mention a user to unban them.`, "RED", "RBW Unban Hammer!"));
                }
            }

            const player = await Players.getByDiscord(user.id);

            if(!player) {
                return message.channel.send(createEmbed(`${user} is not registered.`, "RED", "RBW Unban Hammer!"));
            }

            if(!player.banned) {
                return message.channel.send(createEmbed(`${user} is not banned yet. Please use \`=ban @user/user_id x(h)/(d)\` in order to ban the player.`, "RED", "RBW Unban Hammer!"));
            }

            await player.unban();
            const member = guild.members.cache.get(user.id);
            await member?.roles.remove(Constants.RANKBANNED).catch(() => logger.info(`Could not remove Rank Banned Role from ${member.displayName}`));
            await member?.roles.add(getRole(player.elo)!).catch(() => logger.info(`Could not add elo role for ${member.displayName}`));

            const m = await (guild.channels.cache.get(Constants.BAN_UNBAN.UNBAN_RESPONSE_CHANNEL) as TextChannel).send(`${user}`);
            if(message.author.id !== client.user!.id) {    
                m.edit(createEmbed(`${user} has been unbanned!`, "#228B22", "RBW Unban Hammer").setTitle(`Unban`));
            }
            else {
                m.edit(createEmbed(`${user} has been unbanned!`, "#228B22", "RBW Unban Hammer").addField("**Staff Responsible:**", `${message.author}`).setTitle(`Unban`));
            }

            const confirmation = await message.reply(`${user.username} was unbanned successfully.`);
            message.delete({ timeout: 50 });
            return confirmation.delete({ timeout: 2000 });
        }
        
        else if(message.content === "=fclose" || message.content === "=forceclose"){

            let hasPerms = false;
            message.member?.roles.cache.forEach((role: any) => {
                if(Constants.FCLOSE_ROLES.includes(role.id)){
                    hasPerms = true;
                }
            });
            if(message.author.id === client.user!.id) hasPerms = true;

            if(!hasPerms) {
                return message.channel.send(createEmbed(`${message.author} you do not have the required permissions to run this command.`, "RED", "RBW Game Management")).catch(() => null);
            }

            const g = game_cache.findIndex(g => g.textChannelID === message.channel.id);
            if(g !== -1) game_cache.splice(g, 1); 

            const game = activeGames.find(_game => _game.textChannel?.id === message.channel.id);

            if(!game) return message.channel.send(createEmbed("This channel is not bound to a currently active game.", "RED", "RBW Game Management")).catch(() => null);

            await db.activeGame.deleteMany({ _id: game.id });

            try {

                const deleteChannels = await game.cancel();
                deleteChannels();

            } catch(e) {
                logger.error(`Failed to run =fclose command:\n${e.stack}`);
            };

        }
    });

    client.on('guildMemberAdd', async member => {
        const player = (await Players.getByDiscord(member.id));

        if(player) {
            await member.roles.set(player.roles);
        }
    });

    client.on('guildMemberRemove', async member => {
        const player = (await Players.getByDiscord(member.id));

        if(player) {
            player.update({ roles: member.roles.cache.map(({ id }) => id) });
        }
    });

    logger.info("App is now online!");

    setInterval(() => {
        Players.updateBans 
        help_cmd_cache.forEach((cmd, index) => {
            if(Date.now() - cmd.timeOfCreation >= 1000*60) help_cmd_cache.splice(index, 1);
        });
    }, 60*1000)

    async function strikeEmbed() {
        const t = Date.now();

        for (let i = 0; i < game_cache.length; i++) {
            
            const g = game_cache[i];

            if(g.pickingOver) {
                continue;
            }

            const tc = guild.channels.cache.get(g.textChannelID) as TextChannel;

            if(t - g.timeOfLastPick > 5*1000*60) {
                tc.send('=fclose');
                continue;
            }

            const vc = guild.channels.cache.get(g.voiceChannelID);

            if(vc && vc.members.array().length! < 8 && tc) {
                const game = activeGames.find(({ voiceChannel }) => voiceChannel?.id === vc.id);

                if(game && (game.state === GameState.PRE_GAME)){

                    const arr = vc.members.array().map(mem => mem.id);
                    const member_id = g.members.filter(mem => !arr.includes(mem))[0];

                    g.pickingOver = true;

                    const [ deleteChannels, _, m ] = await Promise.all([
                        game.cancel(),
                        arr.length > 0 ? game.textChannel!.send(arr.map(a => `<@${a}>`).join(' ')) : null,
                        game.textChannel!.send(
                            createEmbed(`Do you want to strike <@${member_id}> for leaving the Voice Channel during picking?`, "#F6BE00", 'RBW Auto-Strike')
                            .setTitle('Automatic Strike')
                            .setImage(client.users.cache.get(member_id)?.avatarURL()!)
                        )
                    ]);
        
                    try {
                        await m.react('✅').then(async () => {
                            await m.react('❌');
                        })
                        
                        await m.awaitReactions(r => ['✅', '❌'].includes(r.emoji.name), { max: (game.voiceChannel?.members.size ?? 0 + 1) * 2, time: 30000 });
                        if(m.reactions.cache.get('✅')?.count! > m.reactions.cache.get('❌')?.count!) {
                            m.edit(createEmbed(`Strike Successful → <@${member_id}>`, "#228B22", "RBW Auto-Strike").setTitle('Auto Strike → ✅').setImage(client.users.cache.get(member_id)?.avatarURL()!));
                            (guild.channels.cache.get(Constants.STRIKE_UNSTRIKE.AUTOSTRIKE_RESPONSE_CHANNEL) as TextChannel).send(`=strike <@${member_id}> 1 Left during team picking.`);
                        }
                        else {
                            m.edit(createEmbed(`Strike Unsuccessful → <@${member_id}>`, "RED", "RBW Auto-Strike").setTitle('Auto Strike → ❌').setImage(client.users.cache.get(member_id)?.avatarURL()!));
                        }
                        m.reactions.removeAll().catch(() => null);
                        setTimeout(deleteChannels, 10000);
                    } catch(e){
                        logger.error(`Failed to prompt players to vote to strike a player!\n${e.stack}`)
                    };
                }
            }
        }
    }

    async function fixGlitches() {
        const db = await database;
        const assignedBots = (await db.bots.find({ "assignedGame": { $exists: true } }).toArray()).map(bot => bot.username);
        const glitchedBots = [];
        for (let i = 0; i < assignedBots.length; i++) {
            const activeBot = await db.activeGame.findOne({ "botIGN": assignedBots[i] });
            if (!activeBot)
                glitchedBots.push(activeBot);
        }
        ;
        const restartBots = guild.channels.cache.get('805363821568065558') as TextChannel;
        for (let i = 0; i < glitchedBots.length; i++) {
            restartBots?.send(`=restart ${glitchedBots[i]}`).catch(() => null);
            await delay(400);
        }
        ;
        const activeChannels = (await db.activeGame.find({ "textChannel": { $exists: true } }).toArray());
        for (let i = 0; i < activeChannels.length; i++) {
            const channel = guild.channels.cache.get(activeChannels[i].textChannel ?? '') as TextChannel;
            const team1Channel = guild.channels.cache.get(activeChannels[i].team1Channel ?? '');
            const team2Channel = guild.channels.cache.get(activeChannels[i].team2Channel ?? '');
            if (channel && team1Channel && team2Channel) {
                if (team1Channel.members.size === 0 && team2Channel.members.size === 0) {
                    channel.send('=fclose');
                }
            }
        }
    }

    setInterval(fixGlitches, 20000);

    setInterval(() => {

        let spliced = 0;

        game_cache.forEach((g, index) => {
            if(!guild.channels.cache.find(ch => ch.id === g.textChannelID)) {
                spliced++;
                game_cache.splice(index, 1);
            }
        })

        if(spliced !== 0) logger.info(`Removed → ${spliced} games from the cache.`);

    }, 10000)
}();