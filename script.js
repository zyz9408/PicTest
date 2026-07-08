const gallery = document.querySelector("#gallery");
const statusText = document.querySelector("#status");
const reloadButton = document.querySelector("#reloadButton");
const copyAllButton = document.querySelector("#copyAllButton");
const copyApiButton = document.querySelector("#copyApiButton");
const template = document.querySelector("#imageCardTemplate");
const apiUrl = new URL("api/images.js", window.location.href).href;

function setStatus(message) {
  statusText.textContent = message;
}

function formatBytes(sizeBytes) {
  if (!Number.isFinite(sizeBytes)) {
    return "unknown size";
  }

  const sizeMb = sizeBytes / 1024 / 1024;
  return `${sizeMb.toFixed(2)} MB`;
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

async function loadApi() {
  reloadButton.disabled = true;
  copyAllButton.disabled = true;
  copyApiButton.disabled = true;
  gallery.replaceChildren();
  setStatus("正在生成随机分流直链...");

  try {
    if (!window.PicTestImagesApi) {
      throw new Error("api/images.js 未加载");
    }

    const data = await window.PicTestImagesApi.getPayload();

    for (const item of data.images) {
      gallery.append(createCard(item));
    }

    const distribution = data.mirrors
      .map((mirror) => `${mirror.name}: ${mirror.assignedImages}`)
      .join(" / ");
    setStatus(`已随机生成 ${data.images.length} 条直链；${distribution}；页面未加载图片文件`);
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
