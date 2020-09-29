const toggleButton = document.getElementById('nav-toggle-btn')
const navbarHiddenLinks = document.getElementById("navLinks")
const searchPacks = document.getElementById("searchPacks")
const searchPacksList = document.getElementById("searchPacksList")

toggleButton.addEventListener('click', function() {
    navbarHiddenLinks.style.display = 'flex'
})

window.addEventListener('click', function(){
    if (document.activeElement.id !== 'navLinks' && document.activeElement.id !== 'nav-toggle-btn'){
        navbarHiddenLinks.style.display = 'none'
    }
})


searchPacks.addEventListener("input", function(){
    let text = searchPacks.value.toLowerCase().trimLeft()
    text = text.replace(/\s\s+/g, ' ')
    if (text == "") {
        searchPacksList.style.display = 'none'
    } else {
        const xSearch = new XMLHttpRequest()
        xSearch.open('GET', `/pack/search/${text}`, true)
        xSearch.onload = function () {
            searchPacksList.innerHTML = ""
            searchPacksList.style.display = 'flex'
            const result = JSON.parse(this.responseText)
            result.forEach( (x) => {
                output = `<li onClick="goTo('${x.packID}')"><span>${x.packName}</span></li>`
                    searchPacksList.insertAdjacentHTML('beforeend', output)
            })
        }
        xSearch.send()
    }
})

searchPacks.addEventListener("focus", function(){
    let text = searchPacks.value.toLowerCase().trimLeft()
    text = text.replace(/\s\s+/g, ' ')
    if (text != "") {
        searchPacksList.style.display = 'flex'
    }
})

window.addEventListener('click', function(){
    if (document.activeElement.id !== 'searchPacksList' && document.activeElement.id !== 'searchPacks'){
        searchPacksList.style.display = 'none'
    }
})

function goTo(packID) {
    window.open(`/pack/${packID}`, '_top')
}