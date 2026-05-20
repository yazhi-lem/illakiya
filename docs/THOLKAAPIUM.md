# Tholkappiam: The Inspiration Behind Yazhi Keyboard

The Yazhi Tamil Keyboard layout (PM0100) is deeply inspired by **Tholkappiam** (தொல்காப்பியம்), the most ancient extant Tamil grammar text and the oldest extant long work of Tamil literature. 

By aligning the keyboard layout with the natural phonetic and grammatical structure of the Tamil language as defined by Tholkappiar, we aim to create an intuitive, fast, and scientifically sound typing experience.

## 1. Eluthathikaram (Orthography & Phonology)

Tholkappiam's first book, *Eluthathikaram*, deals with the formation, pronunciation, and classification of Tamil letters. This forms the core foundation of our keyboard layout.

### 1.1 Uyir Ezhuthu (Vowels - 12)
Tholkappiam classifies vowels based on the duration of sound (Mathirai):
*   **Kuril (Short Vowels - 1 Mathirai):** அ, இ, உ, எ, ஒ
*   **Nedil (Long Vowels - 2 Mathirai):** ஆ, ஈ, ஊ, ஏ, ஓ, ஐ, ஔ

**Keyboard Implementation:**
*   We pair the Kuril and Nedil vowels together.
*   **Tap:** Outputs the Kuril (short) vowel (e.g., அ).
*   **Long Press / Shift:** Outputs the corresponding Nedil (long) vowel (e.g., ஆ).
*   *Note:* ஐ and ஔ are considered Nedil. In our layout, ஐ is placed with the short vowels for accessibility, and ஔ is treated as a special key or paired appropriately.

### 1.2 Mei Ezhuthu (Consonants - 18)
Tholkappiam beautifully categorizes consonants into three groups of six, based on how and where the sound is produced in the vocal tract:

*   **Vallinam (Hard Consonants):** க், ச், ட், த், ப், ற் (Pronounced from the chest)
*   **Mellinam (Soft Consonants):** ங், ஞ், ண், ந், ம், ன் (Pronounced from the nose)
*   **Idaiyinam (Medium Consonants):** ய், ர், ல், வ், ழ், ள் (Pronounced from the neck)

**Keyboard Implementation:**
*   The keyboard rows are strictly organized by these three grammatical categories.
*   Row 1: Vallinam
*   Row 2: Mellinam
*   Row 3: Idaiyinam
*   This logical grouping helps muscle memory, as users naturally associate the physical row with the phonetic "hardness" of the sound.

### 1.3 Uyirmei Ezhuthu (Combined Letters - 216)
Tholkappiam explains how a consonant (body/Mei) and a vowel (life/Uyir) combine to form a living letter (Uyirmei).
*   `க்` + `அ` = `க`

**Keyboard Implementation:**
*   The keyboard engine automatically handles this combination.
*   Typing a base consonant (e.g., `க்`) followed by a vowel (e.g., `ஆ`) automatically replaces them with the combined character (`கா`).

### 1.4 Aytham (Special Letter - 1)
*   **Aytham:** ஃ (Half Mathirai)
*   Tholkappiam treats this as a unique, dependent letter (Saarbezuthu).

**Keyboard Implementation:**
*   Placed as a dedicated special key, easily accessible but distinct from the main vowels and consonants.

## 2. Why Tholkappiam?

Most modern Tamil keyboards (like Tamil99 or Phonetic) were designed around the limitations of mechanical typewriters or English QWERTY layouts. 

By returning to the roots of Tamil grammar (Tholkappiam), the Yazhi keyboard:
1.  **Reduces Cognitive Load:** Users don't have to memorize arbitrary key placements. The layout follows the natural phonetic groupings they learned in primary school.
2.  **Increases Speed:** Grouping by Vallinam/Mellinam/Idaiyinam and using Long Press for Nedil drastically reduces the number of keys needed on screen, allowing for larger, more accurate touch targets.
3.  **Preserves Language Integrity:** It encourages typing in a way that respects the structure of the language (Consonant + Vowel = Combined Letter).

## 3. Future Explorations (Sollathikaram)
As we develop the **Adhan** prediction engine, we will look into *Sollathikaram* (Morphology and Syntax) to build smart autocorrect and next-word suggestions that understand Tamil root words, suffixes, and grammatical rules, rather than just relying on statistical probability.
