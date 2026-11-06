# Noah's emails to Seek (on camera)

Start from a clean slate:

```bash
npm run reset:noah
```

Then work in Noah's Gmail at http://localhost:4007. Each email arrives unread in Seek's inbox at http://localhost:4001 as soon as you click **Send**.

## Story 1: forward Dana's email

No attaching needed: the forward carries Dana's 7 attachments.

1. In Noah's **Inbox**, open Dana Ruiz's email "New items: Harlow Accent Chair and Ashby 3-Seat Sofa, spec sheets attached".
2. Click **Forward**. The subject becomes "Fwd: …", Dana's message appears in the body under "---------- Forwarded message ---------", and her 7 attachments show as chips above Send.
3. In **To**, type:

   ```
   seek.agent@whatfix.com
   ```

4. Click at the very top of the body, above the forwarded message, and paste Noah's note:

   ```
   Hi Seek,
   
   Please set up these two new items from Northfield and publish them on our website and on Amazon. Dana's email is below, with the spec sheets and photos attached. Retail price as per MSRP.
   
   Send me the links once they're live.
   
   Thanks,
   Noah
   ```

5. Click **Send**.

## Story 2: write the audit request

1. Click **Compose**.
2. **To:**

   ```
   seek.agent@whatfix.com
   ```

3. **Subject:**

   ```
   This week's catalog audit: 2 products
   ```

4. **Body:**

   ```
   Hi Seek,
   
   This week's catalog audit list is ready: two live products, with links to their website and Amazon pages and to the spec sheets in Oracle.
   
   https://docs.google.com/spreadsheets/d/1Bf3kWn8Yp2TzR6qLx9MdC4vHs7JgA1eUo5iNc0QwPa/edit
   
   Please work through the sheet and fill in the result columns, fix anything that is clearly wrong, then reply to this email with what you found.
   
   Thanks,
   Noah
   
   Noah Bennett
   Catalog Manager, Alder & Vale Home
   ```

5. Click **Send**. No attachments: the audit list is a Google Sheet, and it links to each spec sheet in Oracle.

The link in the email, and every link in the audit list, shows the real-looking address (docs.google.com, merch.aldervalehome.com, aldervalehome.com, amazon.com). Clicking one opens the matching demo app.

## If you send one by mistake

Run `npm run reset:noah` again. It clears Seek's inbox, Noah's Sent folder and all demo data.
