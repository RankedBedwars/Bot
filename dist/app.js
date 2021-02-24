"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const divisions_json_1 = __importDefault(require("./divisions.json"));
const canvas_1 = __importDefault(require("canvas"));
const { registerFont, createCanvas, loadImage } = canvas_1.default;
registerFont('./dist/fonts/Ubuntu-Bold.ttf', { family: 'Ubuntu' });
async function getImage(uuid, name, url, background, stats) {
    let canvas = createCanvas(480, 512);
    let ctx = canvas.getContext('2d');
    ctx.lineJoin = "round";
    ctx.lineWidth = 16;
    ctx.fillStyle = "#23272a";
    ctx.strokeStyle = "#23272a";
    ctx.fillRect(8, 8, 464, 496);
    ctx.strokeRect(8, 8, 464, 496);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = "30px Ubuntu";
    ctx.fillStyle = "#F1F1F2";
    ctx.fillText(`${name}${stats.emoji ? ` ${stats.emoji}` : ''}`, 8, 20);
    ctx.drawImage(await loadImage("./dist/images/logo.png"), 400, 8, 64, 24);
    ctx.fillStyle = "#2c2f33";
    ctx.strokeStyle = "#2c2f33";
    ctx.fillRect(16, 48, 448, 448);
    ctx.strokeRect(16, 48, 448, 448);
    if (/^#([0-9a-f]{3}){1,2}$/.test(background)) {
        ctx.fillStyle = background;
        ctx.fillRect(16, 48, 448, 272);
    }
    else {
        ctx.drawImage(await loadImage(background), 16, 48, 448, 272);
    }
    let division;
    for (let d of divisions_json_1.default.divisions) {
        if (d.min <= stats.elo) {
            if (d.max == -1 || stats.elo < d.max) {
                division = d;
                break;
            }
        }
    }
    if (division) {
        ctx.font = "36px Ubuntu";
        ctx.textAlign = 'center';
        ctx.fillStyle = division.color;
        ctx.fillText(division.name.toUpperCase(), 128, 88);
        ctx.font = "28px Ubuntu";
        ctx.fillStyle = "#F1F1F2";
        ctx.fillText("ELO " + stats.elo, 128, 120);
        let image = await loadImage(`./dist/images/divisions/${division.image}`);
        let width = image.width / (image.height / 120);
        ctx.drawImage(image, 128 - (width / 2), 148, width, 120);
        if (division.max != -1) {
            ctx.lineCap = "round";
            ctx.strokeStyle = "#191d20";
            ctx.beginPath();
            ctx.moveTo(48, 288);
            ctx.lineTo(212, 288);
            ctx.stroke();
            let percent = (stats.elo - division.min) / (division.max - division.min);
            if (percent == 0) {
                ctx.textAlign = 'left';
                ctx.font = "16px Ubuntu";
                ctx.fillStyle = "#F1F1F2";
                ctx.fillText("0%", 44, 287);
            }
            else {
                let distance = Math.ceil(164 * percent);
                ctx.lineWidth = 10;
                ctx.strokeStyle = "#F1F1F2";
                ctx.beginPath();
                ctx.moveTo(48, 288);
                ctx.lineTo(48 + distance, 288);
                ctx.stroke();
                ctx.font = "12px Ubuntu";
                let text = (percent * 100).toFixed(0) + "%";
                if (distance + ctx.measureText(text).width < 164) {
                    ctx.textAlign = 'left';
                    ctx.fillStyle = "#F1F1F2";
                    ctx.fillText(text, 54 + distance, 287);
                }
                else {
                    ctx.font = "10px Ubuntu";
                    ctx.textAlign = 'right';
                    ctx.fillStyle = "#191d20";
                    ctx.fillText(text, 50 + distance, 287);
                }
            }
        }
    }
    ctx.drawImage(await loadImage(`https://visage.surgeplay.com/front/256/${uuid}`), 216, 64, 256, 256);
    ctx.fillStyle = "#191d20";
    ctx.fillRect(16, 328, 448, 168);
    let total = stats.wins + stats.losses;
    ctx.fillStyle = "#F1F1F2";
    ctx.textAlign = "center";
    ctx.font = "20px Ubuntu";
    let text = `${total}G ${stats.wins}W ${stats.losses}L`;
    if (ctx.measureText(text).width > 128) {
        ctx.font = "16px Ubuntu";
    }
    ctx.fillText(text, 84, 472);
    if (total == 0) {
        ctx.strokeStyle = "#363942";
        ctx.beginPath();
        ctx.arc(84, 396, 48, 0, Math.PI * 2);
        ctx.stroke();
    }
    else {
        let won = stats.wins / total;
        ctx.lineWidth = 16;
        ctx.lineCap = "butt";
        if (won == 1) {
            ctx.strokeStyle = "#00ADEE";
            ctx.beginPath();
            ctx.arc(84, 396, 48, 0, Math.PI * 2);
            ctx.stroke();
        }
        else {
            let start = -(Math.PI / 2);
            let split = start + ((1 - won) * Math.PI * 2);
            ctx.strokeStyle = "#00ADEE";
            ctx.beginPath();
            ctx.arc(84, 396, 48, split, start);
            ctx.stroke();
            ctx.strokeStyle = "#c53829";
            ctx.beginPath();
            ctx.arc(84, 396, 48, start, split);
            ctx.stroke();
        }
        ctx.font = "24px Ubuntu";
        ctx.fillText((won * 100).toFixed(0) + "%", 84, 396);
    }
    let colors = {
        red: "#F54D4D",
        yellow: "#F9C02A",
        green: "#2EA94A"
    };
    drawStats(152, 344, 316, 448, [
        {
            name: "Beds Broken",
            value: stats.bedsBroken || '0'
        }, {
            name: "Beds Lost",
            value: stats.bedsLost || '0'
        },
        {
            name: "Bed Streak",
            value: stats.bedstreak || '0',
            color: (value) => value == 0 ? colors.red : value <= 1 ? colors.yellow : colors.green
        }, {
            name: "Win Streak",
            value: stats.winstreak || '0',
            color: (value) => value == 0 ? colors.red : value <= 3 ? colors.yellow : colors.green
        }, {
            name: "Lose Streak",
            value: stats.losestreak || '0',
            color: (value) => value == 0 ? colors.green : value <= 3 ? colors.yellow : colors.red
        }
    ]);
    drawStats(324, 344, 456, 448, [
        {
            name: "Kills",
            value: stats.kills
        }, {
            name: "Deaths",
            value: stats.deaths
        },
        {
            name: "K/D",
            value: ((stats.kills / stats.deaths) || 0).toFixed(1),
            color: (value) => value <= 0.4 ? colors.red : value <= 0.9 ? colors.yellow : colors.green
        }, {
            name: "K/Game",
            value: ((stats.kills / total) || 0).toFixed(1),
            color: (value) => value < 2 ? colors.red : value < 5 ? colors.yellow : colors.green
        }
    ]);
    function drawStats(minX, minY, maxX, maxY, values) {
        let offsetY = Math.ceil((maxY - minY) / (values.length - 1));
        ctx.font = "20px Ubuntu";
        ctx.textAlign = "left";
        ctx.fillStyle = "#7d7d7d";
        for (var i = 0; i < values.length; i++) {
            ctx.fillText(values[i].name, minX, minY + (offsetY * i));
        }
        ctx.textAlign = "right";
        ctx.fillStyle = "#F1F1F2";
        for (var i = 0; i < values.length; i++) {
            let statistic = values[i];
            if (statistic.color) {
                ctx.save();
                ctx.fillStyle = statistic.color(statistic.value);
            }
            ctx.fillText(statistic.value, maxX, minY + (offsetY * i));
            if (statistic.color) {
                ctx.restore();
            }
        }
    }
    if (url == null)
        url = "discord.gg/rbw";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "22px Ubuntu";
    const width = ctx.measureText(url).width;
    if (width < 300) {
        ctx.fillText(url, 307, 480);
    }
    else {
        ctx.font = '12px Ubuntu';
        let width = 0, i = -1, line = 0;
        const strings = ['', ''];
        while (width < 300 && url.length > ++i) {
            strings[line] += url[i];
            width = ctx.measureText(strings[line]).width;
            if (width > 300) {
                strings[line] = strings[line].slice(0, -1);
                ++line;
                --i;
                width = 0;
                if (line > 1)
                    break;
            }
        }
        ctx.fillText(strings.join('\n'), 305, 470);
    }
    return canvas.toBuffer('image/png');
}
exports.default = getImage;
