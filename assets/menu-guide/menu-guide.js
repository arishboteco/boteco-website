(() => {
  "use strict";

  const items = Array.from(document.querySelectorAll(".guide-item"));
  const previousButton = document.querySelector("[data-previous-page]");
  const nextButton = document.querySelector("[data-next-page]");
  const currentPage = document.querySelector("[data-current-page]");
  const totalPages = document.querySelector("[data-total-pages]");
  const guideMain = document.querySelector(".guide-main");
  const guideList = document.querySelector(".guide-list");

  if (
    items.length === 0 ||
    !previousButton ||
    !nextButton ||
    !currentPage ||
    !totalPages ||
    !guideMain ||
    !guideList
  ) {
    return;
  }

  document.documentElement.classList.add("guide-magazine-ready");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pagePattern = /^#page-(\d+)$/;
  let activeIndex = getPageFromHash();
  let touchStartX = 0;
  let touchStartY = 0;

  function getPageFromHash() {
    const match = window.location.hash.match(pagePattern);
    if (!match) {
      return 0;
    }

    const requestedIndex = Number.parseInt(match[1], 10) - 1;
    return Math.min(Math.max(requestedIndex, 0), items.length - 1);
  }

  function warmNearbyImages() {
    [activeIndex - 1, activeIndex, activeIndex + 1].forEach((index) => {
      const image = items[index]?.querySelector("img");
      if (image) {
        image.loading = "eager";
      }
    });
  }

  function updateAddress() {
    const pageHash = activeIndex === 0 ? "" : `#page-${activeIndex + 1}`;
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}${pageHash}`
    );
  }

  function renderPage({ scrollToGuide = false, updateUrl = false } = {}) {
    items.forEach((item, index) => {
      const isActive = index === activeIndex;
      item.hidden = !isActive;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-hidden", String(!isActive));
    });

    previousButton.disabled = activeIndex === 0;
    nextButton.disabled = activeIndex === items.length - 1;
    currentPage.textContent = String(activeIndex + 1);
    totalPages.textContent = String(items.length);
    warmNearbyImages();

    if (updateUrl) {
      updateAddress();
    }

    if (scrollToGuide) {
      guideMain.scrollIntoView({
        behavior: reducedMotion.matches ? "auto" : "smooth",
        block: "start",
      });
    }
  }

  function showPage(index) {
    const nextIndex = Math.min(Math.max(index, 0), items.length - 1);
    if (nextIndex === activeIndex) {
      return;
    }

    activeIndex = nextIndex;
    renderPage({ scrollToGuide: true, updateUrl: true });
  }

  previousButton.addEventListener("click", () => showPage(activeIndex - 1));
  nextButton.addEventListener("click", () => showPage(activeIndex + 1));

  document.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPage(activeIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showPage(activeIndex + 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      showPage(0);
    } else if (event.key === "End") {
      event.preventDefault();
      showPage(items.length - 1);
    }
  });

  guideList.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.changedTouches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    },
    { passive: true }
  );

  guideList.addEventListener(
    "touchend",
    (event) => {
      const touch = event.changedTouches[0];
      const distanceX = touch.clientX - touchStartX;
      const distanceY = touch.clientY - touchStartY;

      if (Math.abs(distanceX) < 55 || Math.abs(distanceX) <= Math.abs(distanceY) * 1.2) {
        return;
      }

      showPage(distanceX < 0 ? activeIndex + 1 : activeIndex - 1);
    },
    { passive: true }
  );

  window.addEventListener("hashchange", () => {
    const requestedIndex = getPageFromHash();
    if (requestedIndex !== activeIndex) {
      activeIndex = requestedIndex;
      renderPage({ scrollToGuide: true });
    }
  });

  renderPage();
})();
