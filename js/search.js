import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"
import { getDatabase, ref, onValue} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js"
import { getStorage, ref as sRef, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";

const appSettings = {
    databaseURL: "https://coral-1501e-default-rtdb.firebaseio.com/",
    storageBucket:"gs://coral-1501e.appspot.com"
}

const app = initializeApp(appSettings)
const database = getDatabase(app)
const storage = getStorage();
const sheetsInBD = ref(database, "sheets")

//Buscar Hinos
const inputFieldSearchEl = document.getElementById("input-field-search")

const searchButtonEl = document.getElementById("search-button")

const textParagraphEL = document.getElementById("p")
const buscaComboEl = document.getElementById("busca")
const sheetsEl = document.getElementById("sheets-search")

const bodyEl = document.getElementById("bodyResults")

let auxButton = 0

searchButtonEl.addEventListener("click", function(){
    clearInputFieldSearch()
    onValue(sheetsInBD, function(snapshot){
        let sheetsArray = Object.values(snapshot.val())
        for (let i = 0; i < sheetsArray.length; i++) {
            let currentSheet = sheetsArray[i]
            console.log(currentSheet)            
            switch (buscaComboEl.value) {
                case "name":
                    if(currentSheet.name.toUpperCase().includes(inputFieldSearchEl.value.toUpperCase()))
                        addFoundSheets(currentSheet.name)
                    break;
                case "composer":
                    if(currentSheet.composer.toUpperCase().includes(inputFieldSearchEl.value.toUpperCase()))
                        addFoundSheets(currentSheet.name)
                    break;
                case "lyrics":
                    if(currentSheet.lyrics.toUpperCase().includes(inputFieldSearchEl.value.toUpperCase()))
                        addFoundSheets(currentSheet.name)
                    break;
                    case "category":
                    if(currentSheet.category.toUpperCase().includes(inputFieldSearchEl.value.toUpperCase()))
                        addFoundSheets(currentSheet.name)
                    break;
                default:
                    console.log(`Err`);
                }
        }
    })
})

buscaComboEl.addEventListener("change", function(){
    switch (buscaComboEl.value) {
    case "name":
        inputFieldSearchEl.placeholder = "Busca por Título do Hino"
        break;
    case "composer":
        inputFieldSearchEl.placeholder = "Busca por Compositor, Letrista, ..."
        break;
    case "lyrics":
        inputFieldSearchEl.placeholder = "Busca por Estrofe ou Côro"
        break;
        case "category":
        inputFieldSearchEl.placeholder = "Busca por Categoria"
        break;
    default:
        console.log(`Err`)
    }
})


function clearInputFieldSearch(){
    //inputFieldSearchEl.value = ""
    sheetsEl.innerHTML = ""
}

function addFoundSheets(inputValue){
    textParagraphEL.innerHTML = "Hinos Encontrados: "
    auxButton++
    sheetsEl.innerHTML += `<li id="li-reference">${inputValue}</li>
                           <button id="download-button" class="download">
                               <img id="img-reference" class="ico" src="../assets/download.png">
                               Baixar: <br> ${inputValue}
                            </button>
                           <hr class="rounded">`
}

function updateBtnReference(){
    let btnId = document.getElementById("sheets-search").getElementsByTagName("li")
    let downloadButtonEl = document.getElementById("add-button" + btnId)
    return downloadButtonEl
}

//Baixar Hinos
document.addEventListener("click", function(e){
    const target = e.target.closest("#download-button")
    console.log(target)
    let sheetName = target.textContent.replace("Baixar: ", "")
    sheetName = sheetName.trim().replace(" ","").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    
    if(target){
        //window.location.replace("../html/results.html");        
        //var win = window.open("../html/results.html")
        downloadFile(sheetName)
      //passar pro dowload file o parametro certinho
    }
    
})

function downloadFile(fileName){
    
    console.log(fileName)
    getDownloadURL(sRef(storage, fileName)).then((url) => {
        console.log(url)
        // 'url' is the download URL for fileName
        // This can be downloaded directly:
        const xhr = new XMLHttpRequest()
        xhr.responseType = 'blob'
        xhr.onload = (event) => {
        const blob = xhr.response
        };
        xhr.open('GET', url)
        xhr.send()

        // Or inserted into an <img> element
        window.open(encodeURI(url))
        //target.document.body.innerHTML += `<object type="application/pdf" id="object-pdf" data=${url}+"#zoom=80">`
        //const object = document.getElementById('object-pdf')
        //console.log(target)
        //object.setAttribute('data', url+"#zoom=80")
        //bodyEl.appendChild(object)
    })
    .catch((error) => {
        // Handle any errors
    });
}
