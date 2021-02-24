import type { ObjectId } from "mongodb";

export interface Bot {
    _id?: ObjectId;
    username: string;
    assignedGame?: ObjectId;
    uuid: string;
}