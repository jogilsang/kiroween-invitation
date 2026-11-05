# Steering: Product

> Why: keep every build decision anchored to one goal and one user, so features don't drift.
> Effect: the agent rejects work that doesn't serve the Golden Path below.

## Goal (one paragraph)

ASCII Invite lets a developer decorate a Kiro ghost and a pumpkin in a dark
Halloween theme and turn their settings into a polished ASCII-art invitation,
then save it as an image or share it by link. It serves three purposes
(declaring you're joining, announcing an event, recruiting teammates) and a
variable year so it is reusable next year. The whole thing is client-only:
no server, no account, no database.

## The one person

A developer coding alone late at night, a little bored, who wants to post
"I'm doing Kiroween this year — anyone want to join?" in a group chat with
old-school ASCII-art charm.

## Golden Path (the single journey the demo proves)

A visitor picks a purpose, year, and nickname and decorates the ghost → the
code deterministically renders an ASCII invitation → the visitor saves it as a
PNG or copies a share link that reconstructs the exact same invitation.

## Out of scope (do not build)

- Server, login, accounts, databases.
- AI/LLM in the render path (breaks determinism and PBT).
- Any feature that doesn't serve the Golden Path above.
