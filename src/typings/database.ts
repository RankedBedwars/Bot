import type { Collection } from "mongodb";
import type { activeGame } from "./activeGame";
import type { Bot } from "./bot";
import type { Game } from "./games";
import type { Player } from "./players";

export interface Database {
    bots: Collection<Bot>;
    games: Collection<Game>;
    players: Collection<Player>;
    activeGame: Collection<activeGame>;
}