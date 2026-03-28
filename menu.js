// Seleccionamos los elementos
    const menuBtn = document.getElementById('id_menuBtn');
    const menuNav = document.getElementById('id_menuNav');
    const menuOverlay = document.getElementById('id_menuOverlay');

    // Abrir/cerrar menú al hacer click en el botón
    menuBtn.addEventListener('click', function() {
        menuBtn.classList.toggle('active');
        menuNav.classList.toggle('active');
        menuOverlay.classList.toggle('active');
    });

    // Cerrar al hacer click en el fondo oscuro
    menuOverlay.addEventListener('click', function() {
        menuBtn.classList.remove('active');
        menuNav.classList.remove('active');
        menuOverlay.classList.remove('active');
    });

    // Cerrar al hacer click en un link
    const menuLinks = document.querySelectorAll('.contenidoEncPag nav a');
    menuLinks.forEach(function(link) {
        link.addEventListener('click', function() {
            menuBtn.classList.remove('active');
            menuNav.classList.remove('active');
            menuOverlay.classList.remove('active');
        });
    });