const createButton = document.getElementById("createButton")
const createAddName = document.getElementById("createAddName")
const createAddList = document.getElementById("createAddList")
const createResult = document.getElementById("createResult")
const createAllNames = document.getElementById("createAllNames")

createButton.addEventListener("click", function() {
    document.querySelector(".form-create-back").style.display = "flex";
})

document.querySelector(".form-create-close").addEventListener("click", function() {
    document.querySelector(".form-create-back").style.display = "none";
    createAddName.style.display = "none";
    document.querySelector(".create-name-btn").style.display = "inline";
})

document.getElementById("createAddNameButton").addEventListener("click", function(){
    createAddName.style.display = "inline";
    createAddName.focus()
    document.querySelector(".create-name-btn").style.display = "none";
})

createAddName.addEventListener("input", function(){
    let text = createAddName.value.toLowerCase().trimLeft()
    text = text.replace(/\s\s+/g, ' ')
    if (text == "") {
        createAddList.style.display = 'none'
        calShow = false
    } else {
        const xCreate = new XMLHttpRequest()
        xCreate.open('GET', `/create/getuser/${text}`, true)
        xCreate.onload = function () {
            createAddList.innerHTML = ""
            createAddList.style.display = 'flex'
            calShow = true
            const result = JSON.parse(this.responseText)
            result.forEach( (x) => {
                output = `<li id="id::${x.id}" onclick="createMoveName('${x.id}', '${x.name}')">
                            <img src="${x.pic}"><span>${x.name}</span>
                        </li>`
                createAddList.insertAdjacentHTML('beforeend', output)
            })
        }
        xCreate.send()
    }
})

createAddName.addEventListener("focus", function(){
    let text = createAddName.value.toLowerCase().trimLeft()
    text = text.replace(/\s\s+/g, ' ')
    if (text != "") {
        createAddList.style.display = 'flex'
    }
})

window.addEventListener('click', function(){
    if (document.activeElement.id !== 'createAddList' && document.activeElement.id !== 'createAddName'){
        createAddList.style.display = 'none'
    }
})


function createMoveName(id, name){
    if (document.getElementById(`id:${id}`) || (createResult.childNodes.length > 9)) {
    } else {
        createResult.style.display = 'block'
        output = `<span class="create-result-name" id="id:${id}">${name}<span class="create-result-close" onClick="createRemoveResultName('id:${id}')">✕</span></span>`
        createResult.insertAdjacentHTML('beforeend', output)
        const cano = createAllNames.value
        createAllNames.value = cano + '|' + id
        document.getElementById(`id::${id}`).remove()
        createAddName.value = ''
        createAddName.focus();
    }   
}

function createRemoveResultName(x){
    const name = document.getElementById(x)
    const y = x.split(":")[1]
    const cano = createAllNames.value
    createAllNames.value = cano.replace(`|${y}`, '')
    name.remove()
}