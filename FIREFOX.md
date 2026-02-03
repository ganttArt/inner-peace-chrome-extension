# Firefox — Quick Load & Package

## Installing the extension in FireFox

1. Open Firefox and go to: `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on...**
3. Select `innerpeace-firefox.xpi` (created in the repository root)

## For future code changes

1. Run this script to create innerpeace-firefox.xpi

    ```bash
    npm run package:firefox
    ```

2. Follow install instructions above to sync changes.
