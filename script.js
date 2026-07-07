const gallery = document.querySelector("#gallery");
const statusText = document.querySelector("#status");
const reloadButton = document.querySelector("#reloadButton");
const template = document.querySelector("#imageCardTemplate");

let activeObjectUrls = [];

function revokeObjectUrls() {
  for (const url of activeObjectUrls) {
    URL.revokeObjectURL(url);
  }
  activeObjectUrls = [];
}

function setStatus(message) {
  statusText.textContent = message;
}

async function fetchImageAsObjectUrl(src) {
  const response = await fetch(src, { cache: "no-cache" });

  if (!response.ok) {
    throw new Error(`${src} 请求失败: ${response.status}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  activeObjectUrls.push(objectUrl);
  return objectUrl;
}

function createCard(item) {
  const card = template.content.firstElementChild.cloneNode(true);
  card.querySelector("h2").textContent = item.title;
  card.querySelector("p").textContent = item.description;
  card.querySelector("code").textContent = item.src;
  return card;
}

async function loadGallery() {
  reloadButton.disabled = true;
  revokeObjectUrls();
  gallery.replaceChildren();
  setStatus("正在请求图片清单...");

  try {
    const manifestResponse = await fetch("images.json", { cache: "no-cache" });

    if (!manifestResponse.ok) {
      throw new Error(`images.json 请求失败: ${manifestResponse.status}`);
    }

    const items = await manifestResponse.json();
    setStatus(`正在请求 ${items.length} 张图片...`);

    await Promise.all(
      items.map(async (item) => {
        const card = createCard(item);
        gallery.append(card);

        const frame = card.querySelector(".image-frame");
        const imageUrl = await fetchImageAsObjectUrl(item.src);
        const image = new Image();
        image.src = imageUrl;
        image.alt = item.title;
        image.loading = "lazy";
        frame.replaceChildren(image);
      }),
    );

    setStatus(`已完成 ${items.length} 张图片请求`);
  } catch (error) {
    gallery.replaceChildren();
    const message = error instanceof Error ? error.message : "未知错误";
    setStatus(message);
  } finally {
    reloadButton.disabled = false;
  }
}

reloadButton.addEventListener("click", loadGallery);
loadGallery();
