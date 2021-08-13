export class Project extends Parse.Object {

    constructor(){
        super("Project");
    }

    
    public get Name(): string{
        return this.get<string>("Name");
    }

    public set Name(value: string)
    {
        this.set("Name", value);
    }


    
    public get Repo(): string{
        return this.get<string>("Repo");
    }

    public set Repo(value: string)
    {
        this.set("Repo", value);
    }

    public get DevBranch(): string{
        return this.get<string>("DevBranch");
    }

    public set DevBranch(value: string)
    {
        this.set("DevBranch", value);
    }

    public get TestBranch(): string{
        return this.get<string>("TestBranch");
    }

    public set TestBranch(value: string)
    {
        this.set("TestBranch", value);
    }

    public get ProdBranch(): string{
        return this.get<string>("ProdBranch");
    }

    public set ProdBranch(value: string)
    {
        this.set("ProdBranch", value);
    }

    public get CloudFile(): string{
        return this.get<string>("CloudFile");
    }

    public set CloudFile(value: string)
    {
        this.set("CloudFile", value);
    }
    public get InitFile(): string{
        return this.get<string>("InitFile");
    }

    public set InitFile(value: string)
    {
        this.set("InitFile", value);
    }
}