import fs, { symlinkSync } from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import child_process from 'child_process';
import utils from './utils.js';
const __dirname = dirname(fileURLToPath(import.meta.url));

const git_path = path.join(__dirname, 'bobbycar-boardcomputer-firmware');

export async function generateListing() { // json file tree
    const builds = {};
    const files = path.join(__dirname, 'builds');
    const dirs = fs.readdirSync(files, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    for (const dir of dirs) {
        const files = fs.readdirSync(path.join(__dirname, 'builds', dir), { withFileTypes: true })
            .filter(dirent => dirent.isFile())
            .map(dirent => {
                const _object = filename_to_object(dirent.name);
                const stats = fs.statSync(path.join(__dirname, 'builds', dir, dirent.name));
                return {
                    name: dirent.name,
                    path: path.join(__dirname, 'builds', dir, dirent.name),
                    href: path.join('/builds', dir, dirent.name),
                    lastModified: stats.mtime,
                    size: stats.size,
                    sizeString: utils.fileSizeToString(stats.size),
                    ..._object
                }
            })
            .sort((a, b) => b.lastModified - a.lastModified);
        builds[dir] = files;
    }
    return builds;
}

export async function getLatestBuilds() { // json file tree
    // /builds/username/branch.latest.bin -> symlink
    const builds = {};
    const files = path.join(__dirname, 'builds');
    const dirs = fs.readdirSync(files, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    for (const dir of dirs) {
        const files = fs.readdirSync(path.join(__dirname, 'builds', dir), { withFileTypes: true })
            .filter(dirent => dirent.isSymbolicLink() && dirent.name.endsWith('.latest.bin'))
            .map(dirent => {
                return {
                    name: dirent.name,
                    path: path.join(__dirname, 'builds', dir, dirent.name),
                    href: path.join('/builds', dir, dirent.name)
                }
            });
        builds[dir] = files;
    }
    return builds;
}

export async function resolveLatestBuilds() { // json file tree
    const builds = {};
    const files = path.join(__dirname, 'builds');
    const dirs = fs.readdirSync(files, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    for (const dir of dirs) {
        const symlink = fs.readlinkSync(path.join(__dirname, 'builds', dir, 'latest.bin'));
        const basename = path.basename(symlink);
        const _object = filename_to_object(basename);
        builds[dir] = {
            name: basename,
            href: path.join('/builds', dir, 'latest.bin'),
            ..._object
        };
    }
    return builds;
}

export function filename_to_object(filename) {
    const parts = filename.split('.');
    return {
        short_sha: parts[0],
        branch: parts[1],
        color: parts[0].substring(0, 6),
    }
}

export async function generate_git_mapping() {
    const mapping = {};
    const git_log = await get_git_log();
    for (const key in git_log) {
        const commit = git_log[key];
        mapping[commit.hash.substring(0, 7)] = {
            ...commit,
            color: commit.hash.substring(0, 6)
        };
    }

    return mapping;
}

export async function get_git_log() {
    const log = {};
    const git_log = execute_git_log();
    if (!git_log || git_log.length === 0) {
        return log;
    }
    
    for (const commit of git_log.split('\n')) {
        if (commit.length > 0) {
            try {
                const _commit = commit.split('[]');
                const hash = _commit[0];
                const message = _commit[1];
                const author = _commit[2];
                log[hash] = {
                    hash,
                    message,
                    author
                };
            } catch (e) {
                console.error('parse error', commit);
            }
        }
    }
    return log;
}

function execute_git_log() {
    try {
        return child_process.execSync('git --no-pager log --no-notes --no-abbrev-commit --all --format="%H[]%s[]%an"', {
            cwd: git_path
        }).toString();
    } catch (e) {
        console.error(e);
        return '';
    }
}

export default {
    generateListing,
    getLatestBuilds,
    resolveLatestBuilds,
    filename_to_object,
    generate_git_mapping
}