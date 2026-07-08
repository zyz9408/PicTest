# PicTest

GitHub Pages image URL API.

Browser apps should load this endpoint directly:

```text
https://zyz9408.github.io/PicTest/api/images.js
```

It generates final image URLs with random mirror assignment every time it runs. The script is self-contained and does not need to request `images.json`.

```html
<script src="https://zyz9408.github.io/PicTest/api/images.js"></script>
<script>
  const payload = await window.PicTestImagesApi.getPayload();
  const urls = payload.urls;
</script>
```

JSONP style is also supported:

```js
window.handlePicTestImages = (payload) => {
  console.log(payload.urls);
};

const script = document.createElement("script");
script.src = "https://zyz9408.github.io/PicTest/api/images.js?callback=handlePicTestImages";
document.head.append(script);
```

The page reads `api/images.js` and renders copyable text links only. It does not create `<img>` tags or load image files in the browser.

`images.json` is kept as a human-readable source mirror/path manifest. A static JSON file on GitHub Pages cannot randomize per request; the JS API randomizes in the caller's runtime.

Local reader tool:

```text
tools/image-url-reader.html
```

Open it locally and enter `owner/repo`, a GitHub repository URL, a Pages URL, or a direct `api/images.js` URL to view all generated image URLs.

The site is published from the `gh-pages` branch:

```text
https://zyz9408.github.io/PicTest/
```

Mirror example:

```json
{
  "name": "Another GitHub Pages mirror",
  "baseUrl": "https://another-user.github.io/PicTest/"
}
```
