(() => {
  "use strict";

  const items = Array.from(document.querySelectorAll(".guide-item"));
  const previousButton = document.querySelector("[data-previous-page]");
  const nextButton = document.querySelector("[data-next-page]");
  const pageLabel = document.querySelector("[data-page-label]");
  const currentPage = document.querySelector("[data-current-page]");
  const totalPages = document.querySelector("[data-total-pages]");
  const guideMain = document.querySelector(".guide-main");
  const guideList = document.querySelector(".guide-list");

  if (
    items.length === 0 ||
    !previousButton ||
    !nextButton ||
    !pageLabel ||
    !currentPage ||
    !totalPages ||
    !guideMain ||
    !guideList
  ) {
    return;
  }

  document.documentElement.classList.add("guide-magazine-ready");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const spreadMode = window.matchMedia("(min-width: 768px) and (orientation: landscape)");
  const pagePattern = /^#page-(\d+)$/;
  const transitionDuration = 340;
  let activeIndex = getPageFromHash();
  let isAnimating = false;
  let queuedIndex = null;
  let needsResponsiveRender = false;
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

  function getVisibleIndexes(index = activeIndex) {
    const indexes = [index];
    if (spreadMode.matches && index + 1 < items.length) {
      indexes.push(index + 1);
    }
    return indexes;
  }

  function getPageStep() {
    return spreadMode.matches ? 2 : 1;
  }

  function warmNearbyImages() {
    const visibleCount = getVisibleIndexes().length;
    const firstIndex = Math.max(activeIndex - 2, 0);
    const lastIndex = Math.min(activeIndex + visibleCount + 1, items.length - 1);

    for (let index = firstIndex; index <= lastIndex; index += 1) {
      const image = items[index]?.querySelector("img");
      if (image) {
        image.loading = "eager";
        image.decode?.().catch(() => {});
      }
    }
  }

  function updateAddress() {
    const pageHash = activeIndex === 0 ? "" : `#page-${activeIndex + 1}`;
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}${pageHash}`
    );
  }

  function enterReadingMode() {
    document.documentElement.classList.add("guide-reading-mode");
  }

  function focusGuideOnFirstScroll() {
    if (window.scrollY < 8) {
      return;
    }

    window.removeEventListener("scroll", focusGuideOnFirstScroll);
    enterReadingMode();
    if (window.scrollY < guideMain.offsetTop + Math.min(window.innerHeight * 0.5, 400)) {
      guideMain.scrollIntoView({
        behavior: reducedMotion.matches ? "auto" : "smooth",
        block: "start",
      });
    }
  }

  function updatePageState({ updateUrl = false } = {}) {
    const visibleIndexes = getVisibleIndexes();
    const firstPage = visibleIndexes[0] + 1;
    const lastPage = visibleIndexes[visibleIndexes.length - 1] + 1;

    previousButton.disabled = activeIndex === 0;
    nextButton.disabled = lastPage >= items.length;
    pageLabel.textContent = visibleIndexes.length > 1 ? "Pages" : "Page";
    currentPage.textContent = visibleIndexes.length > 1 ? `${firstPage}–${lastPage}` : String(firstPage);
    totalPages.textContent = String(items.length);
    warmNearbyImages();

    if (updateUrl) {
      updateAddress();
    }
  }

  function setSpreadSlot(item, position, isVisible) {
    item.classList.toggle("is-spread-left", isVisible && position === 0);
    item.classList.toggle("is-spread-right", isVisible && position === 1);
  }

  function renderPage({ updateUrl = false } = {}) {
    const visibleIndexes = getVisibleIndexes();

    delete guideList.dataset.turnDirection;
    items.forEach((item, index) => {
      const position = visibleIndexes.indexOf(index);
      const isVisible = position !== -1;
      item.hidden = !isVisible;
      item.classList.toggle("is-active", isVisible);
      item.classList.remove("is-entering", "is-leaving", "is-flip-page");
      setSpreadSlot(item, position, isVisible);
      item.setAttribute("aria-hidden", String(!isVisible));
    });

    updatePageState({ updateUrl });
  }

  function animateToPage(nextIndex) {
    const outgoingIndexes = getVisibleIndexes();
    const incomingIndexes = getVisibleIndexes(nextIndex);
    const outgoingItems = outgoingIndexes.map((index) => items[index]);
    const incomingItems = incomingIndexes.map((index) => items[index]);
    const incomingCard = incomingItems[0]?.querySelector(".guide-card");
    const direction = nextIndex > activeIndex ? "next" : "previous";
    const flipItem = direction === "next" ? outgoingItems[outgoingItems.length - 1] : outgoingItems[0];
    let hasFinished = false;
    let fallbackTimer;

    isAnimating = true;
    guideList.dataset.turnDirection = direction;
    incomingItems.forEach((item, position) => {
      item.hidden = false;
      item.setAttribute("aria-hidden", "false");
      item.classList.add("is-active", "is-entering");
      setSpreadSlot(item, position, true);
    });
    outgoingItems.forEach((item) => {
      item.setAttribute("aria-hidden", "true");
      item.classList.remove("is-active");
      item.classList.add("is-leaving");
    });
    flipItem?.classList.add("is-flip-page");
    activeIndex = nextIndex;
    enterReadingMode();
    updatePageState({ updateUrl: true });

    function finishTransition() {
      if (hasFinished) {
        return;
      }

      hasFinished = true;
      window.clearTimeout(fallbackTimer);
      incomingCard?.removeEventListener("animationend", finishTransition);
      outgoingItems.forEach((item) => {
        item.hidden = true;
        item.classList.remove(
          "is-leaving",
          "is-flip-page",
          "is-spread-left",
          "is-spread-right"
        );
      });
      incomingItems.forEach((item) => item.classList.remove("is-entering"));
      delete guideList.dataset.turnDirection;
      isAnimating = false;

      if (needsResponsiveRender) {
        needsResponsiveRender = false;
        renderPage();
      }

      const nextQueuedIndex = queuedIndex;
      queuedIndex = null;
      if (nextQueuedIndex !== null && nextQueuedIndex !== activeIndex) {
        showPage(nextQueuedIndex);
      }
    }

    incomingCard?.addEventListener("animationend", finishTransition, { once: true });
    fallbackTimer = window.setTimeout(finishTransition, transitionDuration + 80);
  }

  function showPage(index) {
    const nextIndex = Math.min(Math.max(index, 0), items.length - 1);
    if (nextIndex === activeIndex) {
      return;
    }

    if (isAnimating) {
      queuedIndex = nextIndex;
      return;
    }

    enterReadingMode();
    if (reducedMotion.matches) {
      activeIndex = nextIndex;
      renderPage({ updateUrl: true });
      return;
    }

    animateToPage(nextIndex);
  }

  previousButton.addEventListener("click", () => showPage(activeIndex - getPageStep()));
  nextButton.addEventListener("click", () => showPage(activeIndex + getPageStep()));

  document.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPage(activeIndex - getPageStep());
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showPage(activeIndex + getPageStep());
    } else if (event.key === "Home") {
      event.preventDefault();
      showPage(0);
    } else if (event.key === "End") {
      event.preventDefault();
      showPage(items.length - (spreadMode.matches ? 2 : 1));
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

      const step = getPageStep();
      showPage(distanceX < 0 ? activeIndex + step : activeIndex - step);
    },
    { passive: true }
  );

  window.addEventListener("hashchange", () => {
    const requestedIndex = getPageFromHash();
    if (requestedIndex !== activeIndex) {
      enterReadingMode();
      if (isAnimating) {
        queuedIndex = requestedIndex;
      } else {
        activeIndex = requestedIndex;
        renderPage();
      }
    }
  });

  function handleSpreadChange() {
    if (isAnimating) {
      needsResponsiveRender = true;
      return;
    }

    renderPage();
  }

  if (typeof spreadMode.addEventListener === "function") {
    spreadMode.addEventListener("change", handleSpreadChange);
  } else {
    spreadMode.addListener(handleSpreadChange);
  }

  window.addEventListener("scroll", focusGuideOnFirstScroll, { passive: true });
  renderPage();
})();
