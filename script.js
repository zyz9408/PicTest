const gallery = document.querySelector("#gallery");
const statusText = document.querySelector("#status");
const reloadButton = document.querySelector("#reloadButton");
const copyAllButton = document.querySelector("#copyAllButton");
const strategySelect = document.querySelector("#strategySelect");
const template = document.querySelector("#imageCardTemplate");

function setStatus(message) {
  statusText.textContent = message;
}

function normalizeBaseUrl(baseUrl) {
  const resolved = new URL(baseUrl, window.location.href).href;
  return resolved.endsWith("/") ? resolved : `${resolved}/`;
}

function normalizePath(item) {
  const path = item.path || item.src;

  if (!path) {
    throw new Error(`${item.title || "未命名图片"} 缺少 path`);
  }

  return path.replace(/^\/+/, "");
}

function normalizeManifest(data) {
  const fallbackMirror = {
    name: "当前站点",
    baseUrl: normalizeBaseUrl(window.location.href),
  };

  if (Array.isArray(data)) {
    return {
      mirrors: [fallbackMirror],
      images: data.map((item) => ({ ...item, path: normalizePath(item) })),
    };
  }

  const mirrors = Array.isArray(data.mirrors) && data.mirrors.length > 0
    ? data.mirrors.map((mirror, index) => ({
        name: mirror.name || `镜像 ${index + 1}`,
        baseUrl: normalizeBaseUrl(mirror.baseUrl),
      }))
    : [fallbackMirror];

  const images = Array.isArray(data.images)
    ? data.images.map((item) => ({ ...item, path: normalizePath(item) }))
    : [];

  return { mirrors, images };
}

function createDirectUrl(mirror, path) {
  return new URL(path, mirror.baseUrl).href;
}

function hashString(value) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function pickMirrorIndex(path, mirrorCount) {
  if (mirrorCount <= 1 || strategySelect.value === "primary") {
    return 0;
  }

  if (strategySelect.value === "random") {
    return Math.floor(Math.random() * mirrorCount);
  }

  return hashString(path) % mirrorCount;
}

function setActiveMirror(card, activeIndex) {
  card.querySelectorAll(".mirror-link").forEach((link, index) => {
    link.classList.toggle("is-active", index === activeIndex);
  });
}

function updateCardUrl(card, url, mirrorIndex) {
  const frame = card.querySelector(".image-frame");
  frame.href = url;
  frame.classList.remove("is-broken");
  card.querySelector(".direct-link").textContent = url;
  card.querySelector(".copy-link").dataset.url = url;
  setActiveMirror(card, mirrorIndex);
}

function buildMirrorLinks(item, mirrors) {
  return mirrors.map((mirror) => ({
    name: mirror.name,
    url: createDirectUrl(mirror, item.path),
  }));
}

function createCard(item, mirrors) {
  const card = template.content.firstElementChild.cloneNode(true);
  const mirrorLinks = buildMirrorLinks(item, mirrors);
  const selectedIndex = pickMirrorIndex(item.path, mirrorLinks.length);
  const selectedUrl = mirrorLinks[selectedIndex].url;
  const frame = card.querySelector(".image-frame");
  const mirrorList = card.querySelector(".mirror-list");
  const failedMirrorIndexes = new Set();

  card.querySelector("h2").textContent = item.title;
  card.querySelector("p").textContent = item.description;
  updateCardUrl(card, selectedUrl, selectedIndex);

  const image = new Image();
  image.src = selectedUrl;
  image.alt = item.title;
  image.loading = "lazy";
  frame.replaceChildren(image);

  image.addEventListener("error", () => {
    const currentUrl = card.querySelector(".direct-link").textContent;
    const currentIndex = mirrorLinks.findIndex((mirror) => mirror.url === currentUrl);
    failedMirrorIndexes.add(currentIndex);
    const nextIndex = mirrorLinks.findIndex((_, index) => !failedMirrorIndexes.has(index));

    if (nextIndex >= 0) {
      image.src = mirrorLinks[nextIndex].url;
      updateCardUrl(card, mirrorLinks[nextIndex].url, nextIndex);
      return;
    }

    frame.replaceChildren();
    frame.classList.add("is-broken");
    frame.textContent = "加载失败";
  });

  mirrorLinks.forEach((mirror, index) => {
    const link = document.createElement("a");
    link.className = "mirror-link";
    link.href = mirror.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = mirror.name;
    link.title = mirror.url;
    link.dataset.url = mirror.url;
    link.addEventListener("click", () => {
      image.src = mirror.url;
      updateCardUrl(card, mirror.url, index);
    });
    mirrorList.append(link);
  });

  setActiveMirror(card, selectedIndex);
  return card;
}

async function copyText(text, button) {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      const input = document.createElement("textarea");
      input.value = text;
      input.setAttribute("readonly", "");
      document.body.append(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }

    if (button) {
      const original = button.textContent;
      button.textContent = "已复制";
      window.setTimeout(() => {
        button.textContent = original;
      }, 1200);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "复制失败";
    setStatus(message);
  }
}

function getCurrentLinks() {
  return Array.from(gallery.querySelectorAll(".direct-link"), (link) => link.textContent).filter(Boolean);
}

async function loadGallery() {
  reloadButton.disabled = true;
  copyAllButton.disabled = true;
  gallery.replaceChildren();
  setStatus("正在读取图片清单...");

  try {
    const manifestResponse = await fetch("images.json", { cache: "no-cache" });

    if (!manifestResponse.ok) {
      throw new Error(`images.json 请求失败: ${manifestResponse.status}`);
    }

    const manifest = normalizeManifest(await manifestResponse.json());

    for (const item of manifest.images) {
      gallery.append(createCard(item, manifest.mirrors));
    }

    setStatus(`已生成 ${manifest.images.length} 条直链 / ${manifest.mirrors.length} 个镜像`);
  } catch (error) {
    gallery.replaceChildren();
    const message = error instanceof Error ? error.message : "未知错误";
    setStatus(message);
  } finally {
    reloadButton.disabled = false;
    copyAllButton.disabled = getCurrentLinks().length === 0;
  }
}

reloadButton.addEventListener("click", loadGallery);
strategySelect.addEventListener("change", loadGallery);
copyAllButton.addEventListener("click", () => copyText(getCurrentLinks().join("\n"), copyAllButton));
gallery.addEventListener("click", (event) => {
  const button = event.target.closest(".copy-link");

  if (button) {
    copyText(button.dataset.url, button);
  }
});

loadGallery();
