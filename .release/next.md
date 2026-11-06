<!--
The hand-written part of the next release: what is new, why it matters, and
what an upgrade needs. It is placed above the list of commits in the GitHub
release and in CHANGELOG.md.

Write below this comment. Use "###" for headings -- "##" is the level of the
version itself. A release with nothing written here is refused. A beta from
dev keeps the text; the stable release from main empties this file again.

Nothing inside an HTML comment is published.
-->

### New

- **Constants as a rate per bucket.** A calculation term can now give its
  constant as a rate per hour, day or week with `constant_per`. The constant is
  multiplied by the length of every bucket, so one target line fits hourly,
  daily and monthly bars alike: 36.5 per day becomes 1.52 per hour, 1 095 in
  June and 1 131.5 in July. Days with a daylight saving change count as one
  day. See "Rate per bucket" in the README.

  ```yaml
  - name: Target
    chart_type: step
    calculation:
      terms:
        - constant: 36.5
          constant_per: day
  ```

### Upgrade

Nothing to do. Existing configurations draw as before; `constant_per` is
optional. It needs aggregated statistics: with `raw` the constant is not scaled
and a warning is logged.

Also in this release: Renovate replaces Dependabot, and the dependencies were
brought up to date.
