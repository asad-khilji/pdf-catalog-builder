# JSON Catalog Site

Static HTML/CSS/JavaScript catalog builder. Product data is stored in `data.json` and in browser localStorage after editing.

## Features
- Add products with style number, description, sizes, price, category, and image.
- Edit product descriptions directly on the HTML page and save them.
- Generate PDF catalog pages with either 2 or 4 products per page.
- Download the current catalog data as JSON.
- Mobile-friendly form and preview layout.

## Run
Open `index.html` in a browser. For best local JSON loading, use a simple local server:

```bash
python3 -m http.server
```

Then open `http://localhost:8000`.
