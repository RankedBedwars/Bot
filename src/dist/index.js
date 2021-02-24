"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var dotenv_1 = require("dotenv");
dotenv_1["default"].config();
var logger_1 = require("./logger");
var logger = new logger_1["default"]("Main");
var discord_js_1 = require("discord.js");
var https_1 = require("https");
var node_fetch_1 = require("node-fetch");
var bot_1 = require("./managers/bot");
var database_1 = require("./managers/database");
var hypixel_1 = require("./managers/hypixel");
var constants_1 = require("./constants");
var utils_1 = require("./utils");
var games_1 = require("./typings/games");
var socket_1 = require("./managers/socket");
var game_cache = [];
!function () {
    return __awaiter(this, void 0, void 0, function () {
        function createEmbed(description, color, footerSuffix) {
            if (color === void 0) { color = "#228B22"; }
            if (footerSuffix === void 0) { footerSuffix = "Watching " + guild.memberCount + " Players!"; }
            var embed = new discord_js_1.MessageEmbed()
                .setColor(color)
                .setFooter("\u00A9 Ranked Bedwars | " + footerSuffix, constants_1.Constants.BRANDING_URL);
            if (description)
                embed.setDescription(description);
            return embed;
        }
        function getRole(p) {
            var index = Math.floor(Math.abs(p) / 100);
            index = index === 17 ? 16 : (index >= 18 && index < 20) ? 17 : index >= 20 ? 18 : index;
            return guild === null || guild === void 0 ? void 0 : guild.roles.cache.get(constants_1.Constants.ELO_ROLES[index]);
        }
        function strikeEmbed() {
            var _a, _b, _c, _d, _e, _f, _g;
            return __awaiter(this, void 0, void 0, function () {
                var t, _loop_1, i;
                return __generator(this, function (_h) {
                    switch (_h.label) {
                        case 0:
                            t = Date.now();
                            _loop_1 = function (i) {
                                var g, tc, vc, game, arr_1, member_id, _a, deleteChannels, garbage, m, e_1;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            g = game_cache[i];
                                            if (g.pickingOver) {
                                                return [2 /*return*/, "continue"];
                                            }
                                            tc = guild.channels.cache.get(g.textChannelID);
                                            if (t - g.timeOfLastPick > 5 * 1000 * 60) {
                                                tc.send('=fclose');
                                                return [2 /*return*/, "continue"];
                                            }
                                            vc = guild.channels.cache.get(g.voiceChannelID);
                                            if (!(vc && vc.members.array().length < 8 && tc)) return [3 /*break*/, 7];
                                            game = utils_1.activeGames.find(function (_a) {
                                                var voiceChannel = _a.voiceChannel;
                                                return (voiceChannel === null || voiceChannel === void 0 ? void 0 : voiceChannel.id) === vc.id;
                                            });
                                            if (!(game && (game.state === games_1.GameState.PRE_GAME))) return [3 /*break*/, 7];
                                            arr_1 = vc.members.array().map(function (mem) { return mem.id; });
                                            member_id = g.members.filter(function (mem) { return !arr_1.includes(mem); })[0];
                                            g.pickingOver = true;
                                            return [4 /*yield*/, Promise.all([
                                                    game.cancel(),
                                                    game.textChannel.send(arr_1.map(function (a) { return "<@" + a + ">"; }).join(' ')),
                                                    game.textChannel.send(createEmbed("Do you want to strike <@" + member_id + "> for leaving the Voice Channel during picking?", "#F6BE00", 'RBW Auto-Strike')
                                                        .setTitle('Automatic Strike')
                                                        .setImage((_a = client.users.cache.get(member_id)) === null || _a === void 0 ? void 0 : _a.avatarURL()))
                                                ])];
                                        case 1:
                                            _a = _b.sent(), deleteChannels = _a[0], garbage = _a[1], m = _a[2];
                                            _b.label = 2;
                                        case 2:
                                            _b.trys.push([2, 5, , 6]);
                                            return [4 /*yield*/, Promise.all([
                                                    m.react('✅'),
                                                    m.react('❌'),
                                                ])];
                                        case 3:
                                            _b.sent();
                                            return [4 /*yield*/, m.awaitReactions(function (r) { return ['✅', '❌'].includes(r.emoji.name); }, { max: ((_c = (_b = game.voiceChannel) === null || _b === void 0 ? void 0 : _b.members.size) !== null && _c !== void 0 ? _c : 0 + 1) * 2, time: 30000 })];
                                        case 4:
                                            _b.sent();
                                            if (((_d = m.reactions.cache.get('✅')) === null || _d === void 0 ? void 0 : _d.count) > ((_e = m.reactions.cache.get('❌')) === null || _e === void 0 ? void 0 : _e.count)) {
                                                m.edit(createEmbed("Strike Successful \u2192 <@" + member_id + ">", "#228B22", "RBW Auto-Strike").setTitle('Auto Strike → ✅').setImage((_f = client.users.cache.get(member_id)) === null || _f === void 0 ? void 0 : _f.avatarURL()));
                                                guild.channels.cache.get(constants_1.Constants.STRIKE_UNSTRIKE.AUTOSTRIKE_RESPONSE_CHANNEL).send("=strike <@" + member_id + "> 1 Left during team picking.");
                                            }
                                            else {
                                                m.edit(createEmbed("Strike Unsuccessful \u2192 <@" + member_id + ">", "RED", "RBW Auto-Strike").setTitle('Auto Strike → ❌').setImage((_g = client.users.cache.get(member_id)) === null || _g === void 0 ? void 0 : _g.avatarURL()));
                                            }
                                            m.reactions.removeAll()["catch"](function () { return null; });
                                            setTimeout(deleteChannels, 10000);
                                            return [3 /*break*/, 6];
                                        case 5:
                                            e_1 = _b.sent();
                                            logger.error("Failed to prompt players to vote to strike a player!\n" + e_1.stack);
                                            return [3 /*break*/, 6];
                                        case 6:
                                            ;
                                            _b.label = 7;
                                        case 7: return [2 /*return*/];
                                    }
                                });
                            };
                            i = 0;
                            _h.label = 1;
                        case 1:
                            if (!(i < game_cache.length)) return [3 /*break*/, 4];
                            return [5 /*yield**/, _loop_1(i)];
                        case 2:
                            _h.sent();
                            _h.label = 3;
                        case 3:
                            i++;
                            return [3 /*break*/, 1];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        }
        var _a, db, client, guild;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, Promise.all([database_1["default"], bot_1["default"], bot_1.defaultGuild])["catch"](function (err) {
                        logger.error("Startup failed:\n" + err.stack);
                        return process.exit(1);
                    })];
                case 1:
                    _a = _b.sent(), db = _a[0], client = _a[1], guild = _a[2];
                    // Custom slash commands until discord.js officially supports it
                    client.on("raw", function (payload) { return __awaiter(_this, void 0, void 0, function () {
                        function respond(message) {
                            return new Promise(function (res) {
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
                                req.on("error", function () { return null; });
                                req.on("finish", res);
                            });
                        }
                        var logger, _a, token, data, id, member, channel_id, user, cmd, req, _b, player, mojang, d, hypixelData, discord, value, member_1, member_2, e_2, lookup, player, WLR, e_3, _c, name_1, options, page_1, nPerPage_1, total, prettyName, pages, players, e_4;
                        var _d, _e, _f;
                        var _this = this;
                        var _g, _h, _j, _k, _l, _m;
                        return __generator(this, function (_o) {
                            switch (_o.label) {
                                case 0:
                                    if (payload.t !== "INTERACTION_CREATE")
                                        return [2 /*return*/];
                                    logger = new logger_1["default"]("Command Handler");
                                    _a = payload.d, token = _a.token, data = _a.data, id = _a.id, member = _a.member, channel_id = _a.channel_id;
                                    user = member.user;
                                    cmd = data.name;
                                    req = https_1["default"].request(constants_1.Constants.DISCORD_API_BASE_URL + "/interactions/" + id + "/" + token + "/callback", {
                                        method: "POST",
                                        headers: {
                                            authorization: "Bot " + process.env.TOKEN,
                                            "Content-Type": "application/json"
                                        }
                                    });
                                    _b = cmd;
                                    switch (_b) {
                                        case "register": return [3 /*break*/, 1];
                                        case "info": return [3 /*break*/, 15];
                                        case "leaderboard": return [3 /*break*/, 20];
                                    }
                                    return [3 /*break*/, 25];
                                case 1:
                                    if (constants_1.Constants.REGISTER_CHANNEL !== channel_id) {
                                        respond(createEmbed("<@" + user.id + "> you cannot register in this channel. Please do /register [ign] in " + guild.channels.cache.get(constants_1.Constants.REGISTER_CHANNEL), "RED"));
                                        return [3 /*break*/, 25];
                                    }
                                    player = payload.d.data.options[0].value;
                                    _o.label = 2;
                                case 2:
                                    _o.trys.push([2, 13, , 14]);
                                    return [4 /*yield*/, node_fetch_1["default"]("https://api.mojang.com/users/profiles/minecraft/" + player)];
                                case 3: return [4 /*yield*/, (_o.sent()).text()];
                                case 4:
                                    mojang = _o.sent();
                                    if (!mojang) {
                                        respond(createEmbed("Minecraft account not found.", "RED"));
                                        return [3 /*break*/, 25];
                                    }
                                    d = JSON.parse(mojang);
                                    if (!d.id) {
                                        respond(createEmbed("Minecraft account not found.", "RED"));
                                        return [3 /*break*/, 25];
                                    }
                                    return [4 /*yield*/, hypixel_1.getHypixelPlayer(d.id)];
                                case 5:
                                    hypixelData = _o.sent();
                                    discord = (_j = (_h = (_g = hypixelData === null || hypixelData === void 0 ? void 0 : hypixelData.player) === null || _g === void 0 ? void 0 : _g.socialMedia) === null || _h === void 0 ? void 0 : _h.links) === null || _j === void 0 ? void 0 : _j.DISCORD;
                                    if (!discord) {
                                        respond(createEmbed("**" + d.name + "** does not have a Discord account linked. For more information, read " + guild.channels.cache.get('800070737091624970'), "RED"));
                                        return [3 /*break*/, 25];
                                    }
                                    if (discord !== user.username + "#" + user.discriminator) {
                                        respond(createEmbed("**" + d.name + "** has another Discord account or server linked. If this is you, change your linked Discord to **" + user.username + "#" + user.discriminator + "**.\n\n**Changed your Discord username?** You'll need to change your linked account in game.", "RED"));
                                        return [3 /*break*/, 25];
                                    }
                                    return [4 /*yield*/, db.players.findOneAndUpdate({ discord: user.id }, {
                                            $set: {
                                                minecraft: {
                                                    uuid: d.id,
                                                    name: d.name
                                                },
                                                registeredAt: Date.now()
                                            },
                                            $setOnInsert: {
                                                discord: user.id,
                                                elo: 400
                                            }
                                        }, {
                                            upsert: true
                                        })];
                                case 6:
                                    value = (_o.sent()).value;
                                    if (!!value) return [3 /*break*/, 9];
                                    (_k = guild.members.cache.get(user.id)) === null || _k === void 0 ? void 0 : _k.setNickname("[400] " + d.name)["catch"](function (e) { return logger.error("Failed to update a new member's nickname:\n" + e.stack); });
                                    respond(createEmbed("You have successfully registered with the username **" + d.name + "**. Welcome to Ranked Bedwars!", "#228B22"));
                                    member_1 = guild.members.cache.get(user.id);
                                    member_1 === null || member_1 === void 0 ? void 0 : member_1.roles.cache.forEach(function (role) { return __awaiter(_this, void 0, void 0, function () {
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    if (!constants_1.Constants.ELO_ROLES.includes(role.id)) return [3 /*break*/, 2];
                                                    return [4 /*yield*/, member_1.roles.remove(role)["catch"](function () { return null; })];
                                                case 1:
                                                    _a.sent();
                                                    _a.label = 2;
                                                case 2: return [2 /*return*/];
                                            }
                                        });
                                    }); });
                                    return [4 /*yield*/, member_1.roles.add(constants_1.Constants.ELO_ROLES[4])["catch"](function () { return null; })];
                                case 7:
                                    _o.sent();
                                    return [4 /*yield*/, member_1.roles.add(constants_1.Constants.REGISTERED_ROLE)["catch"](function () { return null; })];
                                case 8:
                                    _o.sent();
                                    return [3 /*break*/, 25];
                                case 9:
                                    member_2 = guild.members.cache.get(user.id);
                                    member_2 === null || member_2 === void 0 ? void 0 : member_2.setNickname("[" + ((_l = value.elo) !== null && _l !== void 0 ? _l : 400) + "] " + d.name)["catch"](function (e) { return logger.error("Failed to update an existing member's nickname on re-registration:\n" + e.stack); });
                                    respond(createEmbed("You have successfully changed your linked Minecraft account to **" + d.name + "**.", "#228B22"));
                                    member_2 === null || member_2 === void 0 ? void 0 : member_2.roles.cache.forEach(function (role) { return __awaiter(_this, void 0, void 0, function () {
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    if (!constants_1.Constants.ELO_ROLES.includes(role.id)) return [3 /*break*/, 2];
                                                    return [4 /*yield*/, member_2.roles.remove(role)["catch"](function () { return null; })];
                                                case 1:
                                                    _a.sent();
                                                    _a.label = 2;
                                                case 2: return [2 /*return*/];
                                            }
                                        });
                                    }); });
                                    return [4 /*yield*/, member_2.roles.add(getRole((_m = value.elo) !== null && _m !== void 0 ? _m : 400))["catch"](function () { return null; })];
                                case 10:
                                    _o.sent();
                                    return [4 /*yield*/, member_2.roles.remove(constants_1.Constants.UNREGISTERED_ROLE)["catch"](function () { return null; })];
                                case 11:
                                    _o.sent();
                                    return [4 /*yield*/, member_2.roles.add(constants_1.Constants.REGISTERED_ROLE)["catch"](function () { return null; })];
                                case 12:
                                    _o.sent();
                                    return [3 /*break*/, 14];
                                case 13:
                                    e_2 = _o.sent();
                                    logger.error("An error occurred while using the /register command:\nDeclared username: " + player + "\n" + e_2.stack);
                                    respond(createEmbed('Something went wrong while registering your account. Please try again later. If the issue persists, please contact a staff member.', "RED"));
                                    return [3 /*break*/, 14];
                                case 14: return [3 /*break*/, 25];
                                case 15:
                                    if (constants_1.Constants.CHAT === channel_id) {
                                        respond(createEmbed("<@" + user.id + "> commands are disabled in this channel.", "RED"));
                                        return [3 /*break*/, 25];
                                    }
                                    lookup = payload.d.data.options[0].value;
                                    _o.label = 16;
                                case 16:
                                    _o.trys.push([16, 18, , 19]);
                                    return [4 /*yield*/, utils_1.Players.getByDiscord(lookup)];
                                case 17:
                                    player = _o.sent();
                                    if (!player) {
                                        respond(createEmbed("<@" + lookup + "> is not a registered Ranked Bedwars player.", "RED"));
                                        return [3 /*break*/, 25];
                                    }
                                    WLR = player.losses === 0 ? player.wins : Math.round((player.wins / player.losses + Number.EPSILON) * 100) / 100;
                                    respond(createEmbed("**" + player.minecraft.name + "**'s Stats", "#228B22")
                                        .addField("**Stats**", "`Elo:` " + player.elo + "\n`Strikes:` " + player.strikes)
                                        .addField("**Games**", "`Wins:` " + player.wins + "\n`Losses:` " + player.losses + "\n`WLR:` " + WLR + "\n`Winstreak:` " + player.winstreak + "\n`Bedstreak:` " + player.bedstreak)
                                        .addField("**Combat**", "`Kills:` " + player.kills + "\n`Deaths:` " + player.deaths + "\n`Beds Broken:` " + player.bedsBroken + "\n`Beds Lost:` " + player.bedsLost));
                                    return [3 /*break*/, 19];
                                case 18:
                                    e_3 = _o.sent();
                                    logger.error("An error occurred while using the /info command:\nUser: " + lookup + "\n" + e_3.stack);
                                    respond(createEmbed("Something went wrong while requesting a player's stats. Please try again later. If the issue persists, please contact a staff member.", "RED"));
                                    return [3 /*break*/, 19];
                                case 19: return [3 /*break*/, 25];
                                case 20:
                                    if (constants_1.Constants.CHAT === channel_id) {
                                        respond(createEmbed("<@" + user.id + "> commands are disabled in this channel.", "RED"));
                                        return [3 /*break*/, 25];
                                    }
                                    _o.label = 21;
                                case 21:
                                    _o.trys.push([21, 24, , 25]);
                                    _c = payload.d.data.options[0], name_1 = _c.name, options = _c.options;
                                    if (name_1 === "beds")
                                        name_1 = "bedsBroken";
                                    page_1 = options ? options[0].value : 1;
                                    nPerPage_1 = 10;
                                    return [4 /*yield*/, db.players.find((_d = {},
                                            _d[name_1] = {
                                                $exists: true
                                            },
                                            _d)).count()];
                                case 22:
                                    total = _o.sent();
                                    if (total < 1) {
                                        respond(createEmbed("There's no players on this leaderboard yet. Play now, and claim a top spot!", "RED"));
                                        return [3 /*break*/, 25];
                                    }
                                    prettyName = name_1;
                                    switch (name_1) {
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
                                    }
                                    pages = Math.ceil(total / nPerPage_1);
                                    if (page_1 > pages)
                                        page_1 = pages;
                                    return [4 /*yield*/, db.players
                                            .find((_e = {},
                                            _e[name_1] = {
                                                $exists: true
                                            },
                                            _e))
                                            .sort((_f = {}, _f[name_1] = -1, _f))
                                            .skip(page_1 > 0 ? ((page_1 - 1) * nPerPage_1) : 0)
                                            .limit(nPerPage_1)
                                            .toArray()];
                                case 23:
                                    players = _o.sent();
                                    respond(createEmbed(players.map(function (player, i) { var _a, _b, _c; return "\n`#" + (i + 1 + (nPerPage_1 * (page_1 - 1))) + "` " + constants_1.Constants.ELO_EMOJIS[constants_1.Constants.ELO_ROLES.indexOf((_b = getRole((_a = player.elo) !== null && _a !== void 0 ? _a : 400)) === null || _b === void 0 ? void 0 : _b.id)] + " **" + player.minecraft.name + "** : " + ((_c = player[name_1]) !== null && _c !== void 0 ? _c : 0); }).join(""), "#228B22")
                                        .setTitle(prettyName + " | Page " + page_1 + "/" + pages));
                                    return [3 /*break*/, 25];
                                case 24:
                                    e_4 = _o.sent();
                                    logger.error("An error occurred while using the /leaderboard command:\n" + e_4.stack);
                                    respond(createEmbed("Something went wrong while requesting the leaderboard. Please try again later. If the issue persists, please contact a staff member.", "RED"));
                                    return [3 /*break*/, 25];
                                case 25: return [2 /*return*/];
                            }
                        });
                    }); });
                    client.on("voiceStateUpdate", function (oldState, newState) { return __awaiter(_this, void 0, void 0, function () {
                        var gameMembers, ids, queueChannel, game_1, textChannel_1, strike, gameNumber_1, logger_2, insertedId, index, textCategory, teamCallCategory, _a, _b, _c, _d, _e, _f, _g, _h, message, players_1, unregistered, unreg, msg, _j, asArray_1, cap1_1, cap2_1, team1_1, team2_1, firstPick_1, msg, g_1, user, chosen, g, _k, tc1_1, tc2_1, _l, _m, member, e_5_1, _o, _p, member, e_6_1, map_1, tookALongTime_1, timeout_1, e_7;
                        var _this = this;
                        var e_5, _q, e_6, _r;
                        return __generator(this, function (_s) {
                            switch (_s.label) {
                                case 0: return [4 /*yield*/, strikeEmbed()];
                                case 1:
                                    _s.sent();
                                    if (oldState.channelID === newState.channelID)
                                        return [2 /*return*/];
                                    if (!newState.channelID || !newState.channel)
                                        return [2 /*return*/];
                                    gameMembers = __spreadArrays(newState.channel.members.array());
                                    ids = gameMembers.map(function (mem) { return mem.id; });
                                    if (!constants_1.Constants.QUEUES_ARRAY.flat().includes(newState.channelID))
                                        return [2 /*return*/];
                                    if (gameMembers.length !== newState.channel.userLimit)
                                        return [2 /*return*/];
                                    _s.label = 2;
                                case 2:
                                    _s.trys.push([2, 47, , 48]);
                                    queueChannel = newState.channel;
                                    return [4 /*yield*/, utils_1.createNewGame()];
                                case 3:
                                    game_1 = _s.sent();
                                    return [4 /*yield*/, game_1.createChannels(gameMembers, queueChannel)];
                                case 4:
                                    textChannel_1 = (_s.sent()).textChannel;
                                    strike = {
                                        members: ids,
                                        timeOfLastPick: Date.now(),
                                        textChannelID: textChannel_1.id,
                                        voiceChannelID: newState.channelID,
                                        pickingOver: false
                                    };
                                    game_cache.push(strike);
                                    gameNumber_1 = game_1.gameNumber, logger_2 = game_1.logger, insertedId = game_1.id;
                                    index = Constants.QUEUES_ARRAY.findIndex(q => q.includes(queueChannel.id));
                                    return [4 /*yield*/, utils_1.findOpenCategory(constants_1.Constants.CATEGORY_ARRAY[index].map(function (cat) { return guild.channels.cache.get(cat); }))];
                                case 5:
                                    textCategory = _s.sent();
                                    return [4 /*yield*/, utils_1.findOpenCategory(constants_1.Constants.TEAM_CALLS.map(function (cat) { return guild.channels.cache.get(cat); }))];
                                case 6:
                                    teamCallCategory = _s.sent();
                                    if (!(textCategory && teamCallCategory)) {
                                        return [2 /*return*/, logger_2.warn('No category assigned.')];
                                    }
                                    return [4 /*yield*/, textChannel_1.setParent(textCategory)];
                                case 7:
                                    _s.sent();
                                    _b = (_a = Promise).all;
                                    _d = (_c = textChannel_1).overwritePermissions;
                                    _f = (_e = gameMembers.map(function (member) { return ({
                                        id: member.id,
                                        allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"]
                                    }); })).concat;
                                    _g = {};
                                    return [4 /*yield*/, bot_1.defaultGuild];
                                case 8: return [4 /*yield*/, _b.apply(_a, [[
                                            _d.apply(_c, [_f.apply(_e, [(_g.id = (_s.sent()).id,
                                                        _g.deny = ["VIEW_CHANNEL"],
                                                        _g)])])
                                        ]])["catch"](function () { return null; })];
                                case 9:
                                    _s.sent();
                                    return [4 /*yield*/, Promise.all([
                                            textChannel_1.send(gameMembers.join("")),
                                            utils_1.Players.getManyByDiscord(gameMembers.map(function (_a) {
                                                var id = _a.id;
                                                return id;
                                            })),
                                            db.games.updateOne({
                                                _id: insertedId
                                            }, {
                                                $set: {
                                                    textChannel: textChannel_1.id,
                                                    voiceChannel: queueChannel.id
                                                }
                                            }),
                                        ])];
                                case 10:
                                    _h = _s.sent(), message = _h[0], players_1 = _h[1];
                                    unregistered = gameMembers.filter(function (mem) { return !players_1.map(function (p) { return p.discord; }).includes(mem.id); });
                                    unreg = unregistered.length > 0 ? unregistered.join(' ') : '';
                                    if (!(8 !== players_1.size)) return [3 /*break*/, 12];
                                    msg = unreg + " **unregistered player(s)** are in your queue. Please make sure to register in " + guild.channels.cache.get(constants_1.Constants.REGISTER_CHANNEL) + " before queuing.\n\n**NOTE:** Please ensure that no unregistered/ingame player exists in the queue and that queues are currently open.";
                                    if (gameMembers.length < 8) {
                                        msg = "The **queues are not open** right now. Please be patient. Thank you! ";
                                    }
                                    message.channel.send(msg);
                                    _j = setTimeout;
                                    return [4 /*yield*/, game_1.cancel()];
                                case 11: return [2 /*return*/, _j.apply(void 0, [_s.sent(), 10000])];
                                case 12:
                                    asArray_1 = __spreadArrays(players_1.values());
                                    cap1_1 = asArray_1.splice(Math.floor(Math.random() * asArray_1.length), 1)[0];
                                    cap2_1 = asArray_1.splice(Math.floor(Math.random() * asArray_1.length), 1)[0];
                                    team1_1 = [cap1_1];
                                    team2_1 = [cap2_1];
                                    firstPick_1 = true;
                                    _s.label = 13;
                                case 13:
                                    if (!(asArray_1.length !== 0)) return [3 /*break*/, 15];
                                    if (game_1.state === games_1.GameState.VOID)
                                        return [3 /*break*/, 15];
                                    if (asArray_1.length === 1) {
                                        team2_1.push(asArray_1.shift());
                                        textChannel_1.send(createEmbed(undefined, "#00FFFF", "Team Picking for Game #" + gameNumber_1)
                                            .addFields({ name: 'Team 1', value: "`\u2022`Captain: <@" + cap1_1.discord + ">\n" + team1_1.slice(1).map(function (_a) {
                                                var discord = _a.discord;
                                                return "`\u2022` <@" + discord + ">";
                                            }).join("\n") }, { name: 'Team 2', value: "`\u2022`Captain: <@" + cap2_1.discord + ">\n" + team2_1.slice(1).map(function (_a) {
                                                var discord = _a.discord;
                                                return "`\u2022` <@" + discord + ">";
                                            }).join("\n") }));
                                        return [3 /*break*/, 13];
                                    }
                                    textChannel_1.send(createEmbed(undefined, "#00FFFF", "Team Picking for Game #" + gameNumber_1)
                                        .addFields({ name: 'Team 1', value: "`\u2022`Captain: <@" + cap1_1.discord + ">\n" + team1_1.slice(1).map(function (_a) {
                                            var discord = _a.discord;
                                            return "`\u2022` <@" + discord + ">";
                                        }).join("\n") }, { name: 'Team 2', value: "`\u2022`Captain: <@" + cap2_1.discord + ">\n" + team2_1.slice(1).map(function (_a) {
                                            var discord = _a.discord;
                                            return "`\u2022` <@" + discord + ">";
                                        }).join("\n") }, { name: 'Remaining Players', value: asArray_1.map(function (_a) {
                                            var discord = _a.discord;
                                            return "`\u2022` <@" + discord + ">";
                                        }).join("\n") }));
                                    textChannel_1.send("<@" + (firstPick_1 ? cap1_1.discord : cap2_1.discord) + ">").then(function (secondPing) { return secondPing["delete"]({ timeout: 50 })["catch"](function () { return logger_2.info("Failed to ping second captain."); }); })["catch"](function (e) { return logger_2.error("Failed to ping captain:\n" + e); });
                                    textChannel_1.send(createEmbed("<@" + (firstPick_1 ? cap1_1.discord : cap2_1.discord) + "> it is your turn to pick. Use `=p @user` to pick one of the remaining players!", "AQUA", "Team Picking for Game #" + gameNumber_1));
                                    return [4 /*yield*/, textChannel_1.awaitMessages(function (message) {
                                            var author = message.author, content = message.content;
                                            if (game_1.state === games_1.GameState.VOID) {
                                                asArray_1.splice(0, asArray_1.length);
                                                return false;
                                            }
                                            if (!(content.startsWith('=pick ') || content.startsWith('=p ') || content.startsWith('=P '))) {
                                                return false;
                                            }
                                            if (![cap1_1.discord, cap2_1.discord].includes(author.id)) {
                                                textChannel_1.send(createEmbed(author + " you are not a team captain.", "RED", "Team Picking for Game #" + gameNumber_1));
                                                return false;
                                            }
                                            if ((firstPick_1 ? cap2_1 : cap1_1).discord === author.id) {
                                                textChannel_1.send(createEmbed(author + ", it's the other captain's turn to pick right now.", "RED", "Team Picking for Game #" + gameNumber_1));
                                                return false;
                                            }
                                            if (!message.mentions.users.first()) {
                                                message.channel.send(createEmbed(author + ", you have to mention someone to pick them.", "RED", "Team Picking for Game #" + gameNumber_1));
                                                return false;
                                            }
                                            if (!asArray_1.map(function (_a) {
                                                var discord = _a.discord;
                                                return discord;
                                            }).includes(message.mentions.users.first().id)) {
                                                message.channel.send(createEmbed(author + ", you cannot pick a user who is already on a team or isn't in the game.", "RED", "Team Picking for Game #" + gameNumber_1));
                                                return false;
                                            }
                                            return true;
                                        }, { max: 1 })];
                                case 14:
                                    msg = (_s.sent()).first();
                                    if (!msg)
                                        return [3 /*break*/, 13];
                                    g_1 = game_cache.find(function (g) { return g.textChannelID === textChannel_1.id; });
                                    if (g_1)
                                        g_1.timeOfLastPick = Date.now();
                                    user = msg.mentions.users.first();
                                    chosen = players_1.get(user.id);
                                    asArray_1.splice(asArray_1.indexOf(chosen), 1);
                                    (firstPick_1 ? team1_1 : team2_1).push(chosen);
                                    firstPick_1 = !firstPick_1;
                                    return [3 /*break*/, 13];
                                case 15:
                                    if (team1_1.length !== 4 || team2_1.length !== 4) {
                                        return [2 /*return*/];
                                    }
                                    g = game_cache.find(function (g) { return g.textChannelID === textChannel_1.id; });
                                    if (g)
                                        g.pickingOver = true;
                                    return [4 /*yield*/, Promise.all([
                                            guild.channels.create("Team #1 - Game #" + gameNumber_1, {
                                                type: "voice",
                                                permissionOverwrites: team1_1.map(function (player) { return ({
                                                    id: player.discord,
                                                    allow: ["CONNECT", "SPEAK"]
                                                }); }),
                                                userLimit: team1_1.length
                                            }),
                                            guild.channels.create("Team #2 - Game #" + gameNumber_1, {
                                                type: "voice",
                                                permissionOverwrites: team2_1.map(function (player) { return ({
                                                    id: player.discord,
                                                    allow: ["CONNECT", "SPEAK"]
                                                }); }),
                                                userLimit: team2_1.length
                                            })
                                        ])];
                                case 16:
                                    _k = _s.sent(), tc1_1 = _k[0], tc2_1 = _k[1];
                                    game_1.setTeamChannels(tc1_1, tc2_1);
                                    return [4 /*yield*/, game_1.enterStartingState()];
                                case 17:
                                    _s.sent();
                                    return [4 /*yield*/, Promise.all([
                                            tc1_1.setParent(teamCallCategory),
                                            tc2_1.setParent(teamCallCategory),
                                        ])];
                                case 18:
                                    _s.sent();
                                    _s.label = 19;
                                case 19:
                                    _s.trys.push([19, 26, 27, 32]);
                                    _l = __asyncValues(team1_1.map(function (p1) { return guild.members.cache.get(p1.discord); }));
                                    _s.label = 20;
                                case 20: return [4 /*yield*/, _l.next()];
                                case 21:
                                    if (!(_m = _s.sent(), !_m.done)) return [3 /*break*/, 25];
                                    member = _m.value;
                                    return [4 /*yield*/, (member === null || member === void 0 ? void 0 : member.voice.setChannel(tc1_1.id)["catch"](function () { return logger_2.info('failed to send players to teams'); }))];
                                case 22:
                                    _s.sent();
                                    return [4 /*yield*/, utils_1.delay(200)];
                                case 23:
                                    _s.sent();
                                    _s.label = 24;
                                case 24: return [3 /*break*/, 20];
                                case 25: return [3 /*break*/, 32];
                                case 26:
                                    e_5_1 = _s.sent();
                                    e_5 = { error: e_5_1 };
                                    return [3 /*break*/, 32];
                                case 27:
                                    _s.trys.push([27, , 30, 31]);
                                    if (!(_m && !_m.done && (_q = _l["return"]))) return [3 /*break*/, 29];
                                    return [4 /*yield*/, _q.call(_l)];
                                case 28:
                                    _s.sent();
                                    _s.label = 29;
                                case 29: return [3 /*break*/, 31];
                                case 30:
                                    if (e_5) throw e_5.error;
                                    return [7 /*endfinally*/];
                                case 31: return [7 /*endfinally*/];
                                case 32:
                                    _s.trys.push([32, 39, 40, 45]);
                                    _o = __asyncValues(team2_1.map(function (p2) { return guild.members.cache.get(p2.discord); }));
                                    _s.label = 33;
                                case 33: return [4 /*yield*/, _o.next()];
                                case 34:
                                    if (!(_p = _s.sent(), !_p.done)) return [3 /*break*/, 38];
                                    member = _p.value;
                                    return [4 /*yield*/, (member === null || member === void 0 ? void 0 : member.voice.setChannel(tc2_1.id)["catch"](function () { return logger_2.info('failed to send players to teams'); }))];
                                case 35:
                                    _s.sent();
                                    return [4 /*yield*/, utils_1.delay(200)];
                                case 36:
                                    _s.sent();
                                    _s.label = 37;
                                case 37: return [3 /*break*/, 33];
                                case 38: return [3 /*break*/, 45];
                                case 39:
                                    e_6_1 = _s.sent();
                                    e_6 = { error: e_6_1 };
                                    return [3 /*break*/, 45];
                                case 40:
                                    _s.trys.push([40, , 43, 44]);
                                    if (!(_p && !_p.done && (_r = _o["return"]))) return [3 /*break*/, 42];
                                    return [4 /*yield*/, _r.call(_o)];
                                case 41:
                                    _s.sent();
                                    _s.label = 42;
                                case 42: return [3 /*break*/, 44];
                                case 43:
                                    if (e_6) throw e_6.error;
                                    return [7 /*endfinally*/];
                                case 44: return [7 /*endfinally*/];
                                case 45: return [4 /*yield*/, game_1.pickMap()];
                                case 46:
                                    map_1 = _s.sent();
                                    if (!map_1)
                                        throw new Error("pickMap returned nothing");
                                    if (game_1.state === games_1.GameState.VOID) {
                                        tc1_1["delete"]()["catch"](function () { return logger_2.info('Failed to delete tc1'); });
                                        return [2 /*return*/, tc2_1["delete"]()["catch"](function () { return logger_2.info('Failed to delete tc1'); })];
                                    }
                                    tookALongTime_1 = false;
                                    timeout_1 = setTimeout(function () {
                                        tookALongTime_1 = true;
                                        textChannel_1.send(createEmbed("No bots are currently available to assign to this game. Please be patient."))["catch"](function () { return logger_2.info('Failed to send in No bots are available message.'); });
                                    }, 5000);
                                    game_1.getAssignedBot().then(function (bot) {
                                        clearTimeout(timeout_1);
                                        textChannel_1.send(createEmbed(tookALongTime_1
                                            ? "We're sorry for the delay. The bot **" + bot + "** has been assigned to your game."
                                            : "The bot **" + bot + "** has been assigned to your game."))["catch"](function () { return logger_2.info('Failed to create `sorry for delay embed.`'); });
                                        if (game_1.state === games_1.GameState.VOID) {
                                            tc1_1["delete"]()["catch"](function () { return logger_2.info("Failed to delete tc1"); });
                                            tc2_1["delete"]()["catch"](function () { return logger_2.info("Failed to delete tc2"); });
                                            return;
                                        }
                                        logger_2.info(JSON.stringify(socket_1.bots) + (", size --> " + socket_1.bots.size));
                                        var _bot = socket_1.bots.get(bot);
                                        if (!_bot) {
                                            textChannel_1.send(createEmbed("Failed to bind to **" + bot + "**."))["catch"](function () { return logger_2.info("Failed to send 'Failed to bind bot message.'"); });
                                            utils_1.BotManager.release(bot);
                                            return game_1.cancel();
                                        }
                                        logger_2.info("Sending data: " + JSON.stringify(__spreadArrays(team1_1.map(function (player) { return player.toJSON(); }), team2_1.map(function (player) { return player.toJSON(); }))));
                                        _bot.once("gameCancel", function () { return __awaiter(_this, void 0, void 0, function () {
                                            var _a, e_8;
                                            return __generator(this, function (_b) {
                                                switch (_b.label) {
                                                    case 0:
                                                        _b.trys.push([0, 2, , 3]);
                                                        _a = setTimeout;
                                                        return [4 /*yield*/, game_1.cancel()];
                                                    case 1:
                                                        _a.apply(void 0, [_b.sent(), 10000]);
                                                        return [3 /*break*/, 3];
                                                    case 2:
                                                        e_8 = _b.sent();
                                                        logger_2.error("Bot failed to cancel game:\n" + e_8.stack);
                                                        return [3 /*break*/, 3];
                                                    case 3: return [2 /*return*/];
                                                }
                                            });
                                        }); });
                                        _bot.emit("gameStart", {
                                            players: __spreadArrays(team1_1.map(function (player) { return player.toJSON(); }), team2_1.map(function (player) { return player.toJSON(); })),
                                            map: map_1
                                        });
                                        game_1.start(team1_1, team2_1);
                                    });
                                    return [3 /*break*/, 48];
                                case 47:
                                    e_7 = _s.sent();
                                    logger.error("Failed to start a new game:\n" + e_7.stack);
                                    return [3 /*break*/, 48];
                                case 48: return [2 /*return*/];
                            }
                        });
                    }); });
                    client.on("message", function (message) {
                        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
                        return __awaiter(this, void 0, void 0, function () {
                            var ids, bot_2, _bot, hasPerms_1, msg_arr, user, finalelo, player, init_role, final_role, confirmation, msg, member_3, m, hasPerms_2, msg_arr, user, multiplier, number, player, duration, final_msg, member_4, _u, ch, m, reason, confirmation, hasPerms_3, msg_arr, gameId, db_1, game_2, players, gamePlayers_1, teams_1, op_1, e_9, hasPerms_4, msg_arr, user, number_of_strikes, heading, player, reason, isBot, response_id, m, _v, _w, _x, _y, _z, _0, _1, _2, confirmation, hasPerms_5, msg_arr, user, player, member_5, m, confirmation, hasPerms_6, g, game, deleteChannels, e_10;
                            var _this = this;
                            return __generator(this, function (_3) {
                                switch (_3.label) {
                                    case 0:
                                        if (!message.guild) {
                                            return [2 /*return*/];
                                        }
                                        if (constants_1.Constants.PMODIFY_VOID.CHANNELS.includes(message.channel.id) && message.content.startsWith('=win')) {
                                            ids = message.content.split(' ').slice(1);
                                            db.players.updateMany({
                                                "discord": {
                                                    $in: {
                                                        ids: ids
                                                    }
                                                }
                                            }, {});
                                        }
                                        if (message.channel.id === '805363821568065558' && message.content.startsWith('=restart') && message.content.split(' ').length > 1) {
                                            bot_2 = message.content.split(' ')[1];
                                            _bot = socket_1.bots.get(bot_2);
                                            if (!_bot)
                                                return [2 /*return*/, message.reply(bot_2 + " is not a valid bot.")];
                                            _bot.emit("restart");
                                            utils_1.BotManager.release(bot_2);
                                            return [2 /*return*/, message.reply(bot_2 + " successfully restarted.")];
                                        }
                                        if (!(constants_1.Constants.PMODIFY_VOID.CHANNELS.includes(message.channel.id) && message.content.toLowerCase().startsWith('=pmodify'))) return [3 /*break*/, 4];
                                        hasPerms_1 = false;
                                        (_a = message.member) === null || _a === void 0 ? void 0 : _a.roles.cache.forEach(function (role) {
                                            if (constants_1.Constants.PMODIFY_VOID.ROLES.includes(role.id)) {
                                                hasPerms_1 = true;
                                            }
                                        });
                                        if (!hasPerms_1) {
                                            return [2 /*return*/, message.channel.send(createEmbed(message.author + " you do not have the required permissions to run this command.", "RED", "RBW Ban Hammer!"))];
                                        }
                                        msg_arr = message.content.split(' ');
                                        if (msg_arr.length !== 3) {
                                            return [2 /*return*/, message.channel.send(createEmbed("Invalid Usage. Use `=pModify @user/user_id ±elo`", "RED", "Have fun scoring!"))];
                                        }
                                        user = message.mentions.users.first();
                                        if (!user) {
                                            user = client.users.cache.get(msg_arr[1]);
                                            if (!user) {
                                                return [2 /*return*/, message.channel.send(createEmbed("You need to `mention a user or provide a user id` to change their elo.", "RED", "Have fun scoring!"))];
                                            }
                                        }
                                        finalelo = parseInt(msg_arr[2]);
                                        if (Number.isNaN(finalelo)) {
                                            return [2 /*return*/, message.channel.send(createEmbed("Invalid Usage. `ELO must be specified as a Number.`"))];
                                        }
                                        return [4 /*yield*/, utils_1.Players.getByDiscord(user.id)];
                                    case 1:
                                        player = _3.sent();
                                        init_role = getRole((_b = player === null || player === void 0 ? void 0 : player.elo) !== null && _b !== void 0 ? _b : 400);
                                        if (!player) {
                                            return [2 /*return*/, message.channel.send(createEmbed(user + " is not registered.", "RED", "Have fun scoring!"))];
                                        }
                                        finalelo += player.elo;
                                        if (finalelo < 0) {
                                            return [2 /*return*/, message.channel.send(createEmbed(message.author + " you cannot remove `" + (finalelo - player.elo) + "` elo from " + user + " as they only have `" + (player === null || player === void 0 ? void 0 : player.elo) + "` elo remaining.", "RED", "Have fun scoring!"))];
                                        }
                                        final_role = getRole(finalelo);
                                        player === null || player === void 0 ? void 0 : player.update({ elo: finalelo });
                                        (_c = guild.members.cache.get(user.id)) === null || _c === void 0 ? void 0 : _c.setNickname("[" + finalelo + "] " + (player === null || player === void 0 ? void 0 : player.minecraft.name))["catch"](function (e) { return logger.error("Failed to update a new member's nickname:\n" + e.stack); });
                                        return [4 /*yield*/, message.reply("Game Scored successfully!")];
                                    case 2:
                                        confirmation = _3.sent();
                                        message["delete"]({ timeout: 50 });
                                        confirmation["delete"]({ timeout: 2000 });
                                        logger.info(init_role === null || init_role === void 0 ? void 0 : init_role.name);
                                        logger.info(final_role === null || final_role === void 0 ? void 0 : final_role.name);
                                        msg = '';
                                        if (init_role && final_role && init_role.id !== final_role.id) {
                                            msg = init_role + " \u2192 " + final_role;
                                            member_3 = guild.members.cache.get(user.id);
                                            member_3.roles.cache.forEach(function (role) { return __awaiter(_this, void 0, void 0, function () {
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            if (!constants_1.Constants.ELO_ROLES.includes(role.id)) return [3 /*break*/, 2];
                                                            return [4 /*yield*/, (member_3 === null || member_3 === void 0 ? void 0 : member_3.roles.remove(role))];
                                                        case 1:
                                                            _a.sent();
                                                            _a.label = 2;
                                                        case 2: return [2 /*return*/];
                                                    }
                                                });
                                            }); });
                                            member_3 === null || member_3 === void 0 ? void 0 : member_3.roles.add(final_role);
                                        }
                                        return [4 /*yield*/, guild.channels.cache.get(constants_1.Constants.PMODIFY_VOID.PMODIFY_RESPONSE_CHANNEL).send("" + user)];
                                    case 3:
                                        m = _3.sent();
                                        m.edit(createEmbed("**" + player.minecraft.name + "** [`" + player.elo + "` \u2192 `" + finalelo + "`] " + msg, "#228B22", "Have fun scoring!").addField("**Scorer Responsible:**", "" + message.author).setTitle('Manual Scoring'));
                                        _3.label = 4;
                                    case 4:
                                        if (!(constants_1.Constants.BAN_UNBAN.CHANNELS.includes(message.channel.id) && message.content.startsWith('=ban'))) return [3 /*break*/, 12];
                                        hasPerms_2 = false;
                                        (_d = message.member) === null || _d === void 0 ? void 0 : _d.roles.cache.forEach(function (role) {
                                            if (constants_1.Constants.BAN_UNBAN.ROLES.includes(role.id)) {
                                                hasPerms_2 = true;
                                            }
                                        });
                                        if (!hasPerms_2) {
                                            return [2 /*return*/, message.channel.send(createEmbed(message.author + " you do not have the required permissions to run this command.", "RED", "RBW Ban Hammer!"))];
                                        }
                                        msg_arr = message.content.split(' ');
                                        if (msg_arr.length < 3) {
                                            return [2 /*return*/, message.channel.send(createEmbed("Invalid Usage. `Use =ban @user/user_id x(h)/(d) [Reason: optional]`", "RED", "RBW Ban Hammer!"))];
                                        }
                                        user = message.mentions.users.first();
                                        if (!user) {
                                            user = client.users.cache.get(msg_arr[1]);
                                            if (!user) {
                                                return [2 /*return*/, message.channel.send(createEmbed(message.author + " you must mention a user to strike them.", "RED", "RBW Ban Hammer!"))];
                                            }
                                        }
                                        multiplier = msg_arr[2].slice(-1) === 'd' ? 24 : msg_arr[2].slice(-1) === 'h' ? 1 : undefined;
                                        if (!multiplier) {
                                            return [2 /*return*/, message.channel.send(createEmbed(message.author + " you must specify d for days or h for hours at the end of your message to specify ban duration.", "RED", "RBW Ban Hammer!"))];
                                        }
                                        if (multiplier < 0) {
                                            return [2 /*return*/, message.channel.send(createEmbed(message.author + " you must specify ban duration as a positive number.", "RED", "RBW Ban Hammer!"))];
                                        }
                                        number = parseFloat(msg_arr[2].substring(0, msg_arr[2].length - 1));
                                        if (Number.isNaN(number)) {
                                            return [2 /*return*/, message.channel.send(createEmbed("Invalid Usage. `Ban duration must be specified as a Integer/Decimal.`", "RED", "RBW Ban Hammer!"))];
                                        }
                                        return [4 /*yield*/, utils_1.Players.getByDiscord(user.id)];
                                    case 5:
                                        player = _3.sent();
                                        if (!player) {
                                            return [2 /*return*/, message.channel.send(createEmbed(user + " is not registered.", "RED", "RBW Ban Hammer!"))];
                                        }
                                        duration = multiplier * number * 60 * 60 * 1000;
                                        final_msg = msg_arr[2];
                                        if (duration === 0) {
                                            player.ban();
                                            final_msg = 'Full Season';
                                        }
                                        else {
                                            player.ban(duration);
                                        }
                                        member_4 = guild.members.cache.get(user.id);
                                        _3.label = 6;
                                    case 6:
                                        _3.trys.push([6, 8, , 9]);
                                        return [4 /*yield*/, (member_4 === null || member_4 === void 0 ? void 0 : member_4.roles.add(constants_1.Constants.RANKBANNED))];
                                    case 7:
                                        _3.sent();
                                        constants_1.Constants.ELO_ROLES.forEach(function (role) {
                                            if (member_4 === null || member_4 === void 0 ? void 0 : member_4.roles.cache.has(role)) {
                                                member_4.roles.remove(role);
                                            }
                                        });
                                        return [3 /*break*/, 9];
                                    case 8:
                                        _u = _3.sent();
                                        logger.info("Could not add Ban roles to " + (member_4 === null || member_4 === void 0 ? void 0 : member_4.displayName));
                                        return [3 /*break*/, 9];
                                    case 9:
                                        ch = message.author.id !== client.user.id ? constants_1.Constants.BAN_UNBAN.MANUAL_BAN_RESPONSE_CHANNEL : constants_1.Constants.BAN_UNBAN.AUTOMATIC_BAN_RESPONSE_CHANNEL;
                                        return [4 /*yield*/, guild.channels.cache.get(ch).send("" + user)];
                                    case 10:
                                        m = _3.sent();
                                        reason = msg_arr.splice(3).join(' ');
                                        if (reason === '') {
                                            m.edit(createEmbed("User: " + user + " \nDuration: " + final_msg, "#228B22", "RBW Ban Hammer").setTitle("Ban"));
                                        }
                                        else {
                                            m.edit(createEmbed("**User:** " + user + " \n**Duration:** " + final_msg + "\n**Reason:** " + reason, "#228B22", "RBW Ban Hammer").setTitle("Ban"));
                                        }
                                        return [4 /*yield*/, message.reply(user.username + " was banned successfully.")];
                                    case 11:
                                        confirmation = _3.sent();
                                        message["delete"]({ timeout: 50 });
                                        confirmation["delete"]({ timeout: 2000 });
                                        return [3 /*break*/, 20];
                                    case 12:
                                        if (!(constants_1.Constants.BAN_UNBAN.CHANNELS.includes(message.channel.id) && message.content.startsWith('=void'))) return [3 /*break*/, 20];
                                        hasPerms_3 = false;
                                        (_e = message.member) === null || _e === void 0 ? void 0 : _e.roles.cache.forEach(function (role) {
                                            if (constants_1.Constants.PMODIFY_VOID.ROLES.includes(role.id)) {
                                                hasPerms_3 = true;
                                            }
                                        });
                                        if (!hasPerms_3) {
                                            return [2 /*return*/, message.channel.send(createEmbed(message.author + " you do not have the required permissions to run this command.", "RED", "RBW Game Void"))["catch"](function () { return logger.info("Failed to send in no permissions embed."); })];
                                        }
                                        msg_arr = message.content.split(' ');
                                        if (msg_arr.length < 1) {
                                            return [2 /*return*/, message.channel.send(createEmbed("Invalid Usage. `Use =void gameId`", "RED", "RBW Game Void"))["catch"](function () { return logger.info("Failed to send in correct =void usage embed"); })];
                                        }
                                        gameId = parseInt(msg_arr[1]);
                                        if (Number.isNaN(gameId)) {
                                            return [2 /*return*/, message.channel.send(createEmbed("Invalid Usage. `Game ID must be specified as a Number.`", "RED", "RBW Game Void"))["catch"](function () { return logger.info("Failed to send in enter specific number embed"); })];
                                        }
                                        _3.label = 13;
                                    case 13:
                                        _3.trys.push([13, 18, , 19]);
                                        return [4 /*yield*/, database_1["default"]];
                                    case 14:
                                        db_1 = _3.sent();
                                        return [4 /*yield*/, db_1.games.find().skip(gameId - 1).limit(1).toArray()];
                                    case 15:
                                        game_2 = (_3.sent()).shift();
                                        if (!game_2)
                                            return [2 /*return*/, message.channel.send(createEmbed("Game not found. `Game " + gameId + " does not exist.`", "RED", "RBW Game Void"))["catch"](function () { return logger.info("Failed to send in game does not exist embed"); })];
                                        if (game_2.state === games_1.GameState.VOID)
                                            return [2 /*return*/, message.channel.send(createEmbed("Game already voided. `Game " + gameId + " is already voided.`", "RED", "RBW Game Void"))["catch"](function () { return logger.info("Failed to send in Game already voided message"); })];
                                        if (game_2.state !== games_1.GameState.FINISHED)
                                            return [2 /*return*/, message.channel.send(createEmbed("Game not finished. `Game " + gameId + " has not finished yet. Only finished games can be voided.`", "RED", "RBW Game Void"))["catch"](function () { return logger.info("Failed to send in only finished games can be voided embed"); })];
                                        return [4 /*yield*/, db_1.players.find({ "minecraft.name": { $in: __spreadArrays((_g = (_f = game_2.team1) === null || _f === void 0 ? void 0 : _f.players.map(function (_a) {
                                                        var username = _a.username;
                                                        return username;
                                                    })) !== null && _g !== void 0 ? _g : [], (_j = (_h = game_2.team2) === null || _h === void 0 ? void 0 : _h.players.map(function (_a) {
                                                        var username = _a.username;
                                                        return username;
                                                    })) !== null && _j !== void 0 ? _j : []) } }).toArray()];
                                    case 16:
                                        players = _3.sent();
                                        gamePlayers_1 = __spreadArrays((_l = (_k = game_2.team1) === null || _k === void 0 ? void 0 : _k.players) !== null && _l !== void 0 ? _l : [], (_o = (_m = game_2.team2) === null || _m === void 0 ? void 0 : _m.players) !== null && _o !== void 0 ? _o : []);
                                        teams_1 = new Map();
                                        (_p = game_2.team1) === null || _p === void 0 ? void 0 : _p.players.forEach(function (player) { return teams_1.set(player.username, 1); });
                                        (_q = game_2.team2) === null || _q === void 0 ? void 0 : _q.players.forEach(function (player) { return teams_1.set(player.username, 2); });
                                        op_1 = db_1.players.initializeUnorderedBulkOp();
                                        players.forEach(function (player) {
                                            var _a, _b, _c, _d, _e, _f;
                                            var _player = gamePlayers_1.find(function (_a) {
                                                var username = _a.username;
                                                return username === player.minecraft.name;
                                            });
                                            if (!_player)
                                                return;
                                            logger.info("_player --> " + JSON.stringify(_player));
                                            logger.info("player --> " + JSON.stringify(player));
                                            var member = guild.members.cache.get(player.discord);
                                            member === null || member === void 0 ? void 0 : member.setNickname("[" + (((_a = player.elo) !== null && _a !== void 0 ? _a : 400) - ((_b = _player.elo) !== null && _b !== void 0 ? _b : 0)) + "] " + player.minecraft.name)["catch"](function (_) { return null; });
                                            op_1.find({ "minecraft.name": player.minecraft.name }).updateOne({
                                                $inc: {
                                                    kills: ((_c = _player.kills) !== null && _c !== void 0 ? _c : 0) * -1,
                                                    deaths: ((_d = _player.deaths) !== null && _d !== void 0 ? _d : 0) * -1,
                                                    bedsBroken: _player.destroyedBed ? -1 : 0,
                                                    // If a player on the other team destroyed a bed, that means this player lost a bed this game.
                                                    bedsLost: ((_e = game_2[teams_1.get(player.minecraft.name) === 1 ? "team2" : "team1"]) === null || _e === void 0 ? void 0 : _e.players.some(function (p) { return p.destroyedBed; })) ? -1 : 0,
                                                    elo: ((_f = _player.elo) !== null && _f !== void 0 ? _f : 0) * -1
                                                }
                                            });
                                        });
                                        return [4 /*yield*/, Promise.all([
                                                op_1.execute(),
                                                db_1.games.updateOne({ _id: game_2._id }, {
                                                    $set: {
                                                        state: games_1.GameState.VOID
                                                    }
                                                })
                                            ])];
                                    case 17:
                                        _3.sent();
                                        message.reply("Game " + gameId + " has been voided successfully.")["catch"](function () { return logger.info("Failed to send in successful game void message"); });
                                        return [3 /*break*/, 19];
                                    case 18:
                                        e_9 = _3.sent();
                                        logger.error("Failed to void game " + gameId + " using the void command:\n" + e_9.stack);
                                        message.channel.send(createEmbed("Failed to void the game. `An error occurred.`", "RED", "RBW Game Void"))["catch"](function (_) { return null; });
                                        return [3 /*break*/, 19];
                                    case 19: return [2 /*return*/];
                                    case 20:
                                        if (!((constants_1.Constants.STRIKE_UNSTRIKE.CHANNELS.includes(message.channel.id) || constants_1.Constants.STRIKE_UNSTRIKE.CATEGORY_CHANNEL === message.channel.parentID) && message.content.startsWith('=strike'))) return [3 /*break*/, 31];
                                        hasPerms_4 = false;
                                        (_r = message.member) === null || _r === void 0 ? void 0 : _r.roles.cache.forEach(function (role) {
                                            if (constants_1.Constants.STRIKE_UNSTRIKE.ROLES.includes(role.id)) {
                                                hasPerms_4 = true;
                                            }
                                        });
                                        if (!hasPerms_4) {
                                            return [2 /*return*/, message.channel.send(createEmbed(message.author + " you do not have the required permissions to run this command.", "RED", "RBW Strikes Again!"))];
                                        }
                                        msg_arr = message.content.split(' ');
                                        if (msg_arr.length < 3) {
                                            return [2 /*return*/, message.channel.send(createEmbed("Invalid Usage. `Use =strike @user/user_id (\u00B1)strike(s) [Reason: Optional]`", "RED", "RBW Strikes Again!"))];
                                        }
                                        user = message.mentions.users.first();
                                        if (!user) {
                                            user = client.users.cache.get(msg_arr[1]);
                                            if (!user) {
                                                return [2 /*return*/, message.channel.send(createEmbed(message.author + " you must mention a user to strike them.", "RED", "RBW Strikes Again!"))];
                                            }
                                        }
                                        number_of_strikes = parseInt(msg_arr[2]);
                                        heading = void 0;
                                        if (Number.isNaN(number_of_strikes)) {
                                            return [2 /*return*/, message.channel.send(createEmbed("Invalid Usage. `Strike(s) must be specified as a Number.`"))];
                                        }
                                        else if (number_of_strikes < 0) {
                                            heading = 'Unstrike';
                                        }
                                        else {
                                            heading = 'Strike';
                                        }
                                        return [4 /*yield*/, utils_1.Players.getByDiscord(user.id)];
                                    case 21:
                                        player = _3.sent();
                                        if (!player) {
                                            return [2 /*return*/, message.channel.send(createEmbed(user + " is not registered.", "RED", "RBW Strikes Again!"))];
                                        }
                                        number_of_strikes += player.strikes;
                                        if (number_of_strikes < 0) {
                                            return [2 /*return*/, message.channel.send(createEmbed(message.author + " you cannot remove `" + (number_of_strikes - player.strikes) + "` strikes from " + user + " as they only have `" + (player === null || player === void 0 ? void 0 : player.strikes) + "` strikes.", "RED", "RBW Strikes Again!"))];
                                        }
                                        player === null || player === void 0 ? void 0 : player.update({ strikes: number_of_strikes });
                                        reason = msg_arr.slice(3).join(' ');
                                        isBot = message.author.id === client.user.id ? true : false;
                                        response_id = isBot ? constants_1.Constants.STRIKE_UNSTRIKE.AUTOSTRIKE_RESPONSE_CHANNEL : constants_1.Constants.STRIKE_UNSTRIKE.MANUALSTRIKE_RESPONSE_CHANNEL;
                                        return [4 /*yield*/, guild.channels.cache.get(response_id).send("" + user)];
                                    case 22:
                                        m = _3.sent();
                                        if (!(reason === '')) return [3 /*break*/, 26];
                                        if (!!isBot) return [3 /*break*/, 24];
                                        _w = (_v = m).edit;
                                        _x = createEmbed;
                                        _y = "**" + player.minecraft.name + "** [`" + player.strikes + "` \u2192 `" + number_of_strikes + "`]\n**ELO:** [`" + player.elo + "` \u2192 `";
                                        return [4 /*yield*/, player.strikeELO(heading)];
                                    case 23:
                                        _w.apply(_v, [_x.apply(void 0, [_y + (_3.sent()) + "`]\n**Staff Responsible:** " + message.author, "#228B22", "RBW " + heading + "s Again!"]).setTitle("" + heading)]);
                                        return [3 /*break*/, 25];
                                    case 24:
                                        m.edit(createEmbed("**" + player.minecraft.name + "** [`" + player.strikes + "` \u2192 `" + number_of_strikes + "`]", "#228B22", "RBW " + heading + "s Again!").setTitle("" + heading));
                                        _3.label = 25;
                                    case 25: return [3 /*break*/, 29];
                                    case 26:
                                        if (!!isBot) return [3 /*break*/, 28];
                                        _0 = (_z = m).edit;
                                        _1 = createEmbed;
                                        _2 = "**" + player.minecraft.name + "** [`" + player.strikes + "` \u2192 `" + number_of_strikes + "`]\n**ELO:** [`" + player.elo + "` \u2192 `";
                                        return [4 /*yield*/, player.strikeELO(heading)];
                                    case 27:
                                        _0.apply(_z, [_1.apply(void 0, [_2 + (_3.sent()) + "`]\n**Reason:** " + reason + "\n**Staff Responsible:** " + message.author, "#228B22", "RBW " + heading + "s Again!"]).setTitle("" + heading)]);
                                        return [3 /*break*/, 29];
                                    case 28:
                                        m.edit(createEmbed("**" + player.minecraft.name + "** [`" + player.strikes + "` \u2192 `" + number_of_strikes + "`]\n**Reason:** " + reason, "#228B22", "RBW " + heading + "s Again!").setTitle("" + heading));
                                        _3.label = 29;
                                    case 29:
                                        if (number_of_strikes < player.strikes) {
                                            return [2 /*return*/];
                                        }
                                        if (number_of_strikes >= 2) {
                                            guild.channels.cache.get(constants_1.Constants.COMMANDS_CHANNEL).send("=ban " + user + " " + utils_1.getBanDuration(player.strikes, Math.abs(number_of_strikes - player.strikes)) + " Autoban");
                                        }
                                        return [4 /*yield*/, message.reply(user + " was striked successfully.")];
                                    case 30:
                                        confirmation = _3.sent();
                                        message["delete"]({ timeout: 50 });
                                        confirmation["delete"]({ timeout: 2000 });
                                        return [3 /*break*/, 41];
                                    case 31:
                                        if (!(constants_1.Constants.BAN_UNBAN.CHANNELS.includes(message.channel.id) && message.content.startsWith('=unban'))) return [3 /*break*/, 36];
                                        hasPerms_5 = false;
                                        (_s = message.member) === null || _s === void 0 ? void 0 : _s.roles.cache.forEach(function (role) {
                                            if (constants_1.Constants.BAN_UNBAN.ROLES.includes(role.id)) {
                                                hasPerms_5 = true;
                                            }
                                        });
                                        if (!hasPerms_5) {
                                            return [2 /*return*/, message.channel.send(createEmbed(message.author + " you do not have the required permissions to run this command.", "RED", "RBW Strikes Again!"))];
                                        }
                                        msg_arr = message.content.split(' ');
                                        if (msg_arr.length !== 2) {
                                            return [2 /*return*/, message.channel.send(createEmbed("Invalid Usage. `Use =unban @user/user_id", "RED", "RBW Unban Hammer!"))];
                                        }
                                        user = message.mentions.users.first();
                                        if (!user) {
                                            user = client.users.cache.get(msg_arr[1]);
                                            if (!user) {
                                                return [2 /*return*/, message.channel.send(createEmbed(message.author + " you must mention a user to unban them.", "RED", "RBW Unban Hammer!"))];
                                            }
                                        }
                                        return [4 /*yield*/, utils_1.Players.getByDiscord(user.id)];
                                    case 32:
                                        player = _3.sent();
                                        if (!player) {
                                            return [2 /*return*/, message.channel.send(createEmbed(user + " is not registered.", "RED", "RBW Unban Hammer!"))];
                                        }
                                        if (!player.banned) {
                                            return [2 /*return*/, message.channel.send(createEmbed(user + " is not banned yet. Please use `=ban @user/user_id x(h)/(d)` in order to ban the player.", "RED", "RBW Unban Hammer!"))];
                                        }
                                        return [4 /*yield*/, player.unban()];
                                    case 33:
                                        _3.sent();
                                        member_5 = guild.members.cache.get(user.id);
                                        member_5 === null || member_5 === void 0 ? void 0 : member_5.roles.remove(constants_1.Constants.RANKBANNED)["catch"](function () { return logger.info("Could not remove Rank Banned Role from " + member_5.displayName); });
                                        member_5 === null || member_5 === void 0 ? void 0 : member_5.roles.add(getRole(player.elo))["catch"](function () { return logger.info("Could not add elo role for " + member_5.displayName); });
                                        return [4 /*yield*/, guild.channels.cache.get(constants_1.Constants.BAN_UNBAN.UNBAN_RESPONSE_CHANNEL).send("" + user)];
                                    case 34:
                                        m = _3.sent();
                                        if (message.author.id !== client.user.id) {
                                            m.edit(createEmbed(user + " has been unbanned!", "#228B22", "RBW Unban Hammer").setTitle("Unban"));
                                        }
                                        else {
                                            m.edit(createEmbed(user + " has been unbanned!", "#228B22", "RBW Unban Hammer").addField("**Staff Responsible:**", "" + message.author).setTitle("Unban"));
                                        }
                                        return [4 /*yield*/, message.reply(user.username + " was unbanned successfully.")];
                                    case 35:
                                        confirmation = _3.sent();
                                        message["delete"]({ timeout: 50 });
                                        return [2 /*return*/, confirmation["delete"]({ timeout: 2000 })];
                                    case 36:
                                        if (!(message.content === "=fclose" || message.content === "=forceclose")) return [3 /*break*/, 41];
                                        hasPerms_6 = false;
                                        (_t = message.member) === null || _t === void 0 ? void 0 : _t.roles.cache.forEach(function (role) {
                                            if (constants_1.Constants.FCLOSE_ROLES.includes(role.id)) {
                                                hasPerms_6 = true;
                                            }
                                        });
                                        if (!hasPerms_6) {
                                            return [2 /*return*/, message.channel.send(createEmbed(message.author + " you do not have the required permissions to run this command.", "RED", "RBW Game Management"))["catch"](function (_) { return null; })];
                                        }
                                        g = game_cache.findIndex(function (g) { return g.textChannelID === message.channel.id; });
                                        if (g !== -1)
                                            game_cache.splice(g, 1);
                                        game = utils_1.activeGames.find(function (_game) { var _a; return ((_a = _game.textChannel) === null || _a === void 0 ? void 0 : _a.id) === message.channel.id; });
                                        if (!game)
                                            return [2 /*return*/, message.channel.send(createEmbed("This channel is not bound to a currently active game.", "RED", "RBW Game Management"))["catch"](function (_) { return null; })];
                                        _3.label = 37;
                                    case 37:
                                        _3.trys.push([37, 39, , 40]);
                                        return [4 /*yield*/, game.cancel()];
                                    case 38:
                                        deleteChannels = _3.sent();
                                        deleteChannels();
                                        return [3 /*break*/, 40];
                                    case 39:
                                        e_10 = _3.sent();
                                        logger.error("Failed to run =fclose command:\n" + e_10.stack);
                                        return [3 /*break*/, 40];
                                    case 40:
                                        ;
                                        _3.label = 41;
                                    case 41: return [2 /*return*/];
                                }
                            });
                        });
                    });
                    client.on('guildMemberAdd', function (member) { return __awaiter(_this, void 0, void 0, function () {
                        var player;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, utils_1.Players.getByDiscord(member.id)];
                                case 1:
                                    player = (_a.sent());
                                    if (!player) return [3 /*break*/, 3];
                                    return [4 /*yield*/, member.roles.set(player.roles)];
                                case 2:
                                    _a.sent();
                                    _a.label = 3;
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    client.on('guildMemberRemove', function (member) { return __awaiter(_this, void 0, void 0, function () {
                        var player;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, utils_1.Players.getByDiscord(member.id)];
                                case 1:
                                    player = (_a.sent());
                                    if (player) {
                                        player.update({ roles: member.roles.cache.map(function (_a) {
                                                var id = _a.id;
                                                return id;
                                            }) });
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    logger.info("App is now online!");
                    setInterval(utils_1.Players.updateBans, 60 * 1000);
                    setInterval(function () {
                        var spliced = 0;
                        game_cache.forEach(function (g, index) {
                            if (!guild.channels.cache.has(g.textChannelID)) {
                                spliced++;
                                game_cache.splice(index, 1);
                            }
                        });
                        if (spliced !== 0)
                            logger.info("Removed --> " + spliced + " games from the cache.");
                    }, 10000);
                    return [2 /*return*/];
            }
        });
    });
}();
