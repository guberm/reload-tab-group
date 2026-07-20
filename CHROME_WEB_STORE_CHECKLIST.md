# Chrome Web Store submission checklist

1. Open the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/).
2. For this existing item, upload `dist/reload-tab-group-v1.1.1.zip` on the **Package** page.
3. Copy the text from `STORE_LISTING.md`.
4. Upload `icons/icon128.png` and `store-assets/screenshot-1280x800.png`.
5. Select **Tools** and **English**.
6. Complete the privacy form with the answers and `tabs` permission justification in `STORE_LISTING.md`.
7. Confirm the extension contains no ads and uses no in-app purchases.
8. Save the draft, run the dashboard checks, then submit for review.

Before uploading a later version, update `version` in both `manifest.json` and `package.json`, then run `npm test` and `npm run package` again.
