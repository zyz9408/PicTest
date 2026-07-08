(function attachPicTestImagesApi(global) {
  const mirrors = [
    {
      name: "GitHub Pages",
      baseUrl: "https://zyz9408.github.io/PicTest/",
    },
    {
      name: "a466761426-ui CDN",
      baseUrl: "https://cdn.jsdelivr.net/gh/a466761426-ui/PicTest@main/",
    },
  ];

  const images = [
    {
      title: "Neon City",
      description: "A rain-soaked neon city street.",
      path: "assets/images/neon-city.png",
      sizeBytes: 2423640,
    },
    {
      title: "Floating Garden",
      description: "A peaceful garden island above the clouds.",
      path: "assets/images/floating-garden.png",
      sizeBytes: 2268689,
    },
    {
      title: "Creative Desk",
      description: "A warm desk scene for creative work.",
      path: "assets/images/creative-desk.png",
      sizeBytes: 2686251,
    },
    {
      title: "Moon Observatory",
      description: "A small observatory on a rocky moon.",
      path: "assets/images/moon-observatory.png",
      sizeBytes: 2629238,
    },
  ];

  function normalizeBaseUrl(baseUrl) {
    return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  }

  function createUrl(mirror, path) {
    return new URL(path, normalizeBaseUrl(mirror.baseUrl)).href;
  }

  function pickRandomMirror() {
    return mirrors[Math.floor(Math.random() * mirrors.length)];
  }

  function summarizeMirrors(resolvedImages) {
    return mirrors.map((mirror) => {
      const assignedImages = resolvedImages.filter((image) => image.mirror === mirror.name);
      const assignedBytes = assignedImages.reduce((total, image) => total + (image.sizeBytes || 0), 0);

      return {
        name: mirror.name,
        baseUrl: normalizeBaseUrl(mirror.baseUrl),
        assignedImages: assignedImages.length,
        assignedBytes,
      };
    });
  }

  async function getPayload() {
    const resolvedImages = images.map((image) => {
      const mirror = pickRandomMirror();

      return {
        ...image,
        url: createUrl(mirror, image.path),
        mirror: mirror.name,
      };
    });

    return {
      version: 3,
      generatedAt: new Date().toISOString(),
      strategy: "client-random",
      totalImages: resolvedImages.length,
      totalBytes: resolvedImages.reduce((total, image) => total + (image.sizeBytes || 0), 0),
      mirrors: summarizeMirrors(resolvedImages),
      urls: resolvedImages.map((image) => image.url),
      images: resolvedImages,
    };
  }

  async function getUrls() {
    const payload = await getPayload();
    return payload.urls;
  }

  const api = {
    mirrors,
    sourceImages: images,
    getPayload,
    getUrls,
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
