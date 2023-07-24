const sheetsEl = document.getElementById("sheets")
const body = document.getElementById("bodyResults")
const divValue = localStorage.getItem('divValue')

// Verifica se o valor foi armazenado anteriormente
if (divValue) {
  // Define o novo valor do botão na segunda página
  //const iframeElement = document.createElement('div');
  body.innerHTML += divValue;
}
