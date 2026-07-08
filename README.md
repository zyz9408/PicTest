# PicTest

GitHub Pages image manifest.

Other apps should request the manifest directly:

```text
https://zyz9408.github.io/PicTest/images.json
```

The page reads `images.json`, combines each image `path` with one or more mirror `baseUrl` values, then renders copyable text links only. It does not create `<img>` tags or load image files in the browser.

Keep the same file layout in every mirror to use the same `path` list for traffic splitting.

Minimal client-side usage:

```js
const manifest = await fetch("https://zyz9408.github.io/PicTest/images.json").then((response) =>
  response.json(),
);

const urls = manifest.images.map((image) => {
  const mirror = manifest.mirrors[Math.floor(Math.random() * manifest.mirrors.length)];
  return new URL(image.path, mirror.baseUrl).href;
});
```

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
