import { eq } from "drizzle-orm";
import { db } from "../db";
import { logTable } from "../db/schema/log";

export const createLog = async ({
	url,
	depth = 1,
	options,
	files,
	status = "pending",
	error,
}: {
	url: string;
	depth?: number;
	options?: string;
	files?: string[];
	status?: "pending" | "success" | "error";
	error?: string;
}) => {
	if (!url) {
		throw new Error("URL is required");
	}
	const result = await db
		.insert(logTable)
		.values({
			url,
			depth,
			options,
			files: files ? JSON.stringify(files) : undefined,
			status,
			error,
		})
		.returning({ id: logTable.id });
	return result[0]?.id ?? -1;
};

export const updateLog = async ({
	id,
	files,
	status,
	error,
}: {
	id: number;
	files?: string[];
	status: "success" | "error";
	error?: string;
}) => {
	const result = await db
		.update(logTable)
		.set({
			status,
			error,
			files: files ? JSON.stringify(files) : undefined,
		})
		.where(eq(logTable.id, id));
	return result;
};
