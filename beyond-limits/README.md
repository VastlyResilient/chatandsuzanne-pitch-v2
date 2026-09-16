# Beyond Limits Connect

A working prototype of the system Andy Sklover actually needs — built for Beyond Limits
Academics (a program of the Stamford Peace Youth Foundation), not adapted from a school
district product.

ParentSquare assumes a school district: a student information system, school-assigned
student IDs, a roster that someone else maintains. Beyond Limits has none of that. It has
113 families across four programs, a Google Forms workbook, and a deadline it did not
choose — Remind is being folded into ParentSquare. Connect is the same job, done for the
organization that has to do it.

## Open it

```
open beyond-limits/index.html
```

No build step, no dependencies, no server. `index.html` + `app.css` + `app.js` + `data.js`.

## The nine screens

| Screen | What it is for |
| --- | --- |
| **Today** | The build order, in Andy's own priority: clean the list → code every family → then the chatbot. Codes outstanding is the number the whole page is organised around. |
| **The Square** | One post, every household, translated per family. Audience built from program, grade and whether an agreement is on file. Delivery and read receipts come back to the family record. |
| **Nudges** | "Message them if they miss x amount of days", built as a rule you can read in a sentence. Counts *sessions*, not days. Writes to the guardian, never the student. |
| **Family Records** | One row per family, however many programs they join and however many forms they complete. The only place a participant code is ever created. |
| **Code Studio** | The format decision (`BLA`/`BLH`/`BLS` → one `BL-2026-####` series with program in its own column), and the back-fill run — dry run first, commit second. |
| **Merge Desk** | Duplicate identities, side by side, matched on name + date of birth. Nothing merges itself. |
| **Orientation** | The mini-lecture Andy repeats every week: per-program QR codes, agreement tracking, and a chatbot whose script he edits himself — no PowerPoint to re-send. |
| **ParentSquare Bridge** | Field mapping, readiness checklist, and a CSV export where the participant code lands in `student_sis_id`. |
| **Workbook Health** | Every defect found reading the live workbook on 7 September, plus the ownership risk. |

## The rules the system holds to

- **One family, one code.** A second program is a value in a column, never a second identity.
- **The program is not in the code.** Families move between programs; an identifier that
  changes on transfer is not an identifier.
- **Name + date of birth, never phone alone.** Ethan Shalauddin's two submissions carry two
  different parent phone numbers. Phone matching would have caught none of the duplicates.
- **Never guess a column.** Where the old script fell back to writing column 37, this stops
  and reports.
- **Nothing student-facing.** Every automated message goes to an adult named on an agreement.
- **Nothing merges itself.** Below certainty, the record waits for Andy.

## Data

`data.js` is a faithful stand-in for the real workbook: 113 families, 8 codes issued, 105
outstanding, the three real duplicate cases, the four pasted Starfish rows, and the thirteen
families sitting under a group label nobody has explained yet. No real contact details.

## Brand

Navy and gold, taken from the Beyond Limits Academics mark in `assets/`. Light and dark
themes; the whole thing works on a phone, because that is where the parents are.
