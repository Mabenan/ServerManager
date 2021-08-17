import { Role, Schema } from "parse";
import { instance } from "server-manager-api";
import { randomBytes } from "crypto";
import { Server } from "./data/Server";
import * as ParseDashboard from "parse-dashboard";
import { genSaltSync, hashSync } from "bcrypt";
import * as fs from "fs";
import * as ServerManager from "server-manager-api";
import * as path from "path";

export class InitProcess {

    async initDashboard() {
        instance.LOGGER.default.info("Init Dashboard");
        var servers = await (new Parse.Query<Server>("Server").findAll({ useMasterKey: true }));

        var apps: object[] = [];
        servers.forEach((server : Server) => {
            apps.push({
                serverURL: "http://" + ServerManager.instance.CONFIG.PARSE_PUBLIC_SERVERHOST + ":" + server.HTTP_PORT + "/" + server.API_PATH,
                appId: server.AppId,
                masterKey: server.MasterKey,
                appName: server.Name
            })
        });

        apps.push({
            appName: "Server Manager",
            appId: "com.mabenan.servermanager",
            masterKey: instance.CONFIG.PARSE_MASTERKEY,
            serverURL: "http://" + ServerManager.instance.CONFIG.PARSE_PUBLIC_SERVERHOST + ":" + ServerManager.instance.CONFIG.HTTP_PORT + "/api",
        })

        instance.PARSE_DASHBOARD = new ParseDashboard({
            apps: apps,
            users: [
                {
                    user: "admin",
                    pass: fs.readFileSync(path.resolve(path.resolve(process.cwd(),process.env.CONFIG_LOCATION), "./ADMIN.pass"), { encoding: 'utf8' })
                }
            ],
            useEncryptedPasswords: true
        }, {
            allowInsecureHTTP: true // HTTPS terminated by NGINX
        });

        await this.reset();
        instance.APP.use("/dashboard", instance.PARSE_DASHBOARD);
    }

    async reset(){
        if (instance.APP._router.stack.length > instance.initialExpressStackSize) {
            instance.APP._router.stack.length = instance.initialExpressStackSize;
        }
    }

    async init() {
        
        Parse.Object.registerSubclass("Server", Server);
        instance.initialExpressStackSize = instance.APP._router.stack.length;
        
        var roles = (await new Parse.Query<Role>("_Role").equalTo("name", "Admin").find({ useMasterKey: true }));
        if (roles.length == 0) {
            const roleACL = new Parse.ACL();
            roleACL.setPublicReadAccess(true);
            var role = new Parse.Role("Admin", roleACL);
            role = await role.save(null, { useMasterKey: true });
            var pass = randomBytes(20).toString('hex');
            var hashedPW = hashSync(pass, genSaltSync(10, "a"));
            fs.writeFileSync(path.resolve(path.resolve(process.cwd(),process.env.CONFIG_LOCATION), "./ADMIN.pass"), hashedPW);
            var user = new Parse.User();
            user.set("username", "admin");
            user.set("password", pass);
            user.set("email", "admin@admin.com");
            user = await user.save(null, { useMasterKey: true });
            role.getUsers().add(user);
            role = await role.save(null, { useMasterKey: true });
            console.log("TMPAdmin: " + pass);
        }
        roles = (await new Parse.Query<Role>("_Role").equalTo("name", "User").find({ useMasterKey: true }));
        if (roles.length == 0) {
            const roleACL = new Parse.ACL();
            roleACL.setPublicReadAccess(true);
            var role = new Parse.Role("User", roleACL);
            role = await role.save(null, { useMasterKey: true });
        }

        await ServerManager.Schema.initObject<Server>([
            { name: "Name", type: "String" },
            { name: "HTTPS_PORT", type: "Number" },
            { name: "HTTP_PORT", type: "Number" },
            { name: "HTTPS", type: "Boolean" },
            { name: "Database", type: "String" },
            { name: "AppId", type: "String" },
            { name: "API_PATH", type: "String" },
            { name: "MasterKey", type: "String" },
            { name: "Repo", type: "String" },
            { name: "CLOUD_ENTRY", type: "String" },
            { name: "INIT_MODULE", type: "String" }
        ], Server, {
            find: { requiresAuthentication: undefined, 'role:Admin': true },
            get: { requiresAuthentication: undefined, 'role:Admin': true },
            count: { requiresAuthentication: undefined, 'role:Admin': true },
            create: { requiresAuthentication: undefined, 'role:Admin': true },
            update: { requiresAuthentication: undefined, 'role:Admin': true },
            delete: { requiresAuthentication: undefined, 'role:Admin': true },
            addField: { requiresAuthentication: undefined, 'role:Admin': true }
        });
        await ServerManager.ProcessInit();
        this.initDashboard();

    }
}