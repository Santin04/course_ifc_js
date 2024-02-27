import * as OBC from "openbim-components"

export class TodoCard extends OBC.SimpleUIComponent {

    //criando o evento de clique para o card selecionar os elementos da tarefa dele
    onCardClick = new OBC.Event()

    //definindo o valor da descrição do card de acordo com oque vai ser mandado do outro arquivo
    set description(value: string){
        const descriptionElement = this.getInnerElement('description') as HTMLParagraphElement
        descriptionElement.textContent = value
    }

    //definindo a data do card da lista de Todo
    set date(value: Date){
        const dateElement = this.getInnerElement('date') as HTMLParagraphElement
        dateElement.textContent = value.toDateString()
    }

    constructor(components: OBC.Components){
        //template do card Todo da lista de tarefas
        const template = `
            <div class="todo-item" style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 15px; font-size: 14px;">
                    <div style="background-color: #7a7c81; display: flex; justify-content: center; align-items: center; height: 40px; width: 40px; border-radius: 8px;"><span class="material-symbols-outlined">construction</span></div>
                    <p id="description" style="width: 200px;">Make anything here as you want, even something longer</p>
                </div>
                <p id="date">Fri, 20 sep</p>
            </div>
        `

        super(components, template)

        //criando o evento de click no card, assim que clicar seleciona os elementos 3D da tarefa
        const cardElement = this.get()
        cardElement.addEventListener('click', () => {
            this.onCardClick.trigger()
        })
    }
}