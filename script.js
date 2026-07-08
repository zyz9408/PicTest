const gallery = document.querySelector("#gallery");
const statusText = document.querySelector("#status");
const reloadButton = document.querySelector("#reloadButton");
const copyAllButton = document.querySelector("#copyAllButton");
const copyApiButton = document.querySelector("#copyApiButton");
const template = document.querySelector("#imageCardTemplate");
const apiUrl = new URL("api/images.json", window.location.href).href;

function setStatus(message) {
  statusText.textContent = message;
}

function createCard(item) {
  const card = template.content.firstElementChild.cloneNode(true);
  card.querySelector("h2").textContent = item.title || item.path;
  card.querySelector("p").textContent = item.description || "";
  card.querySelector(".asset-path").textContent = item.path;
  card.querySelector(".mirror-name").textContent = `${item.mirror} / ${formatBytes(item.sizeBytes)}`;
  card.querySelector(".direct-link").textContent = item.url;
  card.querySelector(".copy-link").dataset.url = item.url;
  return card;
}

function formatBytes(sizeBytes) {
  if (!Number.isFinite(sizeBytes)) {
    return "unknown size";
  }

  const sizeMb = sizeBytes / 1024 / 1024;
  return `${sizeMb.toFixed(2)} MB`;
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

function validateApiPayload(data) {
  if (!data || !Array.isArray(data.images)) {
    throw new Error("api/images.json 格式错误: 缺少 images 数组");
  }

  for (const item of data.images) {
    if (!item.url || !item.path) {
      throw new Error("api/images.json 格式错误: 图片缺少 url 或 path");
    }
  }
}

async function loadApi() {
  reloadButton.disabled = true;
  copyAllButton.disabled = true;
  copyApiButton.disabled = true;
  gallery.replaceChildren();
  setStatus("正在读取直链接口...");

  try {
    const response = await fetch(apiUrl, { cache: "no-cache" });

    if (!response.ok) {
      throw new Error(`api/images.json 请求失败: ${response.status}`);
    }

    const data = await response.json();
    validateApiPayload(data);

    for (const item of data.images) {
      gallery.append(createCard(item));
    }

    setStatus(`接口返回 ${data.images.length} 条直链 / ${data.mirrors?.length || 0} 个分流源；页面未加载图片文件`);
  } catch (error) {
    gallery.replaceChildren();
    const message = error instanceof Error ? error.message : "未知错误";
    setStatus(message);
  } finally {
    reloadButton.disabled = false;
    copyAllButton.disabled = getCurrentLinks().length === 0;
    copyApiButton.disabled = false;
  }
}

reloadButton.addEventListener("click", loadApi);
copyAllButton.addEventListener("click", () => copyText(getCurrentLinks().join("\n"), copyAllButton));
copyApiButton.addEventListener("click", () => copyText(apiUrl, copyApiButton));
gallery.addEventListener("click", (event) => {
  const button = event.target.closest(".copy-link");

  if (button) {
    copyText(button.dataset.url, button);
  }
});

loadApi();
