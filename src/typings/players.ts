import type { ObjectId } from "mongodb";

export interface Player {
    /** Player ID in the database. */
    _id: ObjectId;
    /** Discord ID of the player. */
    discord: string;
    /** Linked Minecraft account of the player. */
    minecraft: {
        /** Minecraft UUID (without dashes) of the player. */
        uuid: string;
        /** Minecraft username of the player. */
        name: string;
    };
    /** Time the player registered. */
    registeredAt: number;
    /** Amount of matches this player has won. */
    wins?: number;
    /** Amount of matches this player has lost. */
    losses?: number;
    /** Amount of beds this player has broken. */
    bedsBroken?: number;
    /** Amount of beds this player has lost. */
    bedsLost?: number;
    /** Kills this player has gotten. */
    kills: number;
    /** Deaths this player has gotten. */
    deaths: number;
    /** Player ELO. */
    elo?: number;
    /** Player Roles. */
    roles?: string[];
    /** Time ranked ban expires. */
    banExpires?: number;
    /** Player Strikes. */
    strikes?: number;
    /** Total games played. Defaults to 1. */
    games?: number;
    /** Current winstreak of the player. */
    winstreak?: number;
    /** Current bedstreak of the player. */
    bedstreak?: number;
    rank?: string;
    inviter?: string;
    status?: number;
    team?: string;
    messages: { [key: number]: string };
    winMessage?: string;
    loseMessage?: string;

    info_card_text: string;
    info_card_background: string;
    emoji: string;
}