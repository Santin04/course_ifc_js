import { v4 as uuidv4 } from "uuid"

export type projectStatus = "pending" | "active" | "finished"
export type projectUserRole = "Architect" | "Engineer" | "Usina fotovoltaica"

export interface Iproject {
    name: string
    description: string
    status: projectStatus
    userRole: projectUserRole
    finishDate: Date
}

export class project implements Iproject{
    //usa elementos de fora como do Iproject
    name: string
    description: string
    status: "pending" | "active" | "finished"
    userRole: "Architect" | "Engineer" | "Usina fotovoltaica"
    finishDate: Date

    //vai ser ussado na parte interna da class (constructor)
    ui: HTMLDivElement
    cost: number = 0
    progress: number = 0
    id: string

    constructor(data: Iproject){
        //definindo dados do projetos, obtido pelo form
        this.name = data.name
        this.description = data.description
        this.status = data.status
        this.userRole = data.userRole
        this.finishDate = data.finishDate

        //criando o id do card de projeto
        this.id = uuidv4()

        //criando o novo card após o usuário enviar o form
        this.setUI()
    }

    //cria o novo card de projeto com os dados do formulário
    setUI(){
        if (this.ui) {return}
        this.ui = document.createElement('div')
        this.ui.className = 'project-card'
        this.ui.innerHTML = `
        <div class="card-header">
            <p>HC</p>
            <div>
                <h3>${this.name}</h3>
                <p>${this.description}</p>
            </div>
        </div>
        <div class="card-content">
            <div class="card-property">
                <p style="color: #969696;">Status</p>
                <p>${this.status}</p>
            </div>
            <div class="card-property">
                <p style="color: #969696;">Role</p>
                <p>${this.userRole}</p>
            </div>
            <div class="card-property">
                <p style="color: #969696;">Cost</p>
                <p>$${this.cost}</p>
            </div>
            <div class="card-property">
                <p style="color: #969696;">Estimated Progress</p>
                <p>${this.progress}</p>
            </div>
        </div>`
    }
}