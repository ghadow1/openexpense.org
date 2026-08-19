import{j as r,k as n}from"./chunk-NIFEPK7Y.js";import{b as p,c as E,d,e as c}from"./chunk-ZIR6ORMP.js";import"./chunk-RRU7Q3KP.js";function f(e,o){let s={[r.ENC_NAME]:p(JSON.stringify(e,null,2)),[r.KEY_NAME]:p(JSON.stringify(o,null,2)),[r.README_NAME]:p(`OpenExpense encrypted export
================================

${r.ENC_NAME}  - your ledger, encrypted with AES-256-GCM.
${r.KEY_NAME}  - the key needed to decrypt it.

To restore: open openexpense.org and use Import. Prefer the two JSON
files saved next to each other (encrypted ledger.json + key.json).
This zip is a legacy bundle of the same pair.

The portable key is only in key.json. OpenExpense does not keep it
in the browser. Without a passphrase, anyone with BOTH files can
read the ledger. With one, key.json is useless on its own.
`)};return d(s,{level:6})}function x(e){if(!(e instanceof Uint8Array)||e.byteLength>n.maxCompressedBytes)throw new Error("ZIP_TOO_LARGE");let o=0,s=0,i=c(e,{filter(t){o+=1;let l=Number(t?.originalSize??0);if(s+=l,o>n.maxEntries||l>n.maxEntryBytes||s>n.maxExpandedBytes)throw new Error("ZIP_EXPANSION_LIMIT");return!0}}),y={},a=0;for(let t of Object.keys(i)){if(a+=i[t].byteLength,i[t].byteLength>n.maxEntryBytes||a>n.maxExpandedBytes)throw new Error("ZIP_EXPANSION_LIMIT");y[t]=i[t]}return y}function N(e){if(!e)return null;try{return JSON.parse(E(e))}catch{return null}}export{N as entryToJson,x as unzipBundle,f as zipBundle};
