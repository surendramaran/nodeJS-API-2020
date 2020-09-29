document.getElementById("addFileButton").addEventListener("click", function() {
    document.querySelector(".form-addFile-back").style.display = "flex";
})

document.querySelector(".form-addFile-close").addEventListener("click", function() {
    document.querySelector(".form-addFile-back").style.display = "none";
})