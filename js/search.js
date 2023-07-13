import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"
import { getDatabase, ref, onValue} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js"
/* import { collection, query } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js" */

const appSettings = {
    databaseURL: "https://coral-1501e-default-rtdb.firebaseio.com/"
}

const app = initializeApp(appSettings)
const database = getDatabase(app)
const sheetsInBD = ref(database, "sheets")

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
/* const firebaseConfig = {
  apiKey: "AIzaSyA3dRIlz2oYMs4yNf9efmhDjJ-57m8Hqhs",
  authDomain: "coral-1501e.firebaseapp.com",
  projectId: "coral-1501e",
  storageBucket: "coral-1501e.appspot.com",
  messagingSenderId: "173631824401",
  appId: "1:173631824401:web:858b58838fa28428d3c7b0",
  measurementId: "G-1JN4F7C6JC"
};

const application = initializeApp(firebaseConfig)

const db = getFirestore(application);
//console.log(db)
const sheetsInBDCol = collection(db, "sheets"); */

//Buscar Hinos
const inputFieldSearchEl = document.getElementById("input-field-search")
const searchButtonEl = document.getElementById("search-button")
const textParagraphEL = document.getElementById("p")
const buscaComboEl = document.getElementById("busca")
const sheetsEl = document.getElementById("sheets-search")

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
        console.log(`Err`);
    }
})


export function clearInputFieldSearch(){
    //inputFieldSearchEl.value = ""
    sheetsEl.innerHTML = ""
}

export function addFoundSheets(inputValue){
    textParagraphEL.innerHTML = "Hinos Encontrados: "
    sheetsEl.innerHTML += `<li>${inputValue}</li>`    
}