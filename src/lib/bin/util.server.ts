import { existsSync } from "fs";
import path from "path";

export const hasRunInitCommand = () => {
    const projectRoot = process.cwd();
    return (
        existsSync(path.resolve(projectRoot, './.env')) &&
        existsSync(path.resolve(projectRoot, './drizzle.config.ts')) &&
        existsSync(path.resolve(projectRoot, './src/lib/server/schema.ts')) &&
        existsSync(path.resolve(projectRoot, './db')) &&
        existsSync(path.resolve(projectRoot, './src/config'))
    );
};