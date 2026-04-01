# Manual Instagram Feed Updates

The site now reads Instagram content from a single static file:

`public/data/instagram-posts.json`

If you do not want to use the Meta token flow, just update that file whenever new posts happen.

## How to update (2 minutes)
1. Open `public/data/instagram-posts.json`
2. Copy the last post object, paste it at the top, and edit:
   - `id` (any unique string)
   - `title` (short title, first line)
   - `caption` (full caption)
   - `hashtags` (array of hashtags)
   - `tag` (one of Ceremony, Camp, Service, Outreach, Training, Achievement, General)
   - `image` (URL of the image or `/assets/images/your-file.jpg`)
   - `date` (ISO date like `2026-03-31T10:00:00.000Z`)
   - `link` (Instagram post URL)
3. Save and redeploy.

That is all. No tokens or APIs needed.
