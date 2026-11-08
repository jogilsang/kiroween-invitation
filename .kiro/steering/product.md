# Steering: Product

> Why: keep every build decision anchored to one goal and one user, so features don't drift.
> Effect: the agent rejects work that doesn't serve the Golden Path below.
> 2026-11-05: render target pivoted ASCII → SVG for a grotesque, glowing look. Goal/user/golden-path are otherwise unchanged.

## Goal (one paragraph)

Kiroween Invitation lets a developer decorate a white Kiro ghost and a pumpkin in a
dark, glowing Halloween theme and turn their settings into a polished SVG
invitation, then save it as an image or share it by link. It serves three
purposes (declaring you're joining, announcing an event, recruiting teammates),
a variable year so it is reusable next year, and combination options (mood,
palette, glow) so each invitation feels distinct. The whole thing is
client-only: no server, no account, no database. (The project keeps the name
`ascii-invite` for continuity; the art is now vector, not glyphs.)

## The one person

A developer coding alone late at night, a little bored, who wants to post
"I'm doing Kiroween this year — anyone want to join?" in a group chat with a
striking, grotesque-but-cool haunted invitation.

## Golden Path (the single journey the demo proves)

A visitor picks a purpose, year, nickname, and a look (mood / palette / glow)
and decorates the ghost → the code deterministically renders an SVG invitation
→ the visitor saves it as a PNG or copies a share link that reconstructs the
exact same invitation.

## Out of scope (do not build)

- Server, login, accounts, databases.
- AI/LLM in the render path (breaks determinism and PBT).
- Any feature that doesn't serve the Golden Path above.
