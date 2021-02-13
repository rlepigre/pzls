A javascript library for creating/solving handcrafted sudoku puzzles 
====================================================================

The `pzls` library (pronounced "puzzles") is a javascript library that can be
used to embed handcrafted (variant) sudoku puzzles into any web page.

Puzzles are specified using a simple Javascript object (could be specified by
a JSON file), and the grid is then generated using the library, including the
appropriate checking function (for a "check" button), which checks everything
(including the variant sudoku stuff like thermos).

The input format for puzzled is (roughly) documented in file `lib/pzls.js`.

The interface is in part inspired by the software used by Simon Anthony and
Mark Goodliffe of the [Cracking the Cryptic](https://www.youtube.com/channel/UCC-UOdK8-mIjxBQm_ot1T-Q)
Youtube channel.

Supported sudoku variants
-------------------------

The library currently supports the following variants:
- Sudoku grids of any size.
- Irregular sudoku grids.
- Thermo sudoku.
- Kropki sudoku.

We plan to support more in the future (at least XV sudoku. killer sudoku, and
sandwich sudoku).

Known issues
------------

The current version is definitely not perfect, but it is usable.

Here are a few known limitations:
- Probably not sable on mobile platforms (phones, tablets).
- Verification of thermo sudoku is incomplete when there are diagonal lines.
- All browser keyboard shortcuts are disabled (including Ctrl+R).
- Reloading the page reinitialises the puzzle.
