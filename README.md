# Reload Tab Group

A tiny Chrome extension for reloading a tab group, copying all its URLs, or exporting them to a text file.

## Use

1. Pin **Reload Tab Group** to the Chrome toolbar.
2. Open any tab inside a tab group.
3. Click the extension icon.
4. Choose **Reload group**, **Copy all URLs**, or **Export all URLs**.

Export creates `tab-group-urls.txt` with one URL per line. The popup opens without querying tabs; the active group is checked only after you choose an action.

## Privacy and permissions

The extension requests the `tabs` permission only to read URLs from every tab in the active group for Copy and Export. URLs stay on the device; the extension collects no data and makes no network requests. See [PRIVACY.md](PRIVACY.md).

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
