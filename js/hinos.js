const buttonValueFromFirstPage = localStorage.getItem('buttonValue')
const h3 = document.getElementById('h3')

// Verifica se o valor foi armazenado anteriormente
if (buttonValueFromFirstPage) {
  // Define o novo valor do botão na segunda página
  h3.innerHTML = buttonValueFromFirstPage
}

document.addEventListener("click", function(e){
    const target = e.target.closest("#button-sheets")
    let buttonName = target.textContent.trim().replace(" ","").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    let pdfLink = ""
    let mp3Link = ""

    console.log(buttonValueFromFirstPage)
    console.log(buttonName)

    switch (buttonName) {
        case "Hino1":
            switch (buttonValueFromFirstPage) {
                case "SOPRANO":
                    pdfLink = "https://drive.google.com/file/d/1cFwAtoX0_8BOa6lAQr_WGk3-C7IHnyly/preview"
                    mp3Link = "https://drive.google.com/file/d/1uTAkDUZLh3kWY0Q-TSWrpxtWI0K_kBYY/preview"
                    break;
                case "CONTRALTO":
                    pdfLink = "https://drive.google.com/file/d/1cFwAtoX0_8BOa6lAQr_WGk3-C7IHnyly/preview"
                    mp3Link = "https://drive.google.com/file/d/11B77dBr8i1lUYqIrvf8bmwuBBa1uKDFb/preview"
                    break;
                case "TENOR":
                    pdfLink = "https://drive.google.com/file/d/1cFwAtoX0_8BOa6lAQr_WGk3-C7IHnyly/preview"
                    mp3Link = "https://drive.google.com/file/d/1Z5PMQqsJcyJPnPcsmTBCNRumC0SfsZCD/preview"
                    break;  
                case "BAIXO":
                    pdfLink = "https://drive.google.com/file/d/1cFwAtoX0_8BOa6lAQr_WGk3-C7IHnyly/preview"
                    mp3Link = "https://drive.google.com/file/d/1uEWPmR278TsZB5FkSsInn2lzHAoOI8H2/preview"
                    break; 
                case "PLAYBACK":
                    pdfLink = "https://drive.google.com/file/d/1cFwAtoX0_8BOa6lAQr_WGk3-C7IHnyly/preview"
                    mp3Link = ""
                    break; 
                default:
                    console.log('Nipe não encontrado');
                    break; 
            }
            break;
        case "Hino2":
            switch (buttonValueFromFirstPage) {
                case "SOPRANO":
                    pdfLink = "https://drive.google.com/file/d/1XNk9e7sCEkh-1aVs7mrCKyjGVWntwAhE/preview"
                    mp3Link = "https://drive.google.com/file/d/1iklqmJ-XUvjeip3SuV9o9X-uSLXehGUF/preview"
                    break;
                case "CONTRALTO":
                    pdfLink = "https://drive.google.com/file/d/1XNk9e7sCEkh-1aVs7mrCKyjGVWntwAhE/preview"
                    mp3Link = "https://drive.google.com/file/d/1P5PwTDxD1Uuwjz43tGnj1oHgjyVZIetl/preview"
                    break;
                case "TENOR":
                    pdfLink = "https://drive.google.com/file/d/1XNk9e7sCEkh-1aVs7mrCKyjGVWntwAhE/preview"
                    mp3Link = "https://drive.google.com/file/d/1zdayLR5G4NQ_aEdstFXdTiypq_IBc2pP/preview"
                    break;  
                case "BAIXO":
                    pdfLink = "https://drive.google.com/file/d/1XNk9e7sCEkh-1aVs7mrCKyjGVWntwAhE/preview"
                    mp3Link = "https://drive.google.com/file/d/1PJa3JNIejCN7wkGl9W0Uez4wGzDZM6J8/preview"
                    break; 
                case "PLAYBACK":
                    pdfLink = "https://drive.google.com/file/d/1XNk9e7sCEkh-1aVs7mrCKyjGVWntwAhE/preview"
                    mp3Link = ""
                    break; 
                default:
                    console.log('Nipe não encontrado');
                    break; 
            }
            break;
        case "Hino3":
            switch (buttonValueFromFirstPage) {
                case "SOPRANO":
                    pdfLink = "https://drive.google.com/file/d/1PIV1NmHubvwLj9KcIJcK5GRptwXBzL3R/preview"
                    mp3Link = "https://drive.google.com/file/d/1R5PL8bqsfYM2h5QDRVAeasxqzA3lOYSn/preview"
                    break;
                case "CONTRALTO":
                    pdfLink = "https://drive.google.com/file/d/1PIV1NmHubvwLj9KcIJcK5GRptwXBzL3R/preview"
                    mp3Link = "https://drive.google.com/file/d/1w0pELJBT3mqYxXcRzZaEWMn8U01uxUY7/preview"
                    break;
                case "TENOR":
                    pdfLink = "https://drive.google.com/file/d/1PIV1NmHubvwLj9KcIJcK5GRptwXBzL3R/preview"
                    mp3Link = "https://drive.google.com/file/d/1jOTEVGzFeJV8QP8BIDbekFNhpohA3kid/preview"
                    break;  
                case "BAIXO":
                    pdfLink = "https://drive.google.com/file/d/1PIV1NmHubvwLj9KcIJcK5GRptwXBzL3R/preview"
                    mp3Link = "https://drive.google.com/file/d/1iy0aWPGK-G_QRE0mQa-uTqhLsyXzOan9/preview"
                    break; 
                case "PLAYBACK":
                    pdfLink = "https://drive.google.com/file/d/1PIV1NmHubvwLj9KcIJcK5GRptwXBzL3R/preview"
                    mp3Link = ""
                    break; 
                default:
                    console.log('Nipe não encontrado');
                    break; 
            }
            break;
        case "Hino4":
            switch (buttonValueFromFirstPage) {
                case "SOPRANO":
                    pdfLink = "https://drive.google.com/file/d/1-UO3EL42Cy_wdMhdpF0AkaPUTnD6wDnO/preview"
                    mp3Link = "https://drive.google.com/file/d/1uQjErh1nk2YOZLUuQ46-O1puiobW2Nh1/preview"
                    break;
                case "CONTRALTO":
                    pdfLink = "https://drive.google.com/file/d/1-UO3EL42Cy_wdMhdpF0AkaPUTnD6wDnO/preview"
                    mp3Link = "https://drive.google.com/file/d/1i9YDUsPEzfV-sL9AnGk5Mkt67KqvMWf4/preview"
                    break;
                case "TENOR":
                    pdfLink = "https://drive.google.com/file/d/1-UO3EL42Cy_wdMhdpF0AkaPUTnD6wDnO/preview"
                    mp3Link = "https://drive.google.com/file/d/1CCTbqEarmu79JZ9kqpYyokpZh0c-2V_X/preview"
                    break;  
                case "BAIXO":
                    pdfLink = "https://drive.google.com/file/d/1-UO3EL42Cy_wdMhdpF0AkaPUTnD6wDnO/preview"
                    mp3Link = "https://drive.google.com/file/d/1tlykQ9yQAs_EapHEM06KAqhsKkRiUSgY/preview"
                    break; 
                case "PLAYBACK":
                    pdfLink = "https://drive.google.com/file/d/1-UO3EL42Cy_wdMhdpF0AkaPUTnD6wDnO/preview"
                    mp3Link = ""
                    break; 
                default:
                    console.log('Nipe não encontrado');
                    break; 
            }
            break;
        case "Hino5":
            switch (buttonValueFromFirstPage) {
                case "SOPRANO":
                    pdfLink = "https://drive.google.com/file/d/1YaA39Aj9-QTTYbVJ1oTE0KCwjqYBo1zn/preview"
                    mp3Link = "https://drive.google.com/file/d/1iW8vdliulKFZQy8FNvsWFhotGey4pN6P/preview"
                    break;
                case "CONTRALTO":
                    pdfLink = "https://drive.google.com/file/d/1YaA39Aj9-QTTYbVJ1oTE0KCwjqYBo1zn/preview"
                    mp3Link = "https://drive.google.com/file/d/1R7DkrrK3Ceu0goUHGLExper5G-hHC4nk/preview"
                    break;
                case "TENOR":
                    pdfLink = "https://drive.google.com/file/d/1YaA39Aj9-QTTYbVJ1oTE0KCwjqYBo1zn/preview"
                    mp3Link = "https://drive.google.com/file/d/17ibuGsRHoQoEjz8PWXDTtLOSEnmwq4I2/preview"
                    break;  
                case "BAIXO":
                    pdfLink = "https://drive.google.com/file/d/1YaA39Aj9-QTTYbVJ1oTE0KCwjqYBo1zn/preview"
                    mp3Link = "https://drive.google.com/file/d/17bg8S9W8wFgQuA9zEdQN3i5rMBn4M3no/preview"
                    break; 
                case "PLAYBACK":
                    pdfLink = "https://drive.google.com/file/d/1YaA39Aj9-QTTYbVJ1oTE0KCwjqYBo1zn/preview"
                    mp3Link = ""
                    break; 
                default:
                    console.log('Nipe não encontrado');
                    break; 
            }
            break;
        case "Hino6":
            switch (buttonValueFromFirstPage) {
                case "SOPRANO":
                    pdfLink = "https://drive.google.com/file/d/1K_BgS5GunWUdXwrIdD3vnF2LF0TG3z1x/preview"
                    mp3Link = "https://drive.google.com/file/d/1Et1X87PhB8W2z4sacUILVp-dzV8Fw5VI/preview"
                    break;
                case "CONTRALTO":
                    pdfLink = "https://drive.google.com/file/d/1K_BgS5GunWUdXwrIdD3vnF2LF0TG3z1x/preview"
                    mp3Link = "https://drive.google.com/file/d/1YNpElFyubu3ho11_l0ApLuQvCPxK58Kd/preview"
                    break;
                case "TENOR":
                    pdfLink = "https://drive.google.com/file/d/1K_BgS5GunWUdXwrIdD3vnF2LF0TG3z1x/preview"
                    mp3Link = "https://drive.google.com/file/d/1o__BqweTAV0X2vGYQnqwSoKYbvFmA3cz/preview"
                    break;  
                case "BAIXO":
                    pdfLink = "https://drive.google.com/file/d/1K_BgS5GunWUdXwrIdD3vnF2LF0TG3z1x/preview"
                    mp3Link = "https://drive.google.com/file/d/1Yvg8MK4cHkxeF3CF1AFfJcWONMzcf4CW/preview"
                    break; 
                case "PLAYBACK":
                    pdfLink = "https://drive.google.com/file/d/1K_BgS5GunWUdXwrIdD3vnF2LF0TG3z1x/preview"
                    mp3Link = ""
                    break; 
                default:
                    console.log('Nipe não encontrado');
                    break; 
            }
            break;
        case "Hino7":
            switch (buttonValueFromFirstPage) {
                case "SOPRANO":
                    pdfLink = "https://drive.google.com/file/d/1vf8qHYoql0kfstsAHto8228QV4zsvL5w/preview"
                    mp3Link = "https://drive.google.com/file/d/1jHKNPd0Xs509N0JYrYWny131OSjOKbWA/preview"
                    break;
                case "CONTRALTO":
                    pdfLink = "https://drive.google.com/file/d/1vf8qHYoql0kfstsAHto8228QV4zsvL5w/preview"
                    mp3Link = "https://drive.google.com/file/d/1z5u06Dj5oNxOHDIfmBiKrfPY0qFyJTyo/preview"
                    break;
                case "TENOR":
                    pdfLink = "https://drive.google.com/file/d/1vf8qHYoql0kfstsAHto8228QV4zsvL5w/preview"
                    mp3Link = "https://drive.google.com/file/d/1uv6ummJI4I6DYkcme_YJcJaAW0-uMMKi/preview"
                    break;  
                case "BAIXO":
                    pdfLink = "https://drive.google.com/file/d/1vf8qHYoql0kfstsAHto8228QV4zsvL5w/preview"
                    mp3Link = "https://drive.google.com/file/d/1pLFaVxNIWNec-VQfa4HHu3dsG2V7IdXQ/preview"
                    break; 
                case "PLAYBACK":
                    pdfLink = "https://drive.google.com/file/d/1vf8qHYoql0kfstsAHto8228QV4zsvL5w/preview"
                    mp3Link = ""
                    break; 
                default:
                    console.log('Nipe não encontrado');
                    break; 
            }
            break;
        case "Hino8":
            switch (buttonValueFromFirstPage) {
                case "SOPRANO":
                    pdfLink = "https://drive.google.com/file/d/1o1zb-7l3JoLCPj9GhZ5A2FV51ivsg_ez/preview"
                    mp3Link = "https://drive.google.com/file/d/1bTl1bIBKIE-r4rRhWjjTfkHZ6gEKk0EU/preview"
                    break;
                case "CONTRALTO":
                    pdfLink = "https://drive.google.com/file/d/1o1zb-7l3JoLCPj9GhZ5A2FV51ivsg_ez/preview"
                    mp3Link = "https://drive.google.com/file/d/1uO-fY4-s4H2dtwijkaeafvYy3T-4Ytrq/preview"
                    break;
                case "TENOR":
                    pdfLink = "https://drive.google.com/file/d/1o1zb-7l3JoLCPj9GhZ5A2FV51ivsg_ez/preview"
                    mp3Link = "https://drive.google.com/file/d/1oSl-o6N1C2quF_Orqn_OrIFztUPvDdrU/preview"
                    break;  
                case "BAIXO":
                    pdfLink = "https://drive.google.com/file/d/1o1zb-7l3JoLCPj9GhZ5A2FV51ivsg_ez/preview"
                    mp3Link = "https://drive.google.com/file/d/1_HfxUBE0ra3N_S9AZ33cI88ht_ZCh0K-/preview"
                    break; 
                case "PLAYBACK":
                    pdfLink = "https://drive.google.com/file/d/1o1zb-7l3JoLCPj9GhZ5A2FV51ivsg_ez/preview"
                    mp3Link = ""
                    break; 
                default:
                    console.log('Nipe não encontrado');
                    break; 
             }
            break;
        case "Hino9":
            switch (buttonValueFromFirstPage) {
                case "SOPRANO":
                    pdfLink = "https://drive.google.com/file/d/1MSn-JAv-MvInMKoJq7TSOlyIawYuOiQV/preview"
                    mp3Link = "https://drive.google.com/file/d/1piifisp3_NpB7Zf4k81STxa7M_Z1Ef4g/preview"
                    break;
                case "CONTRALTO":
                    pdfLink = "https://drive.google.com/file/d/1MSn-JAv-MvInMKoJq7TSOlyIawYuOiQV/preview"
                    mp3Link = "https://drive.google.com/file/d/13aCIhXcpQq_bvmmSn0KmbmDdII0FhGMJ/preview"
                    break;
                case "TENOR":
                    pdfLink = "https://drive.google.com/file/d/1MSn-JAv-MvInMKoJq7TSOlyIawYuOiQV/preview"
                    mp3Link = "https://drive.google.com/file/d/1zevm3WD2ld92bOfwGKaoDaaFDhMftklP/preview"
                    break;  
                case "BAIXO":
                    pdfLink = "https://drive.google.com/file/d/1MSn-JAv-MvInMKoJq7TSOlyIawYuOiQV/preview"
                    mp3Link = "https://drive.google.com/file/d/1c5lhndqaZ1pAIVHi1WJS2Qx_KDca1VEe/preview"
                    break;
                case "PLAYBACK":
                    pdfLink = "https://drive.google.com/file/d/1MSn-JAv-MvInMKoJq7TSOlyIawYuOiQV/preview"
                    mp3Link = ""
                    break; 
                default:
                    console.log('Nipe não encontrado');
                    break; 
            }
            break;
        case "Hino10":
            switch (buttonValueFromFirstPage) {
                case "SOPRANO":
                    pdfLink = "https://drive.google.com/file/d/1v7tKXX3HGx3zTmHe_cGS-KWoB-Ss0Sla/preview"
                    mp3Link = "https://drive.google.com/file/d/1fJAw-1cCiD6NBoh2ZzlZSSU1qzWz3YPK/preview"
                    break;
                case "CONTRALTO":
                    pdfLink = "https://drive.google.com/file/d/1v7tKXX3HGx3zTmHe_cGS-KWoB-Ss0Sla/preview"
                    mp3Link = "https://drive.google.com/file/d/1sc_360c6yKqnEgXoaCR1ym1QExugk9dH/preview"
                    break;
                case "TENOR":
                    pdfLink = "https://drive.google.com/file/d/1v7tKXX3HGx3zTmHe_cGS-KWoB-Ss0Sla/preview"
                    mp3Link = "https://drive.google.com/file/d/1-EU9TYSGqsSD_fdyC6Oil8ZMw4HJscAp/preview"
                    break;  
                case "BAIXO":
                    pdfLink = "https://drive.google.com/file/d/1v7tKXX3HGx3zTmHe_cGS-KWoB-Ss0Sla/preview"
                    mp3Link = "https://drive.google.com/file/d/1cAdmK5lj7uNRWwP1k-5rJVq9SqwxjLBb/preview"
                    break;
                case "PLAYBACK":
                    pdfLink = "https://drive.google.com/file/d/1v7tKXX3HGx3zTmHe_cGS-KWoB-Ss0Sla/preview"
                    mp3Link = ""
                    break; 
                default:
                    console.log('Nipe não encontrado');
                    break; 
            }
            break;
        default:
            console.log('Hino não encontrado');
            break;
    }

    mp3Link = mp3Link.replace("https://drive.google.com/file/d/", "")
    mp3Link = mp3Link.replace("/preview", "")
    console.log(pdfLink)
    console.log(mp3Link)

    const iframeHtml = `
                        <iframe src="${pdfLink}" 
                            class="a" allow="autoplay"
                            style="                                
                                width: 99%; 
                                height: 70%;
                                top: 50%;
                                left: 50%;">
                        </iframe>
                        <br>
                        <audio 
                            style="
                                width: 100%;
                                height: 40px;
                                vertical-align: middle;
                            "
                            controls="controls" 
                            src="https://docs.google.com/uc?export=open&amp;id=${mp3Link}" 
                            type="audio/mp3">
                        </audio>`;
    localStorage.setItem('divValue', iframeHtml)
    window.open("nipe.html", "_self")
})

