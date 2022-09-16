import express from "express";
import _builds from "./builds.js";

const otaDescriptor = express.Router();

/*
  Query parameters:
    - ?all: show all builds, requires ?username=<username>
    - ?username=<username>: filter by username
    - ?count=<count>: limit the number of builds to <count>, default 10
    - ?branch=<branch>: filter by branch, if not set, do not filter
    - ?branches: show all branches, requires ?username=<username>

    No parameters will display the latest 10 builds for all branches for all users
 */

otaDescriptor.get("/otaDescriptor", async (req, res) => {
    let { all: show_all, username, count, branch, branches: list_branches } = req.query;
    show_all = typeof show_all !== "undefined";
    list_branches = typeof list_branches !== "undefined";

    if (!username && show_all) {
        res.status(400).json({
            error: "No username specified (Needed when using the 'all' parameter; ?username=<username>)"
        });
        return;
    }

    if (!username && list_branches) {
        res.status(400).json({
            error: "No username specified (Needed when using the 'branches' parameter; ?username=<username>)"
        });
        return;
    }

    const listing = await _builds.generateListing(); // { username: [], ... }

    if (!!username && !Object.keys(listing).includes(username)) {
        res.status(400).json({
            error: "Username not found."
        });
        return;
    }

    if (list_branches) {
        const branches = [];

        const max_count = typeof count === "undefined" ? 20 : parseInt(count);

        for (const build of listing[username]) {
            if (!branches.includes(build.branch)) {
                branches.push(build.branch);
            }

            if (branches.length >= max_count) {
                break;
            }
        }

        res.status(200).json(branches);
    } else {
        let builds = {};

        const resolvedLatestBuilds = await _builds.resolveLatestBuilds();
        const usernames = !!username ? [username] : Object.keys(listing);
        const max_count = !!show_all ? false : typeof count === "undefined" ? 10 : parseInt(count);

        for (const username of usernames) {
            const user_json = {};
            user_json["availableVersions"] = {};
            user_json["url"] = `/builds/${username}/{}.bin`;
            user_json["new_url"] = `/builds/${username}/`;

            if (!branch) {
                user_json["latest"] = `/builds/${username}/latest.bin`;
                user_json["currentVersion"] = resolvedLatestBuilds[username]?.name.replace(".bin", "");
            } else {
                for (const build of listing[username]) {
                    if (build.branch === branch) {
                        user_json["currentVersion"] = build.name.replace(".bin", "");
                        break;
                    }
                }

                if (!user_json["currentVersion"]) {
                    res.status(400).json({
                        error: `No builds found for branch '${branch}'`
                    });
                    return;
                }

                user_json["latest"] = `/builds/${username}/${branch}.latest.bin`;
            }

            for (const build of listing[username]) {
                if (branch && build.branch !== branch) {
                    continue;
                }

                if (max_count && Object.keys(user_json["availableVersions"]).length >= max_count) {
                    break;
                }
                
                user_json["availableVersions"][build.name.replace(".bin", "")] = true; // was check if firmware bin file contains string "ota", but as build flags aren't like that anymore, i will hardcode it for now
            }

            user_json["currentVersionHasOta"] = !!user_json["availableVersions"][user_json["currentVersion"]];
            builds[username] = user_json;
        }

        if (usernames.length === 1) {
            builds = builds[usernames[0]];
        }

        res.json(builds);
    }
});

export default otaDescriptor;