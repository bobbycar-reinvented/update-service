import express from "express";
import bodyParser from "body-parser";
import "ejs";

import builds from "./builds.js";
import otaDescriptor from "./otaDescriptor.js";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");

app.get("/", async (req, res) => {

    const protocol = req.headers["x-forwarded-proto"];
    if (protocol === "http") {
        res.redirect("https://" + req.headers.host + req.url);
        return;
    }

    const listing = await builds.generateListing();
    const resolvedLatestBuilds = await builds.resolveLatestBuilds();
    const git_log = await builds.generate_git_mapping();
    
    res.render("index", {
        listing,
        resolvedLatestBuilds,
        git_log
    });
});

app.use('/builds', express.static('builds'));

app.use(otaDescriptor);

app.listen(42433, '127.0.0.1', () => {
    console.log("Server is running on port 42433");
});
