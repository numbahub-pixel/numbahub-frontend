# NumbaHub Dashboard

A clean HTML + CSS + JavaScript + Tailwind-ready starter based on the dashboard reference.

## Important architecture

The UI is intentionally kept in the HTML files.

`main.js` contains only interactions:
- mobile sidebar
- overlay
- simple buttons
- search filtering

`style.css` contains reusable visual styles.

This means you can inspect and edit each page without hunting through a giant `app.js`.

## Structure

```text
numbahub-dashboard/
├── index.html
├── pages/
│   ├── receive-sms.html
│   ├── premium-sms.html
│   ├── rent.html
│   ├── esim.html
│   ├── engagement.html
│   ├── history.html
│   ├── settings.html
│   ├── airtime.html
│   └── giftcards.html
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
└── README.md
```

## Run

Open the folder in VS Code and use Live Server.

Later, when the frontend is stable, we can convert the repeated sidebar/header into reusable components or move the project to React/Next.js.

## Next development stages

1. Match the reference UI pixel-by-pixel.
2. Add authentication.
3. Add wallet funding.
4. Add real SMS/number APIs.
5. Add transaction history.
6. Add user profile/security.
7. Build the admin dashboard.
8. Connect a backend and database.


## Icons and font
- Icons use Lucide via CDN.
- The stylesheet is configured for Argentum Sans Medium at `assets/fonts/ArgentumSans-Medium.woff2`; add your licensed font file there for the exact typeface.
