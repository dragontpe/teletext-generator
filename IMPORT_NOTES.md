# edit.tf Import Notes

## Root Cause

The sparse/broken mosaic pattern was caused by hash input corruption before decoding, not canvas rendering.

When pasted edit.tf URLs contained wrapped whitespace/newlines (or escaped characters), decode input included non-base64url characters. In `decodeHash`, unknown characters resolve to index `-1`, then are coerced to zero bits. That injects deterministic bit errors across the stream, producing a repeatable but wrong mosaic layout.

## Fix Implemented

- Hardened `EditTfImporter.parseUrl` in `js/edittf-import.js`.
- Extract hash strictly from the `#...` fragment.
- Run `decodeURIComponent` on hash payload (safe try/catch).
- Strip all whitespace and any non-base64url characters before decode.

Normalization step:

`data = data.replace(/\s+/g, '').replace(/[^A-Za-z0-9_-]/g, '')`

## Regression Coverage

Standalone Node regression test:

- File: `tests/edittf-import-regression.test.js`
- Run: `node tests/edittf-import-regression.test.js`

Assertions:

- Clean Judge Dredd URL decodes to hash length `1167` and `809` mosaic cells.
- Same URL with inserted newlines/spaces still decodes to `1167` and `809`.
- Percent-escaped hash variant still decodes to `1167` and `809`.

## Operational Guidance

- If imported mosaic output is consistently wrong in the same pattern, validate hash normalization first.
- Rendering path should be investigated only after confirming normalized hash length/content.
