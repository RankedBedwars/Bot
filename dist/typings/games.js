"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameState = void 0;
var GameState;
(function (GameState) {
    GameState[GameState["PRE_GAME"] = 0] = "PRE_GAME";
    GameState[GameState["STARTING"] = 1] = "STARTING";
    GameState[GameState["ACTIVE"] = 2] = "ACTIVE";
    GameState[GameState["SCORING"] = 3] = "SCORING";
    GameState[GameState["FINISHED"] = 4] = "FINISHED";
    GameState[GameState["VOID"] = 5] = "VOID";
})(GameState = exports.GameState || (exports.GameState = {}));
