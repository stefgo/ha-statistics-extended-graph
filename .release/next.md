<!--
The hand-written part of the next release: what is new, why it matters, and
what an upgrade needs. It is placed above the list of commits in the GitHub
release and in CHANGELOG.md.

Write below this comment. Use "###" for headings -- "##" is the level of the
version itself. A release with nothing written here is refused. A beta from
dev keeps the text; the stable release from main empties this file again.

Nothing inside an HTML comment is published.
-->

### Removed

- **`constant_per` is gone again.** A calculation constant is no longer scaled
  by the length of a bucket; it is drawn as the plain value, as before 0.7.0.

### Upgrade

If a series uses `constant_per`, remove the line. The option is ignored, so the
constant is drawn unscaled: a line at 36.5 instead of 36.5 per day.
