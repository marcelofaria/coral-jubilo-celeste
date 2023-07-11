import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js"

const appSettings = {
    databaseURL: "https://coral-1501e-default-rtdb.firebaseio.com/"
}

const app = initializeApp(appSettings)
const database = getDatabase(app)
const sheetsInBD = ref(database, "sheets")

//console.log(app)
//Adicionar Hinos
const inputFieldNameEl = document.getElementById("input-field-name")
const inputFieldComposerEl = document.getElementById("input-field-composer")
const inputFieldLyricsEl = document.getElementById("input-field-lyrics")
const addButtonEl = document.getElementById("add-button")
const sheetsEl = document.getElementById("sheets")

//Adicionar Hinos
addButtonEl.addEventListener("click", function(){
    let inputValue = {"name" : inputFieldNameEl.value, "composer" : inputFieldComposerEl.value, "lyrics" : inputFieldLyricsEl.value}
    
    push(sheetsInBD, inputValue)
    console.log(inputValue + " adicionado no banco de dados")
    addSheetToFront(inputFieldNameEl.value)
    clearInputField()
}) 

export function clearInputField(){
    inputFieldNameEl.value = ""
    inputFieldComposerEl.value = ""
    inputFieldLyricsEl.value = ""
}

export function addSheetToFront(inputValue){
    sheetsEl.innerHTML += `<li>${inputValue}</li>`    
}

