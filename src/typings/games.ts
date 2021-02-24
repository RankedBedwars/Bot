import type { Message, User } from "discord.js";
import type { ObjectId } from "mongodb";
import type { Player } from "./players";

export interface Game {
    /** Game ID in the database. */
    _id: ObjectId;
    /** Text channel ID. */
    textChannel?: string;
    /** Voice channel ID. */
    voiceChannel?: string;

    team1?: Team;
    team2?: Team;

    /**
     * Represents the current state of this game.
     * @default GameState.PRE_GAME
     */
    state?: GameState;
}

export interface GamePlayer {
    /** Amount of kills obtained by the player this game. Updated after the end of the game. */
    kills?: number;
    /** Amount of deaths obtained by the player this game. Updated after the end of the game. */
    deaths?: number;
    /** If this player broke a bed this game. Updated after the end of the game. */
    destroyedBed?: boolean;
    /** Difference in ELO after the game. (Example: 500 -> 550 = 50) */
    elo?: number;
    /** Username of the player. */
    username: string;
    /** Winstreak of the player before this game. */
    winstreak: number;
    /** Bedstreak of the player before this game. */
    bedstreak: number;
    /** Discord ID of the GamePlayer */
    discord: string;
    oldRating?: number;
    newRating?: number;
}

export interface Team {
    winner?: boolean;
    players: GamePlayer[];
}

export interface gameMember {
    ids: string[];
    time: number;
}

export interface strikeCheck {
    textChannelID: string;
    timeOfLastPick: number;
    pickingOver: boolean;
    voiceChannelID: string;
    members: string[];
}

export interface helpCommand {
    user: User;
    message: Message;
    timeOfCreation: number;
}

export enum GameState {
    PRE_GAME,
    STARTING,
    ACTIVE,
    SCORING,
    FINISHED,
    VOID
}