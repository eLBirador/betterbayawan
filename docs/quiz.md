# Bayawan quiz

The `/quiz/` page is featured immediately below Brief History on the homepage.
The homepage category links preselect a topic through `?category=category-id`;
unknown values fall back to all categories. The build renders these links from
the same category records as the quiz, so they stay consistent.
It uses the shared site language selector and has no framework or animation dependency.

Edit `data/quiz.json` for categories, questions, answer explanations, sources, and
quiz controls. Localized arrays follow `languages`: English, Filipino, Cebuano.
Keep proper names and BetterBayawan unchanged. Page introductions and the homepage
feature use the shared `locales/` dictionaries as usual.

Each question needs a stable unique ID, category ID, four distinct options, a
zero-based correct option index, a source ID, and a checked date. Each category
needs at least five questions. Date statistics explicitly and distinguish folklore
from documented events. Do not quiz users on uncertain travel conditions, current
entrance fees, unannounced festival schedules, or emergency response promises.
Verify each added fact against the linked original reference and review all three
languages. Changing question content should increment the quiz data version so
older saved rounds cannot be resumed against changed answers.

Questions and answer positions are shuffled once per round. The site language
can change without resetting answers. Session storage keeps an unfinished round;
local storage keeps a device-only best percentage across rounds. Scores are
personal practice results, not ranked comparisons between categories or lengths.
No account, identity information, analytics event, or score upload is involved.
The quiz remains playable if storage is blocked; progress then lasts only while
the page is open. Sharing happens only when the player chooses Share.

Animations use short CSS opacity/transform transitions and twelve decorative
pieces at completion. They do not loop. Reduced-motion preferences remove moving
effects. The page fetches the small question bank only when the quiz is opened.

Run `npm run check` for question structure, sources, and translation coverage.
`npm test` includes the interactive quiz checks in `scripts/test-quiz.mjs`.
