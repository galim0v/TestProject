const ROW_CONFIG = {
  heads: {
    label: "голова",
    dir: "images/heads",
    fallbackFiles: ["IMG_7419.jpg", "IMG_2497.jpg", "IMG_7426.jpg"]
  },
  bodies: {
    label: "туловище",
    dir: "images/bodies",
    fallbackFiles: ["DSCF5914.jpg", "DSCF5732.jpg", "IMG_8634.jpg", "IMG_8635.jpg", "IMG_8635.jpg", "IMG_8635.jpg", "IMG_8639.jpg"]
  },
  legs: {
    label: "ноги",
    dir: "images/legs",
    fallbackFiles: ["DSC01039.jpg", "DSC01038.jpg"]
  }
};

const rowsState = [];
const doneButton = document.getElementById("doneButton");
const modal = document.getElementById("invitationModal");
const selectionNote = document.getElementById("selectionNote");

document.addEventListener("DOMContentLoaded", init);

async function init() {
  const rowElements = Array.from(document.querySelectorAll(".part-row"));

  await Promise.all(rowElements.map(async (rowEl) => {
    const key = rowEl.dataset.part;
    const config = ROW_CONFIG[key];

    if (!config) {
      return;
    }

    const imagePaths = await resolveImages(config);
    setupRow(rowEl, key, config.label, imagePaths);
  }));

  doneButton.addEventListener("click", openModal);
  modal.addEventListener("click", onModalClick);
  document.addEventListener("keydown", onEscClose);
}

function setupRow(rowEl, key, label, imagePaths) {
  const track = rowEl.querySelector(".carousel-track");
  const prevBtn = rowEl.querySelector(".prev");
  const nextBtn = rowEl.querySelector(".next");
  const counter = rowEl.querySelector(".counter");

  const paths = imagePaths.length ? imagePaths : [createPlaceholderDataUrl(label)];
  const usingPlaceholder = imagePaths.length === 0;

  const items = paths.map((src, idx) => {
    const item = document.createElement("div");
    item.className = "carousel-item";

    const img = document.createElement("img");
    img.src = src;
    img.alt = usingPlaceholder ? "Изображение отсутствует" : `${label} ${idx + 1}`;

    item.appendChild(img);
    track.appendChild(item);
    return item;
  });

  const state = {
    key,
    label,
    prevBtn,
    nextBtn,
    counter,
    items,
    paths,
    usingPlaceholder,
    index: 0
  };

  prevBtn.addEventListener("click", () => shiftRow(state, -1));
  nextBtn.addEventListener("click", () => shiftRow(state, 1));

  rowsState.push(state);
  renderRow(state);
}

function shiftRow(state, delta) {
  state.index = clamp(state.index + delta, 0, state.items.length - 1);
  renderRow(state);
}

function renderRow(state) {
  state.items.forEach((item, idx) => {
    const isActive = idx === state.index;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-hidden", isActive ? "false" : "true");
  });

  state.prevBtn.disabled = state.index === 0;
  state.nextBtn.disabled = state.index === state.items.length - 1;
  state.counter.textContent = `Выбор ${getSelectedIndex(state) + 1}/${state.paths.length}`;
}

function getSelectedIndex(state) {
  return state.index;
}

function openModal() {
  const selected = rowsState
    .map((state) => {
      if (state.usingPlaceholder) {
        return `${state.label}: нет изображения`;
      }

      const path = state.paths[getSelectedIndex(state)];
      return `${state.label}: ${extractFileName(path)}`;
    })
    .join(" | ");

  selectionNote.textContent = `Ваш выбор: ${selected}.`;

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function onModalClick(event) {
  if (event.target.hasAttribute("data-close-modal")) {
    closeModal();
  }
}

function onEscClose(event) {
  if (event.key === "Escape" && modal.classList.contains("is-open")) {
    closeModal();
  }
}

async function resolveImages(config) {
  const numberedCandidates = [];
  const extensions = ["png", "jpg", "jpeg", "webp"];

  for (let i = 1; i <= 12; i += 1) {
    extensions.forEach((ext) => {
      numberedCandidates.push(`${i}.${ext}`);
    });
  }

  const candidates = Array.from(new Set([...numberedCandidates, ...config.fallbackFiles]));
  const checks = await Promise.all(candidates.map((file) => imageExists(`${config.dir}/${file}`)));

  return candidates
    .filter((_, idx) => checks[idx])
    .map((file) => `${config.dir}/${file}`);
}

function imageExists(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

function createPlaceholderDataUrl(label) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="500">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#ffe7dc"/>
          <stop offset="100%" stop-color="#ffd2c2"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <text x="50%" y="47%" text-anchor="middle" fill="#7f3b4a" font-size="42" font-family="Trebuchet MS">
        ${label}
      </text>
      <text x="50%" y="58%" text-anchor="middle" fill="#9f5c68" font-size="26" font-family="Trebuchet MS">
        Нет изображения в папке
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function extractFileName(path) {
  const parts = path.split("/");
  return parts[parts.length - 1];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
