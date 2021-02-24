import type { Player } from "./players";

export namespace SocketAPI {

    export interface Query {
        key: string;
        bot: string;
    }

    export interface GameFinishPayload {
        bot: string;
        players: Player[];
    }

}