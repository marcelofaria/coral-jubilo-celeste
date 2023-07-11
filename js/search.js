import { initializeApp } from "firebase/app"
import { getDatabase, ref} from "firebase/firestore/lite"
//import { collection, query, where } from "firebase/firestore/lite";

const appSettings = {
    databaseURL: "https://coral-1501e-default-rtdb.firebaseio.com/"
}

const app = initializeApp(appSettings)
const database = getDatabase(app)
const sheetsInBD = ref(database, "sheets")
//const sheetsInBDCol = collection(database, "sheets");

//Buscar Hinos
const inputFieldSearchEl = document.getElementById("input-field-search")
const searchButtonEl = document.getElementById("search-button")
const textParagraphEL = document.getElementById("p")
const buscaComboEl = document.getElementById("busca")
const sheetsEl = document.getElementById("sheets-search")

//const q = query(sheetsInBDCol, where("composer", "==", "Jayme"))

//console.log(q)

/* onValue(sheetsInBD, function(snapshot){
    snapshot = snapshot.child('sheets').equalTo('John Doe').on
    let sheetsArray = Object.values(snapshot.val())
    for (let i = 0; i < sheetsArray.length; i++) {
        let currentSheet = sheetsArray[i]
        addFoundSheets(currentSheet)
    }
}) */


//Buscar Hinos
/* searchButtonEl.addEventListener("click", function(){
    let inputValue = inputFieldSearchEl.value
    
    //push(sheetsInBD, inputValue)
    //console.log(inputValue + " adicionado no banco de dados")
    addSheetToFront(inputFieldNameEl.value)
    clearInputField()
}) */

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
    default:
        console.log(`Err`);
    }
})


export function clearInputFieldSearch(){
    inputFieldSearchEl.value = ""
}

export function addFoundSheets(inputValue){
    textParagraphEL.innerHTML = "Hinos Encontrados: "
    sheetsEl.innerHTML += `<li>${inputValue}</li>`    
}