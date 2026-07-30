# MTGit software specification

Author: Tomáš Jaroň

App is developed at [MTGit Github](https://github.com/LUMIN42/mtgit).

## Summary

Web application deck editor for the collectable card game Magic, the Gathering. The project is inspired by git branching
principles. Tracks multiple variants of the same deck and allows for their quick comparison and history tracking.

## Motivation & Overview

Industry standard Magic the Gathering (MTG from now on) deck editors make it hard to track multiple versions of the same
deck concurrently.

### Motivational use-cases

I am working on a deck and am trying to make experimental updates while keeping around a stable version for rollbacking
changes which prove to be detrimental.

I also want to keep a separate pile of cards which have proven themselves to work well, but are not in the current
version of the deck. They might come in handy later in the deck creation process.

I would like to keep a separate version which contains cards which have been teased, but are not released yet.

I would like to track the version of the deck I am aspiring to compared to the version I currently own in real life, as
I don't own all the needed cards yet.

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

Other apps expect you to only have one deck version at a time. Thought they are far better established and offer a very
large amount of features which I won't have time to match during the single semester.

#### Moxfield

I have the most experience with Moxfield by far. While it does technically allow for deck comparison, it requires you to
have a whole separate independent deck for each version, and you need to copy-paste their URLs manually, which makes
workflows proposed in the MTGit app impractical.

I also have some UX issues with the app. While using image view of the deck, the app requires an inordinate amount of
scrolling to view the mana curve, which is an important piece of information you should have access to almost at all
times. Same is true for switching the grouping and sorting mode.

Deck card filtering requires about 3 precise clicks to get going, which is very cumbersome.

However, their overall UI look is top-tier. I will strive to match it, but I will most likely fail.

#### Archidekt

Same issues apply as for moxfield.

I really like their card detail UI upon left-clicking. It will be used in MTGit as well. It also has
great [Edhrec](#edhrec) and
[Scryfall Tagger](#scryfall-tagger) integrations, which will likely be added to MTGit as a part of the bachelor's thesis
after the semestral project. Though the first impression from the UI look is not as good as Moxfield.

#### TappedOut

Again, same issues as with the others.

I have heard some people praise the UX of their plots for deck breakdown. I might use that as an inspiration. The UI
looks definitely the most archaic out of the mentioned.

## Technologies used

### Shared

- [Typescript](https://www.typescriptlang.org/)
- [Zod](https://zod.dev/) schema validation
- [Trpc](https://trpc.io/) frontend-backend communication protocol
- [EsLint](https://eslint.org/)

### Frontend

- [React](https://react.dev/)
- [Vite](https://vite.dev/)
- [Mantine](https://mantine.dev) UI framework
- [Tanstack Query](https://tanstack.com)

### Backend

- [Express](https://expressjs.com/) backend base
- [Mongo](https://www.mongodb.com/) database

## Deployment

The frontend & backend will be deployed at [Render](https://render.com/) and the database will be deployed
using [Mongo Atlas](https://www.mongodb.com/products/platform/atlas-database).

The database will need the up to date [scryfall card bulk data](#scryfall-bulk-data) uploaded into it in order for the
app to work properly. Automatic bulk data refetching will not be a part of the project and will most likely be done in
the followup bachelor's thesis.

## Runtime

The app should work on any reasonably sized device including phones and with any reasonably up-to-date browser.

## Functionalities

### Login & register screens

### Listing out all of user's repositories & creating new

### Deck Displaying

The grouping and the ordering inside the group can be toggled using the UI.

#### Grouping

The following grouping modes will be offered:

- mana value
- color
- tags
- main card type (Artifact, Creature etc.)
- no grouping

#### Ordering

Will support sorting the cards in each group by name, price (in USD) and mana value.

#### Text mode & Image mode

Allows viewing the cards either by text names or by their card image.

### Basic deck data analysis

- mana curve plot
- deck card counts checking
- pie chart for color production & consumption
- deck's total estimated cost in USD
- card counts compared to what is expected in the deck format

### Card tagging

Each card in a repository may possess any amount of user-defined tags. User may then group their cards based on tags.

### Scryfall card search

Cards can be searched in the app through the [Scryfall Query syntax](#scryfall-query). Searched cards can be added to
the deck.

This will be executed by querying [scryfall API](https://scryfall.com/docs/api) directly.

#### Search query defaults

User may choose a suffix they add at the end of each query. Can be used for commander color identity enforcement, for
budget restrictions, default ordering etc. Mostly there to save a lot of typing of the same query parts over and over
again.

### Card filtering

A user may choose to filter the cards in their deck by a [scryfall search query](#scryfall-card-search). This will be
done on the frontend without using the scryfall API and thus may not support all the scryfall query features.

### Basic branch management

Branch CRUD.

### Branch switching

### Comparing two branches

A user may choose to compare the contents of two of their branches. They may either choose to show only the differences
or show the whole deck lists. Either way, they will be displayed side by side while allowing for grouping similar to the
standard deck viewing screen.

There is always one branch selected for editing and the other selected for comparison.

In the comparison screen, a user may tweak the amount of each card displayed on the screen. This edits the amounts saved
in the edited branch.

### Branch History

A user may view the edits history of the currently selected branch.

Any point in time of the history branch may be used to enter comparison screen with the current version of the deck.

### Deck Import

Will support MTGO and MTGA deck text serialization formats as well as moxfield bulk edit format, which includes tags as
well.

### Deck Export

Deck may be exported in MTGO or MTGA text serialization format. In both cases, it is copied into clipboard.

## Screens

Login screen, register screen, deck viewing screen, deck comparison screen, deck history screen.

Their looks will be determined throughout development, since determining it right in the specification could easily lead
to unforeseen issues. The feel of the app is hard to get right and is quite vital for this project.

## Negative Requirements

High accessibility will not be required, as people with a sight disability would have a very hard time playing MTG
anyway.

Public-facing backend API documentation will not be required.

## Glossary

### MTG Deck Format

There are different formats for playing MTG. If you play magic with somebody else, you need to agree on the format you
are playing first.

Each format allows for different cards to be used and may have special rules attached to it.

### Scryfall

Public MTG card database. Industry standard for working with MTG card data.

[scryfall.com](https://scryfall.com/)

#### Scryfall Bulk Data

Data for all the cards provided in jsonl format.

I will be using the Oracle Cards file.

Further info can be found on the [official scryfall bulk data documentation](https://scryfall.com/docs/api/bulk-data)
site.

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

A community built public database for assigning tags to cards, which allows for better filtering based on more abstract
concepts which are not reflected in the card's text by a specific keyword.

### Edhrec

Industry standard for card recommendations for the EDH (aka commander) [format](#mtg-deck-format).