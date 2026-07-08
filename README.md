# PicTest

GitHub Pages image direct-link list.

The page reads `images.json`, combines each image `path` with one or more mirror `baseUrl` values, then renders and copies real image URLs. Keep the same file layout in every mirrored GitHub Pages repository to use the same `path` list for traffic splitting.

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
