<!--
The hand-written part of the next release: what is new, why it matters, and
what an upgrade needs. It is placed above the list of commits in the GitHub
release and in CHANGELOG.md.

Write below this comment. Use "###" for headings -- "##" is the level of the
version itself. A release with nothing written here is refused. A beta from
dev keeps the text; the stable release from main empties this file again.

Nothing inside an HTML comment is published.
-->

### Fixes

- Charts now appear reliably on the first load, also on dashboards without a
  built-in history or statistics graph and right after the mobile app starts.
  Before, a chart could stay empty until the page was reloaded, sometimes
  several times.
