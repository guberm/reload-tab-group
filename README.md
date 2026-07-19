# Reload Tab Group

A tiny Chrome extension that reloads every tab in the active tab group with one click.

## Use

1. Pin **Reload Tab Group** to the Chrome toolbar.
2. Open any tab inside a tab group.
3. Click the extension icon.

The badge shows how many tabs were reloaded. If the active tab is not grouped, the extension does nothing and shows a dash.

## Privacy and permissions

The extension requests no permissions, collects no data, and makes no network requests. See [PRIVACY.md](PRIVACY.md).

## Install from source

1. Download or clone this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select this repository folder.

## Build the Chrome Web Store ZIP

```powershell
npm run package
```

The upload-ready archive is created in `dist/`. Store copy and submission notes are in [STORE_LISTING.md](STORE_LISTING.md) and [CHROME_WEB_STORE_CHECKLIST.md](CHROME_WEB_STORE_CHECKLIST.md).

## Test

```powershell
npm test
```

## License

[MIT](LICENSE)
