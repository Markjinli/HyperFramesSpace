# Third-party notices

HyperFramesSpace 1.0.5 ships an original helper, `hf-ntfs-locate.exe`. It enumerates NTFS/ReFS volumes through public Windows APIs (`CreateFile` on `\\.\X:`, `FSCTL_CREATE_USN_JOURNAL`, `FSCTL_QUERY_USN_JOURNAL`, `FSCTL_ENUM_USN_DATA`) and keeps only `hyperframes.json` paths.

No MiniThing or UFFS source is copied into this repository. The helper is new code written for HyperFramesSpace.

## MiniThing

- Project: https://github.com/AlanoSong/MiniThing
- License: MIT

We studied MiniThing Core's USN loop: open each NTFS volume, create/query the change journal, walk `FSCTL_ENUM_USN_DATA`, then rebuild paths from parent file-reference numbers.

We did **not** vendor MiniThing's Qt UI, SQLite catalog, monitor threads, or autorun registry code.

MiniThing remains independent software. Thanks to AlanoSong and contributors.

## UltraFastFileSearch (UFFS)

- Project: https://github.com/skyllc-ai/UltraFastFileSearch
- License: Mozilla Public License 2.0
- Trademark: the names **UFFS** and **UltraFastFileSearch**, and the UFFS logo, belong to Sky, LLC. See their [TRADEMARK.md](https://github.com/skyllc-ai/UltraFastFileSearch/blob/main/TRADEMARK.md).

We studied UFFS's MFT-first design (search from the file table instead of walking folders). HyperFramesSpace is **not** UFFS, is not a fork, and does not ship UFFS binaries or modified MPL files. Nominative thanks only.

## Microsoft USN documentation

`FSCTL_ENUM_USN_DATA` and related structures are documented at Microsoft Learn. The helper follows that public contract.
