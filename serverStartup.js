"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ParseServer = require("parse-server");
const express = require("express");
const path = require("path");
const https = require("https");
const http = require("http");
const server_manager_api_1 = require("server-manager-api");
var app = express();
function startServer() {
    var config = JSON.parse(process.argv[2]);
    var api = ParseServer.ParseServer({
        appName: config.PARSE_APPNAME,
        databaseURI: config.PARSE_DATABASEURI,
        appId: config.PARSE_APPID,
        masterKey: config.PARSE_MASTERKEY,
        serverURL: "http://" + config.PARSE_LOCAL_SERVERHOST + ":" + config.HTTP_PORT + "/" + config.PATH,
        publicServerURL: (config.HTTPS ? "https://" : "http://") + config.PARSE_PUBLIC_SERVERHOST + ":" + (config.HTTPS ? config.HTTPS_PORT : config.HTTP_PORT) + "/" + config.PATH,
        cloud: config.CLOUD_ENTRY,
        allowClientClassCreation: false
    });
    app.use("/" + config.PATH, api);
    if (config.HTTPS) {
        try {
            var privateKey = process.argv[3];
            var certificate = process.argv[4];
            var passphrase = process.argv[5];
            var credentials = { key: privateKey, cert: certificate, passphrase: passphrase };
            var httpsServer = https.createServer(credentials, app);
            httpsServer.listen(config.HTTPS_PORT);
            ParseServer.ParseServer.createLiveQueryServer(httpsServer);
            console.log("https started");
        }
        catch (error) { }
    }
    var httpServer = http.createServer(function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "*");
        app(req, res);
    });
    httpServer.listen(config.HTTP_PORT);
    ParseServer.ParseServer.createLiveQueryServer(httpServer);
    Parse.Config;
    server_manager_api_1.instance.APP = app;
    var initProcess = require(path.resolve(process.cwd(), config.INIT_MODULE));
    initProcess.init();
}
startServer();
//# sourceMappingURL=serverStartup.js.map