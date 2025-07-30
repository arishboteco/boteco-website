document.addEventListener('DOMContentLoaded', function () {
  var navbar = document.querySelector('nav.navbar');
  if (!navbar) return;

  navbar.classList.add('navbar-hidden');
  var pointerInTop = false;

  function updateVisibility() {
    if (window.scrollY > 0 || pointerInTop) {
      navbar.classList.remove('navbar-hidden');
    } else {
      navbar.classList.add('navbar-hidden');
    }
  }

  window.addEventListener('scroll', updateVisibility);

  document.addEventListener('mousemove', function (e) {
    pointerInTop = e.clientY <= 80;
    updateVisibility();
  });
});
