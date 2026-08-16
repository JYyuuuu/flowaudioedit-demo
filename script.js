"use strict";

const demoData = window.demoData || {};

const state = {
  operation: "addition",
  backbone: "tangoflux"
};

document.addEventListener("DOMContentLoaded", () => {
  setupDisabledLinks();
  setupTabs();
  setupBackboneSelector();
  setupAudioPauseBehavior();
  renderActiveDemo();
});

function setupDisabledLinks() {
  document.querySelectorAll("[aria-disabled='true']").forEach((link) => {
    link.addEventListener("click", (event) => event.preventDefault());
  });
}

function setupTabs() {
  const tabs = Array.from(document.querySelectorAll(".operation-tab"));
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateOperation(tab.dataset.operation));
    tab.addEventListener("keydown", (event) => {
      handleRovingKeys(event, tabs, index, (nextTab) => activateOperation(nextTab.dataset.operation));
    });
  });
}

function setupBackboneSelector() {
  const buttons = Array.from(document.querySelectorAll(".backbone-button"));
  buttons.forEach((button, index) => {
    button.addEventListener("click", () => activateBackbone(button.dataset.backbone));
    button.addEventListener("keydown", (event) => {
      handleRovingKeys(event, buttons, index, (nextButton) => activateBackbone(nextButton.dataset.backbone));
    });
  });
}

function handleRovingKeys(event, controls, index, activate) {
  const keyMap = {
    ArrowLeft: -1,
    ArrowUp: -1,
    ArrowRight: 1,
    ArrowDown: 1
  };

  if (!(event.key in keyMap)) {
    return;
  }

  event.preventDefault();
  const nextIndex = (index + keyMap[event.key] + controls.length) % controls.length;
  controls[nextIndex].focus();
  activate(controls[nextIndex]);
}

function activateOperation(operation) {
  if (!demoData[operation] || state.operation === operation) {
    return;
  }

  state.operation = operation;
  pauseAllAudio();

  document.querySelectorAll(".operation-tab").forEach((tab) => {
    const isActive = tab.dataset.operation === operation;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });

  const activeTab = document.querySelector(`.operation-tab[data-operation="${operation}"]`);
  const panel = document.getElementById("demo-panel");
  if (activeTab && panel) {
    panel.setAttribute("aria-labelledby", activeTab.id);
  }

  renderActiveDemo();
}

function activateBackbone(backbone) {
  if (!demoData[state.operation]?.[backbone] || state.backbone === backbone) {
    return;
  }

  state.backbone = backbone;
  pauseAllAudio();

  document.querySelectorAll(".backbone-button").forEach((button) => {
    const isActive = button.dataset.backbone === backbone;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  renderActiveDemo();
}

function renderActiveDemo() {
  const container = document.getElementById("demo-grid");
  const examples = demoData[state.operation]?.[state.backbone] || [];

  if (!container) {
    return;
  }

  const fragment = renderExampleCards(examples, {
    emptyText: "Audio examples will be added here."
  });

  container.innerHTML = "";
  container.appendChild(fragment);
}

function renderExampleCards(examples, options = {}) {
  const fragment = document.createDocumentFragment();

  if (!examples.length) {
    fragment.appendChild(createEmptyState(options.emptyText || "Examples will be added here."));
    return fragment;
  }

  for (const example of examples) {
    fragment.appendChild(createExampleCard(example));
  }

  return fragment;
}

function createExampleCard(example) {
  const card = document.createElement("article");
  card.className = "example-card comparison-card";
  card.dataset.exampleId = example.id;

  const tracks = getTracks(example);
  const table = document.createElement("div");
  table.className = "comparison-table";
  table.style.setProperty("--column-count", String(tracks.length + 1));
  table.setAttribute("role", "table");
  table.setAttribute("aria-label", "Audio comparison");

  table.appendChild(createHeaderCell("Prompts", "prompt-head"));
  tracks.forEach((track) => {
    table.appendChild(createHeaderCell(track.label, track.featured ? "flowaudioedit-head" : ""));
  });

  const promptCell = document.createElement("div");
  promptCell.className = "prompt-table-cell";
  promptCell.setAttribute("role", "cell");
  promptCell.append(
    createPromptBox("Source Prompt", example.sourcePrompt, example.sourceHighlight),
    createPromptBox("Target Prompt", example.targetPrompt, example.targetHighlight)
  );
  table.appendChild(promptCell);

  tracks.forEach((track) => {
    table.appendChild(createAudioCell(track));
  });

  card.appendChild(table);
  return card;
}

function createHeaderCell(text, extraClass = "") {
  const cell = document.createElement("div");
  cell.className = extraClass ? `table-header ${extraClass}` : "table-header";
  cell.setAttribute("role", "columnheader");
  cell.textContent = text;
  return cell;
}

function createPromptBox(label, prompt, highlights = []) {
  const box = document.createElement("div");
  box.className = "prompt-box";

  const labelElement = document.createElement("span");
  labelElement.className = "prompt-label";
  labelElement.textContent = label;

  const promptElement = document.createElement("p");
  promptElement.className = "prompt-text";
  appendHighlightedText(promptElement, prompt || "", highlights);

  box.append(labelElement, promptElement);
  return box;
}

function appendHighlightedText(element, text, highlights) {
  const ranges = findHighlightRanges(text, highlights);
  let cursor = 0;

  ranges.forEach((range) => {
    if (range.start > cursor) {
      element.appendChild(document.createTextNode(text.slice(cursor, range.start)));
    }

    const mark = document.createElement("mark");
    mark.textContent = text.slice(range.start, range.end);
    element.appendChild(mark);
    cursor = range.end;
  });

  if (cursor < text.length) {
    element.appendChild(document.createTextNode(text.slice(cursor)));
  }
}

function findHighlightRanges(text, highlights) {
  return (highlights || [])
    .map((term) => {
      const start = text.toLowerCase().indexOf(String(term).toLowerCase());
      return start >= 0 ? { start, end: start + String(term).length } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.start - b.start)
    .reduce((ranges, range) => {
      const previous = ranges[ranges.length - 1];
      if (!previous || range.start >= previous.end) {
        ranges.push(range);
      }
      return ranges;
    }, []);
}

function getTracks(example) {
  return example.tracks || [
    { label: "Source", path: example.source },
    { label: "AudioEditor", path: example.audioeditor },
    { label: "MMEdit", path: example.mmedit },
    { label: "FlowAudioEdit (Static CFG)", path: example.flowedit, featured: true },
    { label: "FlowAudioEdit (Dynamic CFG)", path: example.ours, featured: true, ours: true },
    { label: "Reference", path: example.reference }
  ];
}

function createAudioCell(track) {
  const column = document.createElement("div");
  const classes = ["audio-cell"];
  if (track.featured) {
    classes.push("is-flowaudioedit");
  }
  if (track.ours) {
    classes.push("is-ours");
  }
  column.className = classes.join(" ");
  column.dataset.label = track.label;
  column.setAttribute("role", "cell");

  const slot = document.createElement("div");
  slot.className = "audio-slot";
  column.appendChild(slot);

  renderAudioPlayer(slot, track);

  return column;
}

function renderAudioPlayer(slot, track) {
  slot.innerHTML = "";

  if (!track.path) {
    renderAudioPending(slot);
    return;
  }

  const audio = document.createElement("audio");
  audio.controls = true;
  audio.preload = "metadata";
  audio.src = track.path;
  audio.setAttribute("aria-label", `${track.label} audio sample`);
  audio.addEventListener("error", () => {
    if (slot.isConnected) {
      renderAudioPending(slot);
    }
  });
  slot.appendChild(audio);
}

function renderAudioPending(slot) {
  slot.innerHTML = "";

  const missing = document.createElement("div");
  missing.className = "audio-missing";
  missing.textContent = "Audio unavailable";
  slot.appendChild(missing);
}

function createEmptyState(text) {
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = text;
  return empty;
}

function setupAudioPauseBehavior() {
  document.addEventListener(
    "play",
    (event) => {
      if (!(event.target instanceof HTMLAudioElement)) {
        return;
      }

      document.querySelectorAll("audio").forEach((audio) => {
        if (audio !== event.target && !audio.paused) {
          audio.pause();
        }
      });
    },
    true
  );
}

function pauseAllAudio() {
  document.querySelectorAll("audio").forEach((audio) => audio.pause());
}
