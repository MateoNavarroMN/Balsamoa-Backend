const menuBtn = document.getElementById('id_menuBtn')
const menuNav = document.getElementById('id_menuNav')
const menuOverlay = document.getElementById('id_menuOverlay')

menuBtn.addEventListener('click', function () {
    menuBtn.classList.toggle('active')
    menuNav.classList.toggle('active')
    menuOverlay.classList.toggle('active')
});

menuOverlay.addEventListener('click', function () {
    menuBtn.classList.remove('active')
    menuNav.classList.remove('active')
    menuOverlay.classList.remove('active')
});

const menuLinks = document.querySelectorAll('.contenidoEncPag nav a')
menuLinks.forEach(function (link) {
    link.addEventListener('click', function () {
        menuBtn.classList.remove('active')
        menuNav.classList.remove('active')
        menuOverlay.classList.remove('active')
    })
})