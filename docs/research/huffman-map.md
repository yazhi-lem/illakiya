# PM0100 - Huffman Encoded Frequency Map (Tamil)

## Base Principle
Characters with higher frequency in the Tamil language are mapped to shorter or more accessible key combinations.

## Vowel Frequency (Kuril)
| Rank | Char | Binary (Huffman) | Key (PM0100) |
|---|---|---|---|
| 1 | அ | 00 | z |
| 2 | இ | 01 | x |
| 3 | உ | 10 | c |
| 4 | எ | 110 | v |
| 5 | ஒ | 111 | b |

## Consonant Frequency (Mei)
| Rank | Char | Binary (Huffman) | Key (PM0100) |
|---|---|---|---|
| 1 | க் | 000 | q |
| 2 | த் | 001 | u |
| 3 | ந் | 010 | i |
| 4 | ம் | 011 | p |
| 5 | ப் | 100 | o |
| 6 | ர் | 101 | s |
| 7 | ல் | 1100 | d |
| 8 | ய் | 1101 | a |
| 9 | வ் | 1110 | f |
| 10 | ழ் | 1111 | g |

*Note: This mapping optimizes for mobile thumb travel distance rather than strict binary length.*
