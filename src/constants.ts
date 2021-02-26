import Logger from "./logger";

const logger = new Logger("Constants");

const { GUILD } = process.env;
if(!GUILD){
    logger.error("Required environment variable GUILD is not defined.");
    process.exit(1);
}

export namespace Constants {
    export const DISCORD_API_BASE_URL = "https://discord.com/api/v8";
    export const BRANDING_URL = "https://i.imgur.com/Nk0fcf8.jpg";
    export const ELO_ROLES = ['799565018488111124', '799565017753452544', '799565017074368543', '799565017049202728', '799565016339578880', '799565016247304242', '799565015165435904', '799565014490546224', '799565013927854100', '799565012892778496', '799565012137148416', '799565012079345666', '799565010505433088', '799565008546955284', '799565639203291136', '799565642835427338', '799565638187876352', '799565637638684682', '799565637445615656'];
    export const ELO_EMOJIS = ["<:Coal1:799880290473476136>", "<:Coal2:799880290478718976>", "<:Coal3:799880290658418698>", "<:Coal4:799880290822651944>", "<:Iron1:799880308118781952>", "<:Iron2:799880308304379925>", "<:Iron3:799880308450131988>", "<:Iron4:799880353564983337>", "<:Gold1:799880371860144189>", "<:Gold2:799880371915194368>", "<:Gold3:799880396325126144>", "<:Gold4:799880404383039538>", "<:Platinum1:799880427773886484>", "<:Platinum2:799880513086947400>", "<:Platinum3:799880513401651210>", "<:Platinum4:799880532477345823>", "<:Emerald:799880584670609408>", "<:Diamond:799880592447635486>", "<:Obsidian:799880609304150026>"];
    export const RANKBANNED = '660282736506044431';

    export const QUEUES_ARRAY: string[][] = [['813109732226236466']];
    export const CATEGORY_ARRAY: string[][] = [['813111605385494568']];
    export const WAITING_ROOM: string = '813110856774058085';
    export const REGISTERED_ROLE: string = '813056564351991838';
    export const COMMANDS_CHANNEL: string = '813165778190598165';
    export const GAME_REPORT_CHANNEL: string = '813111418173915177';
    export const TEAM_CALLS: string[] = ['813187049887760385'];

    // 0, 1, 2, 3, 4, 5, 6, 7 go to CATEGORY_ARRAY[0];
    //export const QUEUES_ARRAY: string[][] = [['799638168315363388', '801116565625896991', '801116586420863006', '801116605832364032', '801116664313544724'], ['801116703005868072', '801116737918468117'], ['799638338242871306', '799638379377065994']]//['799638168315363388', '801116499292061726', '801116565625896991', '801116586420863006', '801116605832364032', '801116664313544724', '801116703005868072', '801116737918468117', '799638297281953803', '799638338242871306', '799638379377065994', '799724435963510785']; 
    //export const CATEGORY_ARRAY: string[][] = [['800798660433936399', '800798522688798721', '799630484224737282', '800798812485451816'], ['799637539182346270'], ['799637590797975562'], ['799637704463220746'], ['800073205531803688']];
    //export const GAME_REPORT_CHANNEL: string = '799653079225204796';
    //export const COMMANDS_CHANNEL: string = '706243823193423872';
    //export const WAITING_ROOM: string = '800043232737230869';
    //export const REGISTERED_ROLE: string = '802381365663629353';
    export const UNREGISTERED_ROLE: string = '708472957206265947';
    export const REGISTER_CHANNEL: string = '795037960881569793';
    export const STAFF_COMMANDS_CHANNEL: string = '706243823193423872';
    export const CHANNELS_FOR_SLASH_COMMANDS: string[] = ['799897234128764958', '706243823193423872', '788854531294363648', '739583286635921620'];
    //export const TEAM_CALLS: string[] = ['799637250647261194', '800997325954613290'];
    export const CHAT = '794789691147943986';
    export const SUPPORT_ROLE_ID = '808752160262979605';

    export const BAN_UNBAN = {  
        ROLES: ['808738425758023772', '806695084624052264', '806695084543180831', '808090916827955200', '806695074871509012', '806695067640135742'],
        CHANNELS: ['799624240831528961', '706243823193423872', '793238295164223538', '799897234128764958', '788854531294363648', '795878364480405554'],
        //CHANNELS: ['813165778190598165'],
        MANUAL_BAN_RESPONSE_CHANNEL: '799624240831528961',
        AUTOMATIC_BAN_RESPONSE_CHANNEL: '796641174558605322',
        UNBAN_RESPONSE_CHANNEL: '799649578366402570',
    }

    export const STRIKE_UNSTRIKE = {
        ROLES: [`809284694231351327`, `808752160262979605`, `806695084624052264`, `806695084543180831`, '808090916827955200', '806695074871509012', '806695067640135742'],
        CHANNELS: [`799625010532712518`, `706243823193423872`, `799897234128764958`, `788854531294363648`, '795878364480405554', '796683688615608369'],
        //CHANNELS: ['813165778190598165'],
        CATEGORY_CHANNEL: '765184272042033162',
        AUTOSTRIKE_RESPONSE_CHANNEL: '796683688615608369',
        MANUALSTRIKE_RESPONSE_CHANNEL: '799625010532712518',
    }

    export const PMODIFY_VOID = {  
        ROLES: ['809624614317588513', '806695084624052264', '806695084543180831', '808090916827955200', '806695074871509012', '806695067640135742'],
        CHANNELS: ['799653079225204796', '799625010532712518', '765184272042033162', '706243823193423872', '799897234128764958', '788854531294363648', '795878364480405554', '808366398728044614'],
        PMODIFY_RESPONSE_CHANNEL: '813057706613145600',
        VOID_RESPONSE_CHANNEL: '799653079225204796',
    }

    export const FCLOSE_ROLES = ["801187544267489330", "806695084543180831", "808090916827955200", "806695074871509012", "806695067640135742"];
    export const CLIENT_ID = '795803974484885504';

    export const STRIKE_VIEW = {
        ROLES: ['759851084109447188', '688981950295572643', '806704803907895297', '602271058216878123', '806704801773387806', '760166846422450259', '808735875336765480', '604014662878625809']
    };
}