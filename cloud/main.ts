import { InitProcess } from "../init";
import * as ServerManager from "server-manager-api";
import * as pm2 from "pm2";
import { ProcessDescription }from "pm2";
import * as fs from "fs"
import * as path from "path"
import { Server } from "../data/Server";
import simpleGit, { SimpleGit } from "simple-git";
import * as child_process from "child_process";
import * as osutils from "os-utils";

Parse.Cloud.define("GetServerInfo", getServerInfo, {
  requireAllUserRoles: ["Admin"],
  fields: {
    ServerId: {
      type: String
    }
  }
})
Parse.Cloud.define("StopServer", stopServer, {
  requireAllUserRoles: ["Admin"],
  fields: {
    ServerId: {
      type: String
    }
  }
})
Parse.Cloud.define("StartServer", startServer, {
  requireAllUserRoles: ["Admin"],
  fields: {
    ServerId: {
      type: String
    }
  }
})
Parse.Cloud.define("GetMainServerStats", mainServerStats, {
  requireAllUserRoles: ["Admin"]
})

Parse.Cloud.job("RestartDashboard", (request: Parse.Cloud.JobRequest) => ServerManager.Cloud.runProcess("RestartDasbhoard", restartDashboard, request));

async function restartDashboard(process: ServerManager.Process, request: Parse.Cloud.JobRequest) {
  await new InitProcess().initDashboard();
}

Parse.Cloud.job("InstallServer", (request: Parse.Cloud.JobRequest<StartServerParams>) => ServerManager.Cloud.runProcess<StartServerParams>("InstallServer-" + request.params.ServerId, installServer, request));


interface StartServerParams extends Parse.Cloud.Params {
  ServerId: String;
}
Parse.Cloud.define("InstallServer", (request: Parse.Cloud.FunctionRequest<StartServerParams>) => Parse.Cloud.startJob("InstallServer", { ServerId: request.params.ServerId }), {
  //  requireUser: false,
  requireAnyUserRoles: ["Admin"],
  fields: {
    ServerId: {
      type: String
    }
  }
});

async function installServer(process: ServerManager.Process, request: Parse.Cloud.JobRequest<StartServerParams>) {
  process.newStep();
  var server: Server = (await new Parse.Query<Server>("Server").equalTo("objectId", request.params.ServerId).first({ useMasterKey: true }));
  process.newStep();
  var serverPath = path.resolve(global.process.cwd(), "/servers/" + server.id);
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
    if (server.Branch != ""
      && server.Branch != undefined) {
      await git.clone(server.Repo, serverPath, { '--branch': server.Branch });
    }
    else {
      await git.clone(server.Repo, serverPath);
    }
  }
  process.newStep();
  console.info(child_process.execSync("npm install", { cwd: serverPath }));
  console.info(child_process.execSync("npm run build", { cwd: serverPath }));
  fs.copyFileSync(path.resolve(__dirname, "../serverStartup.js"), path.resolve(serverPath, "serverStartup.js"));
  process.newStep();
}

async function startServer(request: Parse.Cloud.JobRequest<StartServerParams>) {
  var server: Server = (await new Parse.Query<Server>("Server").equalTo("objectId", request.params.ServerId).first({ useMasterKey: true }));
  var serverPath = path.resolve(global.process.cwd(), "/servers/" + server.id);
  serverPath = serverPath + "/repo";
  var prom = new Promise<boolean>((res, rej) => {
    pm2.connect(async (err) => {
      if (!err) {
        console.info(serverPath);
        pm2.start({
          cwd: serverPath,
          script: path.resolve(serverPath, "serverStartup.js"),
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
          res(!err);
        });
      }
    });
  });
  var res = await prom;
  return res;
}

function getJsonConfig(config: ServerManager.SubServerConfig) {
  return JSON.stringify(config);
}
async function getServerInfo(request: Parse.Cloud.FunctionRequest<StartServerParams>) {
  var prom = new Promise<pm2.ProcessDescription>((res, rej) => {
    pm2.connect((err) => {
      if (!err) {
        pm2.describe(request.params.ServerId.valueOf(), (err, desc) => {
          if (err)
            res(err);
          else
            if (desc.length == 0) {
              res({} as ProcessDescription);
            } else {
              res(desc[0]);
            }

        })
      } else {
        res(err);
      }
    })
  });
  var res = await prom;
  return res;
}
async function stopServer(request: Parse.Cloud.FunctionRequest<StartServerParams>) {
  var prom = new Promise<boolean>((res, rej) => {
    pm2.connect((err) => {
      if (!err) {
        pm2.stop(request.params.ServerId.valueOf(), (err, proc) => {
          res(!err);
        })
      }
    })
  });
  var res = await prom;
  return res;
}


async function mainServerStats(request: Parse.Cloud.FunctionRequest) {
  var prom = new Promise<object>((res, rej) => {
    osutils.cpuUsage((usg) => {
      
      res({
        cpu: usg,
        mem: (Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100) / osutils.totalmem() * 100,
        up: osutils.processUptime()
      });
    })
  });
  var res = await prom;
  return res;
}