const themeToggle = document.querySelector("[data-theme-toggle]");
const themeLabel = document.querySelector("[data-theme-label]");
const copyButtons = document.querySelectorAll("[data-copy-button]");
const searchInput = document.querySelector("[data-search-input]");
const filterRow = document.querySelector("[data-filter-row]");
const resultCount = document.querySelector("[data-result-count]");
const emptyState = document.querySelector("[data-empty-state]");
const searchableSections = Array.from(document.querySelectorAll("main > .grid > .card, main > .featured.card"));

let activeTag = "all";

function normalize(value) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function getSectionTags(section) {
  return Array.from(section.querySelectorAll(".tag"))
    .map((tag) => normalize(tag.textContent))
    .filter(Boolean);
}

const commandIndex = searchableSections.map((section) => {
  const title = section.querySelector("h2")?.textContent || "Untitled";
  const tags = [...new Set(getSectionTags(section))];
  const text = normalize(section.textContent);

  section.dataset.searchText = text;
  section.dataset.searchTags = tags.join(" ");

  return { section, title, tags, text };
});

function setTheme(theme) {
  const nextTheme = theme === "day" ? "day" : "night";
  const isDay = nextTheme === "day";

  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem("openclaw-theme", nextTheme);

  if (themeLabel) {
    themeLabel.textContent = isDay ? "Night mode" : "Day mode";
  }

  if (themeToggle) {
    themeToggle.setAttribute("aria-label", isDay ? "Switch to night mode" : "Switch to day mode");
  }
}

async function copyBlock(button) {
  const block = button.closest("[data-copy-block]");
  const code = block ? block.querySelector("code") : null;

  if (!code) return;

  const original = button.textContent;

  try {
    await navigator.clipboard.writeText(code.textContent);
    button.textContent = "Copied";
  } catch (error) {
    button.textContent = "Failed";
  }

  setTimeout(() => {
    button.textContent = original;
  }, 1400);
}

function renderFilters() {
  if (!filterRow) return;

  const preferredTags = ["all", "daily", "gateway", "tasks", "browser", "debug", "heartbeat", "setup", "agent", "prompts"];
  const availableTags = new Set(commandIndex.flatMap((item) => item.tags));
  const tags = preferredTags.filter((tag) => tag === "all" || availableTags.has(tag));

  filterRow.innerHTML = tags
    .map((tag) => {
      const label = tag === "all" ? "All" : tag;
      const pressed = tag === activeTag ? "true" : "false";
      return `<button class="filter-chip" type="button" data-filter-tag="${tag}" aria-pressed="${pressed}">${label}</button>`;
    })
    .join("");
}

function applySearch() {
  const query = normalize(searchInput?.value || "");
  let visibleCount = 0;

  commandIndex.forEach((item) => {
    const matchesQuery = !query || item.text.includes(query);
    const matchesTag = activeTag === "all" || item.tags.includes(activeTag);
    const isVisible = matchesQuery && matchesTag;

    item.section.hidden = !isVisible;
    visibleCount += isVisible ? 1 : 0;
  });

  if (resultCount) {
    resultCount.textContent = `${visibleCount} ${visibleCount === 1 ? "section" : "sections"}`;
  }

  if (emptyState) {
    emptyState.hidden = visibleCount !== 0;
  }
}

function initSearch() {
  renderFilters();
  applySearch();

  searchInput?.addEventListener("input", applySearch);

  filterRow?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter-tag]");
    if (!button) return;

    activeTag = button.dataset.filterTag || "all";
    renderFilters();
    applySearch();
  });
}

function initTheme() {
  setTheme(document.documentElement.dataset.theme);

  themeToggle?.addEventListener("click", () => {
    const currentTheme = document.documentElement.dataset.theme;
    setTheme(currentTheme === "day" ? "night" : "day");
  });
}

function initCopyButtons() {
  copyButtons.forEach((button) => {
    button.addEventListener("click", () => copyBlock(button));
  });
}

initTheme();
initCopyButtons();
initSearch();
