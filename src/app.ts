import divisions from './divisions.json';
import canvas from 'canvas';

const { registerFont, createCanvas, loadImage } = canvas;

registerFont('./dist/fonts/Ubuntu-Bold.ttf', { family: 'Ubuntu' });

export default async function getImage(uuid: string, name: string, url: string, background: string, stats: any) {
  let canvas = createCanvas(480, 512);
  let ctx = canvas.getContext('2d');

  ctx.lineJoin = "round";
  ctx.lineWidth = 16;

  //  Background 1
  ctx.fillStyle = "#23272a";
  ctx.strokeStyle = "#23272a";
  ctx.fillRect(8, 8, 464, 496);
  ctx.strokeRect(8, 8, 464, 496);

  //  Name
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = "30px Ubuntu";
  ctx.fillStyle = "#F1F1F2";
  ctx.fillText(`${name}${stats.emoji ? ` ${stats.emoji}` : ''}`, 8, 20);

  //  Logo
  ctx.drawImage(await loadImage("./dist/images/logo.png"), 400, 8, 64, 24);

  //  Background 2
  ctx.fillStyle = "#2c2f33";
  ctx.strokeStyle = "#2c2f33";
  ctx.fillRect(16, 48, 448, 448);
  ctx.strokeRect(16, 48, 448, 448);

  //  Card 1
  if (/^#([0-9a-f]{3}){1,2}$/.test(background)) {
    ctx.fillStyle = background;
    ctx.fillRect(16, 48, 448, 272);
  } else {
    ctx.drawImage(await loadImage(background), 16, 48, 448, 272);
  }

  //  Elo Division
  let division;

  for (let d of divisions.divisions) {
    if (d.min <= stats.elo) {
      if (d.max == -1 || stats.elo < d.max) {
        division = d;
        break;
      }
    }
  }

  if (division) {
    //  Elo Division Name
    ctx.font = "36px Ubuntu";
    ctx.textAlign = 'center';
    ctx.fillStyle = division.color;
    ctx.fillText(division.name.toUpperCase(), 128, 88);

    //  Elo Number
    ctx.font = "28px Ubuntu";
    ctx.fillStyle = "#F1F1F2";
    ctx.fillText("ELO " + stats.elo, 128, 120);

    //  Elo Division Image
    let image = await loadImage(`./dist/images/divisions/${division.image}`);
    let width = image.width / (image.height / 120);
    ctx.drawImage(image, 128 - (width / 2), 148, width, 120);

    //  Elo Progress Bar
    if (division.max != -1) {
      //  Draw Outer
      ctx.lineCap = "round";
      ctx.strokeStyle = "#191d20";
      ctx.beginPath();
      ctx.moveTo(48, 288);
      ctx.lineTo(212, 288);
      ctx.stroke();

      let percent = (stats.elo - division.min) / (division.max - division.min);
      if (percent == 0) {
        //  Draw only the text
        ctx.textAlign = 'left';
        ctx.font = "16px Ubuntu";
        ctx.fillStyle = "#F1F1F2";
        ctx.fillText("0%", 44, 287); //  287 aligns better than 288 for some reason?
      } else {
        let distance = Math.ceil(164 * percent);  //  Math.ceil because canvas likes whole numbers

        //  Draw Inner
        ctx.lineWidth = 10;
        ctx.strokeStyle = "#F1F1F2";
        ctx.beginPath();
        ctx.moveTo(48, 288);
        ctx.lineTo(48 + distance, 288);
        ctx.stroke();

        //  Percentage Text
        ctx.font = "12px Ubuntu";
        let text = (percent * 100).toFixed(0) + "%";

        if (distance + ctx.measureText(text).width < 164) { //  Hide the text if it will not fit
          ctx.textAlign = 'left';
          ctx.fillStyle = "#F1F1F2";
          ctx.fillText(text, 54 + distance, 287); //  287 aligns better than 288 for some reason?
        } else {
          ctx.font = "10px Ubuntu";
          ctx.textAlign = 'right';
          ctx.fillStyle = "#191d20";
          ctx.fillText(text, 50 + distance, 287); //  287 aligns better than 288 for some reason?
        }
      }
    }
  }

  //  Player Image
  ctx.drawImage(await loadImage(`https://visage.surgeplay.com/front/256/${uuid}`), 216, 64, 256, 256);

  //  Card 2
  ctx.fillStyle = "#191d20";
  ctx.fillRect(16, 328, 448, 168);

  //  Win/Loss Section
  let total = stats.wins + stats.losses;

  //  Amount Text
  ctx.fillStyle = "#F1F1F2";
  ctx.textAlign = "center";
  ctx.font = "20px Ubuntu";
  let text = `${total}G ${stats.wins}W ${stats.losses}L`;

  if (ctx.measureText(text).width > 128) { //  If it is too big
    ctx.font = "16px Ubuntu";
  }

  ctx.fillText(text, 84, 472);

  if (total == 0) {
    //  Draw a gray circle if 0 games played
    ctx.strokeStyle = "#363942";
    ctx.beginPath();
    ctx.arc(84, 396, 48, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    let won = stats.wins / total;

    ctx.lineWidth = 16;
    ctx.lineCap = "butt";

    if (won == 1) {
      //  If 100% winrate, draw only the win circle
      ctx.strokeStyle = "#00ADEE";
      ctx.beginPath();
      ctx.arc(84, 396, 48, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      let start = -(Math.PI / 2);
      let split = start + ((1 - won) * Math.PI * 2);

      //  Winning Part
      ctx.strokeStyle = "#00ADEE";
      ctx.beginPath();
      ctx.arc(84, 396, 48, split, start);
      ctx.stroke();

      //  Losing Part
      ctx.strokeStyle = "#c53829";
      ctx.beginPath();
      ctx.arc(84, 396, 48, start, split);
      ctx.stroke();
    }

    //  Percentage Text
    ctx.font = "24px Ubuntu";
    ctx.fillText((won * 100).toFixed(0) + "%", 84, 396);
  }

  let colors = {
    red: "#F54D4D",
    yellow: "#F9C02A",
    green: "#2EA94A"
  }

  //  Left Stats
  drawStats(152, 344, 316, 448, [
    {
        name: "Beds Broken",
        value: stats.bedsBroken || '0'
    }, {
        name: "Beds Lost",
        value: stats.bedsLost || '0'
    }, {
        name: "Bed Streak",
        value: stats.bedstreak || '0',
        color: (value: number) => value == 0 ? colors.red : value <= 1 ? colors.yellow : colors.green
    }, {
        name: "Win Streak",
        value: stats.winstreak || '0',
        color: (value: number) => value == 0 ? colors.red : value <= 3 ? colors.yellow : colors.green
    }, {
        name: "Lose Streak",
        value: stats.losestreak || '0',
        color: (value: number) => value == 0 ? colors.green : value <= 3 ? colors.yellow : colors.red
    }
  ]);

  //  Right Stats
  drawStats(324, 344, 456, 448, [
    {
        name: "Kills",
        value: stats.kills
    }, {
        name: "Deaths",
        value: stats.deaths
    }, {
        name: "K/D",
        value: ((stats.kills / stats.deaths) || 0).toFixed(1),
        color: (value: number) => value <= 0.4 ? colors.red : value <= 0.9 ? colors.yellow : colors.green
    }, {
        name: "K/Game",
        value: ((stats.kills / total) || 0).toFixed(1),
        color: (value: number) => value < 2 ? colors.red : value < 5 ? colors.yellow : colors.green
    }
  ]);

  function drawStats(minX: number, minY: number, maxX: number, maxY: number, values: any) {
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

  //  Custom Text
  if (url == null) url = "discord.gg/rbw";  //  Default it

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "22px Ubuntu";

  const width = ctx.measureText(url).width;

  if (width < 300) {
    ctx.fillText(url, 307, 480);
  } else {
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

        if (line > 1) break;
      }
    }

    ctx.fillText(strings.join('\n'), 305, 470);
  }

  return canvas.toBuffer('image/png');
}