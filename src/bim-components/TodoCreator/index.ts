import * as OBC from 'openbim-components'
import { TubeGeometry } from 'three'
import { TodoCard } from './src/TodoCard'
import * as THREE from 'three'

type ToDoPriority = 'Low' | 'Normal' | 'High'

interface Todo {
    //definindo as variaveis dos dados
    description: string
    date: Date
    fragmentMap: OBC.FragmentIdMap
    camera: {position: THREE.Vector3, target: THREE.Vector3}
    priority: ToDoPriority
}

export class TodoCreator extends OBC.Component<Todo[]> implements OBC.UI {
    static uuid = "d8a8f45e-0ada-468f-94d2-d4fa23c6d631"
    enabled: true
    uiElement = new OBC.UIElement<{
        activationButton: OBC.Button
        todoList: OBC.FloatingWindow
    }>()
    private _components: OBC.Components
    private _list: Todo[] = []

    constructor(components: OBC.Components){
        super(components)
        this._components = components
        components.tools.add(TodoCreator.uuid, this)
        this.setUI()
    }

    async setup() {
        const highLighter = await this._components.tools.get(OBC.FragmentHighlighter)
        highLighter.add(`${TodoCreator.uuid}-priority-Low`, [new THREE.MeshStandardMaterial({color: 0x59bc59})])
        highLighter.add(`${TodoCreator.uuid}-priority-Normal`, [new THREE.MeshStandardMaterial({color: 0x597cff})])
        highLighter.add(`${TodoCreator.uuid}-priority-High`, [new THREE.MeshStandardMaterial({color: 0xff7676})])
    }

    //criando o metodo que vai acrescentar um tarefa a lista de Todo
    async addTodo(description: string, priority: ToDoPriority){
        const camera = this._components.camera
        //vendo se a camera em órbita está certa
        if(!(camera instanceof OBC.OrthoPerspectiveCamera)){
            throw new Error('TodoCreator needs the OrthoPerspectiveCamera in order to work')
        }
        //deixando pronto para quando clicar no card, a camera for para os elementos da tarefa
        const position = new THREE.Vector3()
        camera.controls.getPosition(position)
        const target = new THREE.Vector3()
        camera.controls.getTarget(target)
        const todoCamera = {position, target}

        //fazendo com que o objeto selecionado seja o objeto passado como dado da nova tarefa
        const highlighter = await this._components.tools.get(OBC.FragmentHighlighter)
        const todo: Todo = {
            camera: todoCamera,
            description,
            date: new Date(),
            //incluindo o elemento selecionado
            fragmentMap: highlighter.selection.select,
            priority,
        }
        this._list.push(todo)

        //criando o card com o template do Todo de tarefas
        const todoCard = new TodoCard(this._components)
        //passando o valor da descrição do novo card
        todoCard.description = todo.description
        //passando o valor da data do novo card
        todoCard.date = todo.date
        //fazendo com que ao clicar no card, selecione os elementos da tarefa do card
        todoCard.onCardClick.add(() => {
            //definindo a posição da camera
            camera.controls.setLookAt(
                todo.camera.position.x, todo.camera.position.y, todo.camera.position.z,
                todo.camera.target.x, todo.camera.target.y, todo.camera.target.z,
                true
            )

            //vendo se existe elementos dentro da tarefa
            const fragmentMapLength = Object.keys(todo.fragmentMap).length
            if (fragmentMapLength === 0 ) {return}
            //selecionando os elementos da tarefa
            highlighter.highlightByID('select', todo.fragmentMap)
        })
        //adicionando o card a lista de Todo
        const todoList = this.uiElement.get('todoList')
        todoList.addChild(todoCard)
    }

    private async setUI(){
        //criando o botão de adicionar Todo
        const activationButton = new OBC.Button(this._components)
        activationButton.materialIcon = 'construction'

        const newTodoBtn = new OBC.Button(this._components, {name: 'create'})
        activationButton.addChild(newTodoBtn)

        //criando form para adicionar novo item ao Todo
        const form = new OBC.Modal(this._components)
        this._components.ui.add(form)
        form.title = 'Crete new Todo'

        //criando a caixa de entrada da descrição da tarefa
        const descriptionInput = new OBC.TextArea(this._components)
        descriptionInput.label = 'Description'
        form.slots.content.addChild(descriptionInput)
        //criando um input de opções dentro do form de novo card
        const priorityDropdown = new OBC.Dropdown(this._components)
        priorityDropdown.label = 'Priority'
        priorityDropdown.addOption('Low', 'Normal', 'High')
        priorityDropdown.value = 'Normal'
        form.slots.content.addChild(priorityDropdown)
        //deixando a caixa de entrada mais bonita
        form.slots.content.get().style.padding = '20px'
        form.slots.content.get().style.display = 'flex'
        form.slots.content.get().style.flexDirection = 'column'
        form.slots.content.get().style.rowGap = '20px'

        //fazendo com que passe a tarefa que foi escrita
        form.onAccept.add(() => {
            this.addTodo(descriptionInput.value, priorityDropdown.value as ToDoPriority)
            descriptionInput.value = ''
            form.visible = false
        })

        //quando clicar no cancel, voltar a tela normal
        form.onCancel.add(() => {form.visible = false})
        
        //quando clicar no icone, aparecer o form para novo item do Todo
        newTodoBtn.onClick.add(() => {form.visible = true})

        //criando o incone que mostra a list de tarefas do Todo
        const todoList = new OBC.FloatingWindow(this._components)
        this._components.ui.add(todoList)
        todoList.visible = false
        todoList.title = 'To-Do List'

        //criando a barra de opções do list do To-Do
        const todoListToolbar = new OBC.SimpleUIComponent(this._components)
        todoList.addChild(todoListToolbar)

        //criando a opção de baldinho de cor
        const colorizeBtn = new OBC.Button(this._components)
        colorizeBtn.materialIcon = 'format_color_fill'
        todoListToolbar.addChild(colorizeBtn)

        const highlighter = await this._components.tools.get(OBC.FragmentHighlighter)
        //adicionar o que o botão faz ao ser acionado
        colorizeBtn.onClick.add(() => {
            //ativando e desativando o botão
            colorizeBtn.active = !colorizeBtn.active
            if(colorizeBtn.active){
                for(const todo of this._list){
                    //pega os elementos selecionados da tarefa que foi clicada
                    const fragmentMapLength = Object.keys(todo.fragmentMap).length
                    if (fragmentMapLength === 0 ) {return}
                    //trocando a cor dos elementos da tarefa
                    highlighter.highlightByID(`${TodoCreator.uuid}-priority-${todo.priority}`, todo.fragmentMap)
                }
            } else {
                //tirando a cor caso seja desativado o botão
                highlighter.clear(`${TodoCreator.uuid}-priority-Low`)
                highlighter.clear(`${TodoCreator.uuid}-priority-Normal`)
                highlighter.clear(`${TodoCreator.uuid}-priority-High`)
            }
        })
        

        //fazendo com que ao clicar apareça a lista
        const todoListBtn = new OBC.Button(this._components, {name: 'list'})
        activationButton.addChild(todoListBtn)
        todoListBtn.onClick.add(() => {todoList.visible = !todoList.visible})

        this.uiElement.set({activationButton, todoList})
    }

    get(): Todo[] {
        return this._list
    }
}