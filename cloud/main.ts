import { InitProcess } from "../init";
import * as ServerManager from "server-manager-api";
import * as pm2 from "pm2";
import * as fs from "fs"
import * as path from "path"
import { Server } from "../data/Server";
import simpleGit, { SimpleGit } from "simple-git";
import * as child_process from "child_process";

Parse.Cloud.job("RestartDashboard", (request: Parse.Cloud.JobRequest) => ServerManager.Cloud.runProcess("RestartDasbhoard", restartDashboard, request));

async function restartDashboard(process: ServerManager.Process, request: Parse.Cloud.JobRequest) {
  await new InitProcess().initDashboard();
}

Parse.Cloud.job("StartServer", (request: Parse.Cloud.JobRequest<StartServerParams>) => ServerManager.Cloud.runProcess<StartServerParams>("StartServer-" + request.params.ServerId, startServer, request));


interface StartServerParams extends Parse.Cloud.Params {
  ServerId: String;
}
Parse.Cloud.define("StartServer", (request: Parse.Cloud.FunctionRequest<StartServerParams>) => Parse.Cloud.startJob("StartServer", { ServerId: request.params.ServerId }), {
//  requireUser: false,
//  requireAnyUserRoles: ["Admin"],
  fields: {
    ServerId: {
      type: String
    }
  }
});

async function startServer(process: ServerManager.Process, request: Parse.Cloud.JobRequest<StartServerParams>) {
  process.newStep();
  var server: Server = (await new Parse.Query<Server>("Server").equalTo("objectId", request.params.ServerId).first({useMasterKey: true}));
  process.newStep();
  pm2.connect(async (err) => {
    if (err) {
      ServerManager.instance.LOGGER.error(err.message);
    } else {
      var serverPath =  path.resolve(global.process.cwd(), "/servers/" + server.id);
      process.newStep();

      if (!fs.existsSync(serverPath)) {
        fs.mkdirSync(serverPath, {
          recursive: true
        });
      }
      process.newStep();
      serverPath = serverPath + "/repo";
      if (!fs.existsSync(serverPath)) {
        var git: SimpleGit = simpleGit();
        await git.clone(server.Repo, serverPath);
      }
      process.newStep();
      console.info(child_process.execSync("npm install", { cwd: serverPath }));
      console.info(child_process.execSync("npm run build", { cwd: serverPath }));
      process.newStep();
      console.info(serverPath);
      pm2.start({
        cwd: serverPath,
        script: path.resolve(__dirname, "../serverStartup.js"),
        name: server.id,
        args: [getJsonConfig({
          PARSE_APPNAME: server.Name,
          PARSE_DATABASEURI: ServerManager.instance.CONFIG.PARSE_DATABASEURI + server.Database,
          PARSE_APPID: server.AppId,
          PARSE_MASTERKEY: server.MasterKey,
          PARSE_LOCAL_SERVERHOST: ServerManager.instance.CONFIG.PARSE_LOCAL_SERVERHOST,
          PARSE_PUBLIC_SERVERHOST: ServerManager.instance.CONFIG.PARSE_PUBLIC_SERVERHOST,
          HTTPS: server.HTTPS,
          HTTPS_PORT: server.HTTPS_PORT,
          HTTP_PORT: server.HTTP_PORT,
          PATH: server.API_PATH,
          CLOUD_ENTRY: path.resolve(serverPath, server.CLOUD_ENTRY),
          INIT_MODULE: path.resolve(serverPath, server.INIT_MODULE)
        }), server.SSLKey, server.SSLCert, server.SSLPass]
      }, function (err, proc) {
        if (err) {
          console.error(err.message);
          return pm2.disconnect();
        }else{
          
        }
      });
    }
  });
}

function getJsonConfig(config: ServerManager.SubServerConfig) {
  return JSON.stringify(config);
}
