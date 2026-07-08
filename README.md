# PicTest

GitHub Pages image URL API.

Other apps should request this endpoint directly:

```text
https://zyz9408.github.io/PicTest/api/images.json
```

The endpoint returns final image URLs that have already been assigned to mirrors:

```json
{
  "urls": ["https://example.com/assets/images/a.png"],
  "images": [
    {
      "path": "assets/images/a.png",
      "url": "https://example.com/assets/images/a.png",
      "mirror": "Mirror name"
    }
  ]
}
```

```js
const payload = await fetch("https://zyz9408.github.io/PicTest/api/images.json").then((response) =>
  response.json(),
);

const urls = payload.urls;
```

The page reads `api/images.json` and renders copyable text links only. It does not create `<img>` tags or load image files in the browser.

`images.json` is kept as the source mirror/path manifest.

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
