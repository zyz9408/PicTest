(function attachPicTestImagesApi(global) {
  let sourcePromise;

  function getScriptUrl() {
    const script = global.document && global.document.currentScript;
    return script ? script.src : "https://zyz9408.github.io/PicTest/api/images.js";
  }

  function getSourceUrl() {
    return new URL("../images.json", getScriptUrl()).href;
  }

  function normalizeBaseUrl(baseUrl) {
    const resolved = new URL(baseUrl, getSourceUrl()).href;
    return resolved.endsWith("/") ? resolved : `${resolved}/`;
  }

  function normalizePath(item) {
    const path = item.path || item.src;

    if (!path) {
      throw new Error(`${item.title || "未命名图片"} 缺少 path`);
    }

    return path.replace(/^\/+/, "");
  }

  async function loadSource() {
    if (!sourcePromise) {
      sourcePromise = fetch(getSourceUrl(), { cache: "no-cache" })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`images.json 请求失败: ${response.status}`);
          }

          return response.json();
        })
        .then((data) => {
          const mirrors = Array.isArray(data.mirrors)
            ? data.mirrors.map((mirror, index) => ({
                name: mirror.name || `镜像 ${index + 1}`,
                baseUrl: normalizeBaseUrl(mirror.baseUrl),
              }))
            : [];
          const images = Array.isArray(data.images)
            ? data.images.map((item) => ({ ...item, path: normalizePath(item) }))
            : [];

          if (mirrors.length === 0) {
            throw new Error("images.json 缺少 mirrors");
          }

          if (images.length === 0) {
            throw new Error("images.json 缺少 images");
          }

          return { mirrors, images };
        });
    }

    return sourcePromise;
  }

  function createUrl(mirror, path) {
    return new URL(path, mirror.baseUrl).href;
  }

  function pickRandomMirror(mirrors) {
    return mirrors[Math.floor(Math.random() * mirrors.length)];
  }

  function summarizeMirrors(mirrors, resolvedImages) {
    return mirrors.map((mirror) => {
      const assignedImages = resolvedImages.filter((image) => image.mirror === mirror.name);
      const assignedBytes = assignedImages.reduce((total, image) => total + (image.sizeBytes || 0), 0);

      return {
        name: mirror.name,
        baseUrl: mirror.baseUrl,
        assignedImages: assignedImages.length,
        assignedBytes,
      };
    });
  }

  async function getPayload() {
    const source = await loadSource();
    const resolvedImages = source.images.map((image) => {
      const mirror = pickRandomMirror(source.mirrors);
      return {
        ...image,
        url: createUrl(mirror, image.path),
        mirror: mirror.name,
      };
    });

    return {
      version: 2,
      generatedAt: new Date().toISOString(),
      strategy: "client-random",
      sourceUrl: getSourceUrl(),
      totalImages: resolvedImages.length,
      totalBytes: resolvedImages.reduce((total, image) => total + (image.sizeBytes || 0), 0),
      mirrors: summarizeMirrors(source.mirrors, resolvedImages),
      urls: resolvedImages.map((image) => image.url),
      images: resolvedImages,
    };
  }

  async function getUrls() {
    const payload = await getPayload();
    return payload.urls;
  }

  const api = {
    getPayload,
    getUrls,
    loadSource,
    sourceUrl: getSourceUrl(),
  };

  global.PicTestImagesApi = api;

  try {
    const script = global.document && global.document.currentScript;
    const callbackName = script ? new URL(script.src).searchParams.get("callback") : "";

    if (callbackName && typeof global[callbackName] === "function") {
      getPayload()
        .then((payload) => global[callbackName](payload))
        .catch((error) => setTimeout(() => { throw error; }, 0));
    }
  } catch {
    // Ignore callback parsing errors; direct API usage still works.
  }
})(globalThis);
