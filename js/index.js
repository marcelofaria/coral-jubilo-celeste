import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js"
import { getStorage, ref as sRef, uploadBytes, uploadBytesResumable } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";

const appSettings = {
    databaseURL: "https://coral-1501e-default-rtdb.firebaseio.com/",
    storageBucket:"gs://coral-1501e.appspot.com"
}

const app = initializeApp(appSettings)
const database = getDatabase(app)
const sheetsInBD = ref(database, "sheets")
const storage = getStorage();

//console.log(app)
//Adicionar Hinos
const inputFieldNameEl = document.getElementById("input-field-name")
const inputFieldComposerEl = document.getElementById("input-field-composer")
const inputFieldLyricsEl = document.getElementById("input-field-lyrics")
const inputFieldCategoryEl = document.getElementById("input-field-category")
const addButtonEl = document.getElementById("add-button") 
const addFileEl = document.getElementById("input-file")
const sheetsEl = document.getElementById("sheets")
const fileProgressEl = document.getElementById("file-progress")
const paragraphEl = document.getElementById("sheets-added")

addFileEl.onchange = () => {
    let selectedFile = addFileEl.files[0];
    console.log(selectedFile);
    try {
        uploadFile(inputFieldNameEl.value, selectedFile) 
     }
     catch (e) {
        // declarações para manipular quaisquer exceções
        fileProgressEl.innerHTML = "Antes de anexar o arquivo, insira as informações do Hino!"
        fileProgressEl.style.color = "red"
        fileProgressEl.style.backgroundColor = "floralwhite"
        fileProgressEl.style.fontSize = "20px"
        fileProgressEl.style.textAlign = "center"
        inputFieldNameEl.focus()        
     }
}

//Adicionar Hinos
addButtonEl.addEventListener("click", function(){
    let inputValue = {"name" : inputFieldNameEl.value, "composer" : inputFieldComposerEl.value, "lyrics" : inputFieldLyricsEl.value, "category": inputFieldCategoryEl.value}
    
    push(sheetsInBD, inputValue)
    console.log(inputValue + " adicionado no banco de dados")
    addSheetToFront(inputFieldNameEl.value)
    clearInputField()
}) 

function clearInputField(){
    inputFieldNameEl.value = ""
    inputFieldComposerEl.value = ""
    inputFieldLyricsEl.value = ""
    inputFieldCategoryEl.value = ""
}

function addSheetToFront(inputValue){
    paragraphEl.innerHTML = "Hinos adicionados Recentemente:"
    sheetsEl.innerHTML += `<li>${inputValue}</li>`    
}

function uploadFile(fileName, file) {

    let storageRef = sRef(storage, fileName);
    // "file" comes from the Blob or File API
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on("state_changed", 
    (snapshot) => {
      // Observe state change events such as progress, pause, and resume
      // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
      console.log(snapshot.bytesTransferred + " " + snapshot.totalBytes)
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      fileProgressEl.innerHTML = "Subindo arquivo: " + Math.round(progress) + "% Concluido"
      console.log("Subindo arquivo: " + Math.round(progress) + "% Concluido");
      switch (snapshot.state) {
        case "paused":
          console.log("Upload is paused");
          break;
        case "running":
          console.log("Upload is running");
          break;
      }
    }, 
    (error) => {
        //err
    }, 
    () => {
      // Handle successful uploads on complete
      // For instance, get the download URL: https://firebasestorage.googleapis.com/...
      fileProgressEl.innerHTML = "Anexo carregado!"
    }
  );
  
}