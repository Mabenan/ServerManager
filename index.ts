import * as ParseServer from "parse-server";
import * as express from "express";
import * as fs from "fs";
import * as https from "https";
import * as http from "http";
import { instance, ServerConfig } from "server-manager-api";
import { InitProcess } from "./init";
import * as path from "path";
instance.APP = express();


function startServer() {
  instance.CONFIG = new ServerConfig();
  try {
    if (fs.existsSync(path.resolve(process.cwd(),"/config.json"))) {
      instance.CONFIG = require(path.resolve(process.cwd(),"/config.json"));
    }
  } catch (error) {
    console.log("Config not found in " + path.resolve(process.cwd(),"/config.json"));
  }
  for (const prop in instance.CONFIG) {
    if (Object.prototype.hasOwnProperty.call(process.env, prop)) {
      instance.CONFIG[prop] = process.env[prop];
    }
  }
  instance.PARSE_INSTANCE = new ParseServer.ParseServer({
    appName: "Server Manager",
    databaseURI: instance.CONFIG.PARSE_DATABASEURI + instance.CONFIG.MAIN_DATABASE,
    appId: "com.mabenan.servermanager",
    masterKey: instance.CONFIG.PARSE_MASTERKEY,
    serverURL: "http://" + instance.CONFIG.PARSE_LOCAL_SERVERHOST + ":" + instance.CONFIG.HTTP_PORT + "/api",
    publicServerURL: (instance.CONFIG.HTTPS ? "https://" : "http://") + instance.CONFIG.PARSE_PUBLIC_SERVERHOST + ":" + (instance.CONFIG.HTTPS ? instance.CONFIG.HTTPS_PORT : instance.CONFIG.HTTP_PORT) + "/api",

    allowHeaders: ["X-Parse-Installation-Id", "X-Parse-Application-Id"],
    cloud: __dirname + "/cloud/main",
    allowClientClassCreation: false
  });
  instance.APP.use("/api", instance.PARSE_INSTANCE);
  if (instance.CONFIG.HTTPS) {
    try {
      var privateKey = fs.readFileSync(path.resolve(process.cwd(),"/sslcert/server.key"), "utf8");
      var certificate = fs.readFileSync(path.resolve(process.cwd(), "/sslcert/server.crt"),
        "utf8"
      );

      var credentials = { key: privateKey, cert: certificate };
      var httpsServer = https.createServer(credentials, instance.APP);
      httpsServer.listen(instance.CONFIG.HTTPS_PORT);
      ParseServer.ParseServer.createLiveQueryServer(httpsServer);
      console.log("https started");
    } catch (error) { }
  }
  var httpServer = http.createServer(function (req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    instance.APP(req, res);
  });
  httpServer.listen(instance.CONFIG.HTTP_PORT);
  ParseServer.ParseServer.createLiveQueryServer(httpServer);
  new InitProcess().init();
}
startServer();