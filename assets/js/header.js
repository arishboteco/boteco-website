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

  var awardsContainer = document.getElementById('header-awards');
  if (awardsContainer) {
    for (var i = 1; i <= 10; i++) {
      var img = new Image();
      img.src = 'assets/images/award-header-' + i + '.jpg';
      img.alt = 'Award ' + i;
      img.loading = 'lazy';
      img.className = 'award-img';
      img.onerror = function () { this.remove(); };
      awardsContainer.appendChild(img);
    }
  }
});
