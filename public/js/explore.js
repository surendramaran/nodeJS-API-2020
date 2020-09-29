const exploreAllPacks = document.getElementById("exploreAllPacks")
function exploreLoad() {
    const xExplore = new XMLHttpRequest()
    xExplore.open('GET', '/explore/', true)
    xExplore.onload = function() {
        const results = JSON.parse(this.responseText)
        results.forEach( (x) => {
            exploreInsert(x)
        })
    }
    xExplore.send()
}
exploreLoad()

function exploreInsert(x) {
    let output = `<div class="explore-pack">
                <a class="explore-pack-link" href="/pack/${x.packID}"><span class="explore-pack-div">
                <span class="explore-pack-name">${x.packName}</span>
                <span class="explore-pack-admin">${x.u0}</span>
                </span></a></div>`
    exploreAllPacks.insertAdjacentHTML('beforeend', output)
}