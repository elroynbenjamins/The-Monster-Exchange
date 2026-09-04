# Native nursery update

The Android Home now opens Nursery from its central grounds. This connects ten pieces: a Home entrance, swipeable parent cards, compatibility feedback, fees and capacity preview, matching typed-habitat assignments, parent duty locks, egg artwork and timers, world-day progression, validated hatching, and offspring cards with lineage.

An active Breeding Nest is required. Global capacity equals nest level, including ready eggs. Matching completed habitats offer an additional assignment limit equal to habitat level; they do not bypass nest capacity or provide stat bonuses. Both parents must share that habitat type. Assignments are stored in world dynamic state and replay through native commands. Parents cannot be listed, assigned twice, or sent on expeditions until hatching releases them.

The screen uses existing card and item artwork, native text and 48dp controls. No new art was generated. Build and upgrade the nest through Home's existing facility controls.

Validation: 162 unit tests pass, mobile TypeScript passes, 734 content definitions validate, and Android Hermes export succeeds. No APK build or physical-device visual test was performed. Phone QA should check parent-card scrolling, long lineage labels, Back behavior, low funds, full nests, typed habitat selection, restart persistence, and hatching.

This supersedes the earlier estate milestone's note that habitat breeding assignments were not connected.
