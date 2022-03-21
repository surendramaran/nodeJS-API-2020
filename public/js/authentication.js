const loginButton = document.getElementById("loginButton")
const signupButton = document.getElementById("signupButton")
const signupPhoneTryAgian = document.getElementById("signupPhoneTryAgian")

loginButton.addEventListener("click", function() {
    document.querySelector(".form-login-back").style.display = "flex";
})

document.querySelector(".form-login-close").addEventListener("click", function() {
    document.querySelector(".form-login-back").style.display = "none";
})

signupButton.addEventListener("click", function() {
    document.querySelector(".form-signup-back").style.display = "flex";
})

document.querySelector(".form-signup-close").addEventListener("click", function() {
    document.querySelector(".form-signup-back").style.display = "none";
})

document.getElementById("signupPhoneVerifyButton").addEventListener("click", ()=> {
    const phone = document.getElementById("signupPhone").value
    const name = document.getElementById("signupName").value
    const username = document.getElementById("signupUsername").value
    const password = document.getElementById("signupPassword").value
    if (phone.length == 10 && name && username && password){
        const xhr = new XMLHttpRequest
        xhr.open('POST', '/signup/verifyphone')
        xhr.onreadystatechange = function(){
            if (this.readyState < 4) {
                document.getElementById("signupPhoneVerifyButton").innerHTML = 'Wait';
            }
            if (this.readyState == 4 && this.status == 200) {
                document.querySelector(".signup-fields-1").style.display = 'none';
                document.querySelector(".signup-fields-2").style.display = 'flex';
           }
           if (this.readyState == 4 && this.status == 400) {
                document.getElementById("signupPhoneTryAgian").style.display = 'inline';
            }
        }
        xhr.setRequestHeader('Content-type', "application/x-www-form-urlencoded")
        xhr.send(`phone=${phone}&name=${name}`)
    } else {
        document.getElementById("signupPhone").style.borderColor = 'red';
    }
})