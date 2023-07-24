document.addEventListener("click", function(e){
    const target = e.target.closest("#n-button")
    let pageName = target.textContent
    
    console.log(pageName)
    localStorage.setItem('buttonValue', pageName.trim().replace(" ","").normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
    window.open("hinos.html","_self").focus()
}) 
