export class Server extends Parse.Object {

    constructor(){
        super("Server");
    }

    public get Name(): string{
        return this.get<string>("Name");
    }

    public set Name(value: string)
    {
        this.set("Name", value);
    }

    public get API_PATH(): string{
        return this.get<string>("API_PATH");
    }

    public set API_PATH(value: string)
    {
        this.set("API_PATH", value);
    }

    
    public get HTTPS_PORT(): number{
        return this.get("HTTPS_PORT");
    }

    public set HTTPS_PORT(value: number)
    {
        this.set("HTTPS_PORT", value);
    }
    public get HTTP_PORT(): number{
        return this.get("HTTP_PORT");
    }

    public set HTTP_PORT(value: number)
    {
        this.set("HTTP_PORT", value);
    }

    public get HTTPS(): boolean{
        return this.get("HTTPS");
    }

    public set HTTPS(value: boolean)
    {
        this.set("HTTPS", value);
    }

    
    public get Database(): string{
        return this.get<string>("Database");
    }

    public set Database(value: string)
    {
        this.set("Database", value);
    }
    
    public get AppId(): string{
        return this.get<string>("AppId");
    }

    public set AppId(value: string)
    {
        this.set("AppId", value);
    }

    
    public get MasterKey(): string{
        return this.get<string>("MasterKey");
    }

    public set MasterKey(value: string)
    {
        this.set("MasterKey", value);
    }
    public get Repo(): string{
        return this.get<string>("Repo");
    }

    public set Repo(value: string)
    {
        this.set("Repo", value);
    }
    public get CLOUD_ENTRY(): string{
        return this.get<string>("CLOUD_ENTRY");
    }

    public set CLOUD_ENTRY(value: string)
    {
        this.set("CLOUD_ENTRY", value);
    }
    public get INIT_MODULE(): string{
        return this.get<string>("INIT_MODULE");
    }

    public set INIT_MODULE(value: string)
    {
        this.set("INIT_MODULE", value);
    }
    
    public get SSLKey(): string{
        return this.get<string>("SSLKey");
    }

    public set SSLKey(value: string)
    {
        this.set("SSLKey", value);
    }

    public get SSLCert(): string{
        return this.get<string>("SSLCert");
    }

    public set SSLCert(value: string)
    {
        this.set("SSLCert", value);
    }

    public get SSLPass(): string{
        return this.get<string>("SSLPass");
    }

    public set SSLPass(value: string)
    {
        this.set("SSLPass", value);
    }


}