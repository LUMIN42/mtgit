# MTGit software specification

Author: Tomáš Jaroň

App is developed at [MTGit Github](https://github.com/LUMIN42/mtgit).

## Summary

Web application deck editor for the collectable card
game [Magic, the Gathering](https://en.wikipedia.org/wiki/Magic:_The_Gathering). The project is inspired by git
branching principles. It tracks multiple variants of the same deck and allows for their quick comparison and history
tracking.

## Motivation & Overview

Industry standard Magic the Gathering (MTG from now on) deck editors make it hard to track multiple versions of the same
deck concurrently.

### Motivational use-cases

Maintain a stable version of a deck while making experimental changes, allowing unsuccessful modifications to be
discarded without losing a stable state.

Maintaining a separate list containing cards that had previously performed well but are not currently included in the
deck, making them readily available for future consideration.

Maintaining a version containing unreleased or previewed cards for evaluating potential future deck configurations while
still keeping track of the owned version.

Maintaining separate versions representing the intended deck configuration and the currently owned physical collection,
allowing progress toward the target deck to be tracked.

### Main Features

- deck repository and branch CRUD
- comparison between branches
- deck history viewing
- standard mtg deck info display
    - card count in the deck
    - mana curve analysis
    - colors analysis
    - grouping cards by tags
    - estimated deck cost
- deck import & export

### Comparison to existing solutions

Other deck building apps expect tracking only one deck version at a time. Thought they are far better established and
offer a very large amount of features. The semestral project will not match all of them.

#### Moxfield

[Link to Moxfield](https://moxfield.com/)

While it does technically allow for deck comparison, it requires a whole separate independent deck for each version,
requiring copy-pasting their URLs manually, which renders workflows proposed in the MTGit app impractical.

There are some slight UX issues with the application. While using image view of the deck, it requires an inordinate
amount of scrolling to view the mana curve, which is an important piece of information one should have access to almost
at all times. Same is true for switching the grouping and sorting mode.

Deck card filtering requires about 3 precise clicks to get going, which is somewhat cumbersome.

However, their overall user interface design serves as a quality benchmark. The MTGit project will strive to provide a
comparable user experience within the constraints of the project scope.

#### Archidekt

[Link to Archidekt](https://archidekt.com/)

Same issues apply as for moxfield.

Archidekt has interesting card detail UI upon left-clicking. It will be used in MTGit as well. It also has
great [Edhrec](#edhrec) and [Scryfall Tagger](#scryfall-tagger) integrations, which will likely be added to MTGit as a
part of the bachelor's thesis after the semestral project. Though the first impression from the UI look is not as good
as Moxfield.

#### TappedOut

[Link to TappedOut](https://tappedout.net/)

Again, same issues as with the others.

There has been positive reception about their usage of graphs. It might be taken as inspiration. The UI look is
definitely the most archaic out of the mentioned.

## Technologies used

### Shared

- [Typescript](https://www.typescriptlang.org/)
- [Zod](https://zod.dev/) schema validation
- [Trpc](https://trpc.io/) frontend-backend communication protocol
- [EsLint](https://eslint.org/)

### Frontend

- [React](https://react.dev/) frontend framework
- [Vite](https://vite.dev/) build tool
- [Mantine](https://mantine.dev) UI framework
- [Tanstack Query](https://tanstack.com) fetch state management

### Backend

- [Express](https://expressjs.com/) backend base
- [Mongo](https://www.mongodb.com/) database

## Deployment

The frontend & backend shall be deployed at [Render](https://render.com/) and the database shall be deployed
using [Mongo Atlas](https://www.mongodb.com/products/platform/atlas-database).

The database needs the up to date [scryfall card bulk data](#scryfall-bulk-data) uploaded into it in order for the app
to work properly. Automatic bulk data refetching will not be a part of the project and will most likely be done in the
followup bachelor's thesis.

## Runtime

The application should work on any reasonably sized device including phones and with any reasonably up-to-date browser.

# Functional Requirements

## FR-1 Authentication

**FR-1.1** The system shall provide a user registration screen.

**FR-1.2** The system shall provide a user login screen.

## FR-2 Repository Management

**FR-2.1** The system shall display a list of all repositories owned by the authenticated user.

**FR-2.2** The system shall allow the user to create a new repository.

## FR-3 Deck Display

**FR-3.1** The system shall display the contents of the selected deck branch.

**FR-3.2** The system shall allow the user to select the grouping mode used to display cards.

**FR-3.3** The system shall support the following grouping modes:

- no grouping,
- mana value,
- color,
- tags,
- primary card type.

**FR-3.4** The system shall allow the user to select the ordering of cards within each group.

**FR-3.5** The system shall support ordering by:

- card name,
- mana value,
- price in USD.

**FR-3.6** The system shall allow the user to display cards in either text mode or image mode.

## FR-4 Deck Analysis

**FR-4.1** The system shall display the deck's mana curve.

**FR-4.2** The system shall display deck card counts.

**FR-4.3** The system shall display a pie chart showing mana production and mana consumption by color.

**FR-4.4** The system shall display the estimated total deck price in USD.

**FR-4.5** The system shall compare deck card counts against the requirements of the selected
deck [format](#mtg-deck-format).

## FR-5 Card Tagging

**FR-5.1** The system shall allow the user to assign any number of custom tags to each card within a repository.

**FR-5.2** The system shall allow cards to be grouped by user-defined tags.

## FR-6 Card Search

**FR-6.1** The system shall allow users to search for cards using the [Scryfall query syntax](#scryfall-query).

**FR-6.2** The system shall retrieve search results using
the [Scryfall API](https://scryfall.com/docs/api/cards/search).

**FR-6.3** The system shall allow cards from the search results to be added to the selected deck branch.

### Search Query Defaults

**FR-6.4** The system shall allow the user to define a default query suffix appended automatically to
every [search query](#scryfall-query) within the repository.

## FR-7 Card Filtering

**FR-7.1** The system shall allow the displayed deck contents to be filtered using
the [Scryfall query syntax](#scryfall-query).

**FR-7.2** The system shall perform card filtering via [scryfall query syntax](#scryfall-query) locally without querying
the Scryfall API.

## FR-8 Branch Management

**FR-8.1** The system shall allow the user to create branches.

**FR-8.2** The system shall allow the user to rename branches.

**FR-8.3** The system shall allow the user to delete branches.

**FR-8.4** The system shall allow the user to switch between branches.

## FR-9 Branch Comparison

**FR-9.1** The system shall allow the user to compare any two branches of a repository.

**FR-9.2** The system shall allow the user to display either only differing cards or the complete contents of both
branches.

**FR-9.3** The system shall display the compared branches side by side.

**FR-9.4** The comparison view shall support the same grouping modes as the standard deck view.

**FR-9.5** The system shall designate one branch as edited and the other as the comparison branch.

**FR-9.6** Editing card quantities in the comparison view shall modify only the edited branch.

## FR-10 Branch History

**FR-10.1** The system shall let the user display the edit history of the selected branch.

**FR-10.2** The system shall allow any historical revision to be compared with the current branch state
through [branch comparison](#fr-9-branch-comparison).

## FR-11 Deck Import

**FR-11.1** The system shall import decks serialized in the MTGO format.

**FR-11.2** The system shall import decks serialized in the MTGA format.

**FR-11.3** The system shall import decks serialized using the Moxfield bulk edit format, including card tags.

## FR-12 Deck Export

**FR-12.1** The system shall export decks in the MTGO text format.

**FR-12.2** The system shall export decks in the MTGA text format.

**FR-12.3** The system shall copy exported deck lists to the system clipboard.

## Screens

Login screen, register screen, deck viewing screen, deck comparison screen, deck history screen.

Their looks will be determined throughout development, since determining it right in the specification could easily lead
to unforeseen issues.

## Negative Requirements

The system shall provide standard usability features but shall not include accessibility support for users with severe
visual impairments. The scope of the application is limited by the accessibility requirements of the underlying physical
card game, which relies heavily on visual information.

Public-facing backend API documentation shall not be required.

## Intellectual Property and Third-Party Affiliation Disclaimer

MTGit is an independent project and is not affiliated with, endorsed by, sponsored by, or otherwise associated with any
third-party products, services, companies, or organizations mentioned in this document.

## Glossary

### MTG Deck Format

An MTG deck format defines the rules and restrictions used when constructing and playing a deck.

Before playing a game, all players must agree on the format being used. Each format specifies which cards are legal to
use and may introduce additional gameplay or deck construction rules.

### Scryfall

Public MTG card database. Industry standard for working with MTG card data.

[Link to Scryfall](https://scryfall.com/)

#### Scryfall Bulk Data

Data for all the MTG cards provided in JSONL format.

Further information can be found on
the [official scryfall bulk data documentation](https://scryfall.com/docs/api/bulk-data)
site.

The project shall use the Oracle Cards file.

#### Scryfall Query

Scryfall syntax for searching for cards.

The search results are paginated.

Example:

```scryfall
usd<2 order:name color:red -color:blue
```

Searches for all cards which cost less than 2 US dollars while being of red color and not of blue color.

[Full Scryfall Query Documentation](https://scryfall.com/docs/syntax)

#### Scryfall Tagger

A community built public database for assigning tags to cards, allowing for better filtering based on more abstract
concepts which are not reflected in the card's text by a specific keyword.

[Scryfall Tagger Link]([****](https://tagger.scryfall.com/))

### EDHrec

Industry standard for card recommendations for the EDH (also known as commander) [format](#mtg-deck-format).

[EDHrec Link](https://edhrec.com/)