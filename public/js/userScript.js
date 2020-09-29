const userAllPacks = document.getElementById("userAllPacks")
const editProfile = document.getElementById("editProfile")
function userLoad() {
    const xUser = new XMLHttpRequest()
    xUser.open('GET', '/userPack', true)
    xUser.onload = function() {
        const results = JSON.parse(this.responseText)
        results.forEach( (x) => {
            userInsert(x)
        })
    }
    xUser.send()
}
userLoad()

function userInsert(x) {
    let output = `<div class="user-pack">
                <a class="user-pack-link" href="/pack/${x.packID}"><span class="user-pack-div">
                <span class="user-pack-name">${x.packName}</span>
                <span class="user-pack-admin">${x.u0}</span>
                <span></a></div>`
    userAllPacks.insertAdjacentHTML('beforeend', output)
}

editProfile.addEventListener("click", function(){
    document.querySelector(".profile-details-back").style.display = 'flex'
    const xProfile = new XMLHttpRequest()
    xProfile.open('GET', '/userprofile', true)
    xProfile.onload = function(){
        const r = JSON.parse(this.responseText)
        document.getElementById("profileDetailsImage").src = r.pp
        document.getElementById("profileDetailsName").innerText = `Name: ${r.fullname}`
        document.getElementById("profileDetailsGender").innerText = `Gender: ${r.gender}`
        document.getElementById("profileDetailsDOB").innerText = `Date of Birth: ${r.dob}`
        document.getElementById("profileDetailsUsername").innerText = `Username: ${r.username}`
        document.getElementById("profileDetailsNumber").innerText = `Phone Number: ${r.num}`
        document.getElementById("profileDetailsAt").innerText = `Created at: ${r.accountDate}`
    }
    xProfile.send()
})

document.getElementById("profileDetailsClose").addEventListener("click", function(){
    document.querySelector(".profile-details-back").style.display = 'none'
})