const pack = document.URL.split('/')[4]
const eventSource = new EventSource(`/eventSource/${pack}`)
eventSource.onmessage = function(e) {
    const data = JSON.parse(e.data)
    console.log(e)
    output = `<div class="file-file">
            <div><img class="file-image" src="${data.image}" alt=""></div>
            <div><span class="file-uploader">${data.name}</span></div></div>`
    document.getElementById("addUpdatedFile").insertAdjacentHTML("beforeend", output)
}