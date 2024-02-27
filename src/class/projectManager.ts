import { Iproject, project } from "./project";

export class ProjectManager {
    list: project[] = []
    ui: HTMLElement

    constructor(container: HTMLElement){
        this.ui = container
        const project = this.newProject({
            name: "Default project",
            description: "this is just a default app project",
            status: "pending",
            userRole: "Architect",
            finishDate: new Date(),
        })
        project.ui.click()
    }

    //coloca o novo projeto na tela
    newProject(data: Iproject){
        const projectNames = this.list.map((project) => {
            return project.name
        })
        const nameInUse = projectNames.includes(data.name)
        if (nameInUse) {
            throw new Error(`A project with the name "${data.name}" already exists`)
        }
        const proje = new project(data)
        proje.ui.addEventListener("click", () => {
            const projectsPage = document.getElementById("projects-page")
            const detailsPage = document.getElementById("projects-details")
            if (!projectsPage || !detailsPage) {return}
            projectsPage.style.display = "none"
            detailsPage.style.display = "flex"
        })
        this.ui.append(proje.ui)
        this.list.push(proje)
        return proje
    }

    getProject(id: string){
        const project = this.list.find((project) => {
            return project.id === id
        })
        return project
    }

    deleteProject(id: string) {
        const project = this.getProject(id)
        if (!project) {return}
        project.ui.remove()
        const remaining = this.list.filter((project) => {
            return project
        })
        this.list = remaining
    }

    exportToJSON(fileName: string = 'projects'){
        const json = JSON.stringify(this.list, null, 2)
        const blob = new Blob([json], {type: 'application/json'})
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        a.click()
        URL.revokeObjectURL(url)
    }

    importToJSON(){
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'application/json'
        const reader = new FileReader()
        reader.addEventListener('load', () => {
            const json = reader.result
            if (!json) {return}
            const projects: Iproject[] = JSON.parse(json as string)
            for (const project of projects){
                try {
                    this.newProject(project)
                } catch(error){

                }
            }
        })
        input.addEventListener('change', () => {
            const filesList = input.files
            if (!filesList) {return}
            reader.readAsText(filesList[0])
        })
        input.click()
    }
}