# Firefox — Quick Load & Package

### Load the extension in Firefox

1. Open Firefox and go to: `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on...**
3. Select `innerpeace-firefox.xpi` (created in the repository root)

---

### Save changes

Build the Firefox output and create innerpeace-firefox.xpi

```bash
npm run package:firefox
```
