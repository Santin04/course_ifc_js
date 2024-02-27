import { TodoCreator } from './bim-components/TodoCreator'
import * as OBC from 'openbim-components'
import { FragmentsGroup } from 'bim-fragment'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Iproject, projectStatus, projectUserRole } from './class/project'
import { ProjectManager } from './class/projectManager';

//mostrando o formulário quando clica no botão
function showModal(id: string) {
    const modal = document.querySelector(id)
    //verifica se o modal existe e se o modal é um Dialog element, assim tirando o erro
    if (modal && modal instanceof HTMLDialogElement){
        modal.showModal();
    } else {
        console.warn('modal not found')
    }
}

//faz com que o formulário saia da frente da tela
function closeModal(id: string) {
    const modal = document.querySelector(id)
    //verifica se o modal existe e se o modal é um Dialog element, assim tirando o erro
    if (modal && modal instanceof HTMLDialogElement){
        modal.close();
    } else {
        console.warn('modal not found')
    } 
}

//fazendo com que o objeto com o dados do formulário vão para a tela como novo projeto
const projectListUI = document.querySelector('#projects-list') as HTMLElement
const projectManager = new ProjectManager(projectListUI)

//passando a função de exibir o formulário para o botão New Project
const newProjectBtn = document.querySelector('#new-project-btn');
if (newProjectBtn){
    newProjectBtn.addEventListener('click',() => showModal('#new-project-modal'));
} else {
    console.warn('New projects button not found')
}

const projectForm = document.querySelector('#new-project-form')
if (projectForm && projectForm instanceof HTMLFormElement){
    projectForm.addEventListener('submit', (e) => {
    //nnão executa os comandos padrões do botão
    e.preventDefault();
    //obtem os valores passado para o formulário
    const formData = new FormData(projectForm);

    let info: Iproject = {
        'name': formData.get('name') as string,
        'description': formData.get('description') as string,
        "status": formData.get('status') as projectStatus,
        'userRole': formData.get('userRole') as projectUserRole,
        'finishDate': new Date(formData.get('finishDate')as string),
    }

    //verificando se já existe projeto com o mesmo nome
    try {
        const project = projectManager.newProject(info)
        projectForm.reset()
        closeModal('new-project-modal')
    } catch (err) {
        alert(err)
    }})
} else {
    console.warn('the forma form was not found')
}

//fazendo o botão de cancelar do formulário funcionar
const cancelBtn = document.querySelector('#button-cancel')
cancelBtn?.addEventListener('click', () => {closeModal('#new-project-modal')})


const exportProjectsBtn = document.querySelector('#export-projects-btn')
if (exportProjectsBtn) {
    exportProjectsBtn.addEventListener('click', () => {
        projectManager.exportToJSON()
    })
}

const importProjectsBtn = document.querySelector('#import-projects-btn')
if (importProjectsBtn){
    importProjectsBtn.addEventListener('click', () => {
        projectManager.importToJSON()
    })
}


//criou o viewer
const viewer = new OBC.Components()

//criou a cena
const sceneComponent = new OBC.SimpleScene(viewer)
sceneComponent.setup() //usa uma iluminação que está pronta para esse visualizador
viewer.scene = sceneComponent
const scene = sceneComponent.get()
scene.background = null

//criando o renderer e definindo aonde ele vai renderizar o ifc
const viewerContainer = document.querySelector('#viewer-container') as HTMLElement
const rendererComponent = new OBC.PostproductionRenderer(viewer, viewerContainer)
viewer.renderer = rendererComponent

//criando a camera, essa camera já vem com a vista em órbita e não precisa da função com loop infinito
const cameraComponent = new OBC.OrthoPerspectiveCamera(viewer)
viewer.camera = cameraComponent

const raycasterComponent = new OBC.SimpleRaycaster(viewer)
viewer.raycaster = raycasterComponent

//inicializando o viewer
viewer.init()
//faz com que ajuste a dimensão dos elementos, deixando-os nas medidas corretamente
cameraComponent.updateAspect()
//deixa mais nitido as linhas do desenho 3D
rendererComponent.postproduction.enabled = true

//fazendo com que ao passar o arquivo ele baixe uma cópia no seu pc
const fragmentManager = new OBC.FragmentManager(viewer)
function exportFragments(model: FragmentsGroup){
    const fragmentBinary = fragmentManager.export(model)
    const blob = new Blob([fragmentBinary])
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${model.name.replace(".ifc", "")}.frag`
    a.click()
    URL.revokeObjectURL(url)
}

//criando os elementos HTML que recebe o arquivo ifc
const ifcLoader = new OBC.FragmentIfcLoader(viewer)
ifcLoader.settings.wasm = {
    path: "https://unpkg.com/web-ifc@0.0.43/",
    absolute: true
}

//faz com que mude decor ao passar o mouse, e que selecione quando clica
const highLighter = new OBC.FragmentHighlighter(viewer)
highLighter.setup()

//criando o elemento que vai fazer com que apareça as especificações da entidade
const propertiesProcessor = new OBC.IfcPropertiesProcessor(viewer)
//fazendo com que limpe as caixinha de especificações quando clicar em outro componente
highLighter.events.select.onClear.add(() => {
    propertiesProcessor.cleanPropertiesList()
})

//separando os elementos por grupo
const classifier = new OBC.FragmentClassifier(viewer)
//Criando o campo onde fica os grupos de elementoss
const classificationWindow = new OBC.FloatingWindow(viewer)
//deixando a caixinha de grupo normalmente fechada
classificationWindow.visible = false
viewer.ui.add(classificationWindow)
classificationWindow.title = 'GRUPOS DA OBRA'

//Criando um botão para aparecer a caixa de grupos
const classificationsBtn = new OBC.Button(viewer)
classificationsBtn.materialIcon = "account_tree"
classificationsBtn.onClick.add(() => {
    classificationWindow.visible = !classificationWindow.visible
    classificationsBtn.active = classificationWindow.visible
})

//fazendo com que as entidades apareçam no campo de grupos
async function createModelThree(){
    const fragmentThree = new OBC.FragmentTree(viewer)
    await fragmentThree.init()
    await fragmentThree.update(['storeys', 'entities'])
    //faz com que ao passar o mouse no grupo, mude de cor no desenho
    fragmentThree.onHovered.add((fragmentMap) => {
        highLighter.highlightByID('hover', fragmentMap)
    })
    //faz com que ao selecionar o grupo, mude de cor no desenho
    fragmentThree.onSelected.add((fragmentMap) => {
        highLighter.highlightByID('select', fragmentMap)
    })
    //adicionando os grupos na caixinha de grupos
    const three = fragmentThree.get().uiElement.get("tree")
    return three
}

//calma
const culler = new OBC.ScreenCuller(viewer)
cameraComponent.controls.addEventListener('sleep', () => {
    culler.needsUpdate = true
})

//função que carrega tudo ao 
async function onModelLoaded(model: FragmentsGroup){
    //deixando possível o hover e o click nas entidades
    highLighter.update()
    //calma
    for (const fragment of model.items){culler.add(fragment.mesh)}
    culler.needsUpdate = true
    try {
        //separando em grupos os andares
    classifier.byStorey(model)
    //separando em grupos as entidades
    classifier.byEntity(model)
    //chamando a função que aparece o campo que mostra os grupos separados
    const three = await createModelThree()
    await classificationWindow.slots.content.dispose(true) //faz com apareça somente os grupos do 1°
    classificationWindow.addChild(three)

    //faz com que ao clicar no objeto, mostre as caracteristicas dele em uma caixinha
    propertiesProcessor.process(model)
    highLighter.events.select.onHighlight.add((fragmentMap) => {
        const expressID = [...Object.values(fragmentMap)[0]][0]
        propertiesProcessor.renderProperties(model, Number(expressID))
    })
    } catch (error) {
        alert(error)
    }
    
}

ifcLoader.onIfcLoaded.add(async (model) => {
    //chamando a função assim baixando uma cópia no seu pc
    // exportFragments(model)
    //chamando a função que carrega tudo ao receber o arquivo
    onModelLoaded(model)
})

fragmentManager.onFragmentsLoaded.add((model) => {
    model.properties = {}
    onModelLoaded(model)
})

//criando o botão que baixa o arquivo
const importFragment = new OBC.Button(viewer)
importFragment.materialIcon = "upload"
importFragment.tooltip = 'Load FRAG'
importFragment.onClick.add(() => {
    const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.frag'
        const reader = new FileReader()
        reader.addEventListener('load',async () => {
            const binary = reader.result
            if (!(binary instanceof ArrayBuffer)) {return}
            const fragmentBinary = new Uint8Array(binary)
            await fragmentManager.load(fragmentBinary)
        })
        input.addEventListener('change', () => {
            const filesList = input.files
            if (!filesList) {return}
            reader.readAsArrayBuffer(filesList[0])
        })
        input.click()
})

const todoCreator = new TodoCreator(viewer)
await todoCreator.setup()

const toolbar = new OBC.Toolbar(viewer)
toolbar.addChild(
    ifcLoader.uiElement.get("main"),
    //adicionando o botão que importa o arquivo
    // importFragment,
    //adicionadno o botão que coloca a caixinha de grupos
    classificationsBtn,
    //adicionando o botão que mostra as especificações da entidade
    propertiesProcessor.uiElement.get('main'),
    fragmentManager.uiElement.get('main'),
    todoCreator.uiElement.get('activationButton')
)
viewer.ui.addToolbar(toolbar)