/** Log levels */
export type LogLevel = "log" | "warn" | "error";

/** The App environment */
export type Environment = "development" | "production";

export const APP_ENV: Environment =
  import.meta.env.VITE_APP_ENV === "production" ? "production" : "development";

export const LOG_LEVEL: LogLevel = APP_ENV === "production" ? "warn" : "log"

// export const URL_REGEX =
//   // /^(?:((?:[A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*)))?$/;
//   // /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi
  
export const URL_REGEX = /^(https?):\/\/.*$/;


