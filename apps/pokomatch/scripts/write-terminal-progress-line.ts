import type { WriteStream } from "node:tty";

/** ANSI EL0: erase from cursor through end of line (needed after `\r` overwrites). */
const CLEAR_TO_EOL = "\x1b[K";

export function writeTerminalProgressLine(stream: WriteStream, text: string): void {
  stream.write(`\r${text}${CLEAR_TO_EOL}`);
}
