import type { ObjectId } from "mongodb";

export interface activeGame {
    _id: ObjectId;
    gameNumber: number;
    botIGN?: string;
    textChannel?: string;
    team1Channel?: string;
    team2Channel?: string;
}