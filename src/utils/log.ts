import consola from "consola";

export const log = {
	info: (...args: any[]) => consola.info(args),
	error: (...args: any[]) => consola.error(args),
	warn: (...args: any[]) => consola.warn(args),
	debug: (...args: any[]) => consola.debug(args),
	success: (...args: any[]) => consola.success(args),
};
