# Fonts

The site uses **Thmanyah Serif Display** and **Thmanyah Sans** (free from Thmanyah, but the files may not be
redistributed, so they are not committed to this repository).

Download the family from Thmanyah's official page and copy these 10 files into this folder before building or deploying:

```
thmanyahserifdisplay-Light.woff2   thmanyahsans-Light.woff2
thmanyahserifdisplay-Regular.woff2 thmanyahsans-Regular.woff2
thmanyahserifdisplay-Medium.woff2  thmanyahsans-Medium.woff2
thmanyahserifdisplay-Bold.woff2    thmanyahsans-Bold.woff2
thmanyahserifdisplay-Black.woff2   thmanyahsans-Black.woff2
```

`@font-face` rules are in `src/styles/fonts.css`. Without the files the site still works with a fallback serif/sans.
