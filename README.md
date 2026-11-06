# Seek demo apps

Seven small web apps for the Seek computer use agent demo, sharing one JSON store (`data/store.json`).

| App | URL |
| --- | --- |
| Mail (Gmail-styled) | http://localhost:4001 |
| Oracle Retail Merchandising (styled) | http://localhost:4002 |
| Shopify admin (styled) | http://localhost:4003 |
| Alder & Vale Home storefront | http://localhost:4004 |
| Amazon (styled): Seller Central / listing pages | http://localhost:4005/seller · http://localhost:4005/dp/B0D7Q4K2CL |
| Google Sheets (styled): Seek audit log | http://localhost:4006 |
| Gmail (styled): Noah Bennett's mailbox | http://localhost:4007 |

## Commands

```bash
npm install
npm start            # starts all seven apps
npm run reset        # restores the starting state for both stories (and empties the audit log)
npm run reset:noah   # same, but Noah's two requests don't exist yet: compose them in Noah's Gmail (port 4007) on camera, see docs/noah-emails-to-paste.md
npm run build:specs  # regenerates specs/ (PDFs, XLSX and viewer page images); macOS only
```

You can also reset from the browser by opening `/__reset` on any app, or `/__reset?mode=noah` for the send-on-camera start.

Mail between the two Gmail apps is delivered: when Noah sends from port 4007 to seek.agent@whatfix.com it arrives in Seek's inbox (port 4001), attachments included, and Seek's replies arrive in Noah's inbox.

## Story starting points

The mailbox is Seek's own: Seek <seek.agent@whatfix.com>. Requests come from Noah Bennett, Catalog Manager (noah.bennett@aldervalehome.com).

- Story 1: Mail inbox, 9:05 AM email from Noah: a forward of Dana Ruiz's email about the Harlow Accent Chair and Ashby 3-Seat Sofa, with all 7 attachments, and Noah's note asking Seek to set up and publish both. Seek logs each action in the audit log sheet (http://localhost:4006) and replies to Noah with the links. With `npm run reset:noah`, Noah forwards Dana's email himself on camera from port 4007.
- Story 2: Mail inbox, 8:30 AM email from Noah linking to his audit list, a second Google Sheet ("Catalog audit - week 45", http://localhost:4006/spreadsheets/d/1Bf3kWn8Yp2TzR6qLx9MdC4vHs7JgA1eUo5iNc0QwPa/edit). Each row links to the product's website and Amazon pages and to its spec sheet in Oracle (item attachment viewer, `/items/<code>/attachments/<file>`). Seek fills the sheet's result columns and logs one row per product per channel in the audit log sheet.
- Links look real: emails, both sheets and spreadsheet previews show real-looking addresses (merch.aldervalehome.com, admin.shopify.com/store/alder-vale-home, aldervalehome.com, amazon.com, sellercentral.amazon.com, docs.google.com) and clicking opens the local app. Local addresses typed into a sheet or an email are converted when saved or sent. The mapping is in `lib/realurl.js`.
- Calder storefront (navy main photo, the planted error): http://localhost:4004/products/calder-loveseat
- Merriam storefront: http://localhost:4004/products/merriam-dining-table · marketplace: http://localhost:4005/dp/B0C3H8N5MR

## Notes

- Integrations: releasing an item in Oracle Retail Merchandising creates a Shopify draft. Publishing in Shopify makes it live on the storefront. The marketplace has no sync.
- File pickers in each app open a "shared drive" of supplier photos and spec sheets, so Seek can attach files without the operating system file dialog. Uploading from the computer also works.
- Marketplace white-background checks use a known list of the supplied photos (lifestyle shots fail); uploaded copies of those photos are matched by content.
- `photos/` holds the 11 named product photos made from the supplied images. The three lifestyle shots were cropped slightly to remove a generator watermark. `photos/thumbs/` holds 400 px versions for lists and pickers.

## Deploying to Render

Render runs everything as one web service: all seven apps on one port, each under a path prefix. The blueprint is `render.yaml`.

| App | Path |
| :-- | :-- |
| Gmail (Seek) | `/gmail` |
| Oracle Retail Merchandising | `/oracle` |
| Shopify admin | `/shopify` |
| Storefront | `/store` |
| Amazon (listings and Seller Central) | `/amazon` |
| Google Sheets | `/sheets` |
| Gmail (Noah) | `/noah-gmail` |

The service's home page lists every app and has the two reset links. On Render, `RENDER` is set, so `server.js` starts in single-server mode and takes the public address from `RENDER_EXTERNAL_URL`. To try that mode locally:

```
SINGLE_SERVER=1 PORT=5055 PUBLIC_URL=http://localhost:5055 node server.js
```

The apps' pages use root paths (`/items/...`); `lib/prefix.js` adds the prefix to redirects and to every quoted path in the HTML they send. Cross-app links come from `lib/realurl.js`.

Data lives in `data/store.json` on the server's disk. On Render's free plan that disk is temporary: the data goes back to the seed on every deploy, restart or sleep (after 15 minutes idle). `SEED_MODE` in `render.yaml` picks which seed: `default` or `noah`.

SOP PDFs with Render addresses: `node scripts/build-render-sops.js https://<service>.onrender.com` writes the "(Render)" editions in `docs/`.
# retail-demo
# retail-demo
