export function color(text: string, color: number = 0){
    return `\x1b[${color}m${text}\x1b[0m`;
}

export enum Color {
    INFO = 90,
    WARN = 33,
    ERROR = 91,
}

export default class Logger {
    constructor(private identifier: string){}

    info(message: any){
        console.log(color(`[${this.identifier}/INFO] ${message}`, Color.INFO));
    }

    warn(message: any){
        console.warn(color(`[${this.identifier}/WARN] ${message}`, Color.WARN));
    }

    error(message: any){
        console.error(color(`[${this.identifier}/ERROR] ${message}`, Color.ERROR));
    }
}