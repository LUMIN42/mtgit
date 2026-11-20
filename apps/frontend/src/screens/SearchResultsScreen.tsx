import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {ActionIcon, Button, Center, Group, Loader, Stack, Text, TextInput} from "@mantine/core";
import {SearchBox} from "../components/SearchBox.tsx";
import {CardGroup} from "../components/DeckViewScreen/CardGroup.tsx";
import {CardDetailsModal} from "../components/DeckViewScreen/CardDetailsModal/CardDetailsModal.tsx";
import {useCardSelectionManager} from "../hooks/CardSelectionManager.ts";
import {useCardCache} from "../context/CardCacheContext.tsx";
import {useRepositoryPreferences} from "../context/RepositoryPreferencesContext.tsx";
import {IconCheck, IconPencil} from "@tabler/icons-react";
import {Link} from "react-router-dom";
import {useDeckUrlManager} from "../hooks/DeckUrlManager.tsx";
import {isDeckDependentQuery, groupSource, useScryfallCardRetriever} from "../utils/scryfallSearch.ts";
import {useCommanderGroups} from "../utils/groupSearch.ts";
import {CommanderGroups} from "../components/CommanderGroups.tsx";
import {useRepositoryContext} from "../context/RepositoryContext.tsx";
import type {DeckGroupCardLocation} from "../types/addressedCards.ts";
import type {TaggedCard} from "@mtgit/shared";
import type {OracleCard} from "@mtgit/shared/scryfall";

export function SearchResultsScreen() {

  // the submitted query lives in the URL, so a reload repeats the search
  const {buildDeckViewPath, searchQuery, navigateToSearch} = useDeckUrlManager();

  // text being typed into the search box, submitted into the URL on enter
  const [searchText, setSearchText] = useState(searchQuery);

  // follow the URL on back / forward navigation
  useEffect(() => {
    setSearchText(searchQuery);
  }, [searchQuery]);

  const {
    preferences: {defaultQuery},
    updatePreferences,
    isPending: arePreferencesLoading
  } = useRepositoryPreferences();

  // draft of the default query, only used while it is being edited
  const [defaultQueryDraft, setDefaultQueryDraft] = useState<string | null>(null);
  const editingDefaultQuery = defaultQueryDraft !== null;

  const saveDefaultQuery = () => {
    if (defaultQueryDraft !== null && defaultQueryDraft !== defaultQuery) {
      updatePreferences({defaultQuery: defaultQueryDraft.trim()});
    }
    setDefaultQueryDraft(null);
  };

  const {selectedBranchContent, isLoading: isRepositoryLoading} = useRepositoryContext();

  const {fetchMissingCards, tryGetCard} = useCardCache();

  const {
    oracleId,
    openModal,
    closeModal,
    moveLeft,
    moveRight,
    hasNextLeft,
    hasNextRight
  } = useCardSelectionManager();

  const {
    fetchNextPage,
    ids: cardIds,
    setQuery,
    isFetchingNextPage,
    isLoading: isLoadingScryfall,
    query: lockedInQuery,
    messages: searchMessages,
    isRecommendation,
    isGroups,
    deck: lockedInDeck
  } = useScryfallCardRetriever();

  const fullQuery = `${defaultQuery} ${searchQuery}`.trim();

  // runs the search once everything it depends on is loaded (relevant after a page reload)
  // and again whenever the query or the default query changes
  useEffect(() => {
    if (arePreferencesLoading) {
      return;
    }

    // recommendations are computed from the deck, so wait for it to load
    if (isDeckDependentQuery(fullQuery) && isRepositoryLoading) {
      return;
    }

    // the deck is deliberately not a dependency, so adding a card does not reshuffle the recommendations
    setQuery(fullQuery, selectedBranchContent);
  }, [fullQuery, arePreferencesLoading, isRepositoryLoading]);

  const groupQuery = useCommanderGroups(lockedInQuery, lockedInDeck, isGroups);
  const isClustering = groupSource(lockedInQuery) === "clustering";

  const groupMessages = isGroups
    ? [
      groupQuery.error?.message,
      groupQuery.data?.message ?? (groupQuery.data?.commanderName
        ? isClustering
          ? `Clusters of ${groupQuery.data.commanderName} decks (${groupQuery.data.modelDescription}).`
          : `Neurons of ${groupQuery.data.commanderName}'s recommendation model (${groupQuery.data.modelDescription}).`
        : undefined),
      ...(groupQuery.data?.warnings ?? [])
    ].filter(message => message !== undefined)
    : [];

  const messages = isGroups ? groupMessages : searchMessages;

  useEffect(() => {
    document.title = `MTGit Card Search Results`;
  }, [lockedInQuery]);

  const redownloadedCards = useMemo(
    () => cardIds.map(tryGetCard).filter(card => card !== undefined),
    [cardIds, tryGetCard]
  );

  const isLoadingRedownloaded = redownloadedCards.length !== cardIds.length;

  // infinite scroll: load the next page once a sentinel below the results gets within a screen of the viewport,
  // observing instead of listening to scroll events, which re-rendered the whole result grid on every scrolled pixel
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;

    // the group view shows everything at once, its scryfall query is disabled
    if (!sentinel || isGroups) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          fetchNextPage();
        }
      },
      {rootMargin: "0px 0px 100% 0px"}
    );

    // observing reports the current state right away, so re-creating the observer after each loaded page
    // keeps loading while the sentinel is still in view
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [isGroups, fetchNextPage, cardIds.length]);

  const isLoading = isGroups ? groupQuery.isLoading : isLoadingScryfall || isLoadingRedownloaded;

  useEffect(() => {
    fetchMissingCards(cardIds);
  }, [cardIds]);


  // reuse the tagged object of every already shown card, so loading the next page re-renders only the new cards
  const taggedCardCache = useRef(new WeakMap<OracleCard, TaggedCard>());

  const cardsWithTags = useMemo(
    () => redownloadedCards.map(card => {
      let tagged = taggedCardCache.current.get(card);
      if (!tagged) {
        tagged = {...card, tags: []};
        taggedCardCache.current.set(card, tagged);
      }
      return tagged;
    }),
    [redownloadedCards]
  );


  const isDeckDependentResultEmpty = isGroups
    ? groupQuery.isError || groupQuery.data?.groups.length === 0
    : isRecommendation && cardIds.length === 0;

  // stable, so the memoized cards in the grid do not re-render when unrelated screen state changes
  const handleCardSelect = useCallback((location: DeckGroupCardLocation) => {
    openModal(
      // location set to empty, since there is only one location, thus is not needed
      cardIds.map(oracle_id => ({oracle_id, location: {}})),
      {oracle_id: location.oracle_id, location: {}}
    );
  }, [cardIds, openModal]);

  const handleSearchSubmit = (text: string) => {
    navigateToSearch(text.trim());
  };

  return (
    <Stack gap={"md"} maw={1200} mx={"auto"} w={"100%"}>
      <Button component={Link} to={buildDeckViewPath()} w={"fit-content"}>
        Return to Deck View
        {/*  todo rewrite as a chevron */}
      </Button>
      <SearchBox
        value={searchText}
        onChange={setSearchText}
        onSearch={handleSearchSubmit}
        label={"Scryfall Search Query"}
      />

      <Group w="100%" gap={"xs"} align="center" c={editingDefaultQuery ? "inherit" : "dimmed"}>
        <Text size={editingDefaultQuery ? "md" : "xs"} fw={500}>
          Query Defaults:
        </Text>

        {editingDefaultQuery ? (
          <>
            <TextInput
              value={defaultQueryDraft}
              onChange={event => setDefaultQueryDraft(event.currentTarget.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  saveDefaultQuery();
                }
              }}
              autoFocus
              style={{flex: 1}}
            />

            <ActionIcon
              variant={"gradient"}
              onClick={saveDefaultQuery}
            >
              <IconCheck/>
            </ActionIcon>
          </>
        ) : (
          <>
            <Text size="xs">
              {defaultQuery}
            </Text>
            <ActionIcon
              variant="white"
              size="xs"
              onClick={() => setDefaultQueryDraft(defaultQuery)}
            >
              <IconPencil size={14} color="var(--mantine-color-dimmed)"/>
            </ActionIcon>
          </>
        )}
      </Group>


      <Text size="sm" c="dimmed">
        {lockedInQuery
          ? isGroups
            ? `Showing ${groupQuery.data?.groups.length ?? 0} ${isClustering ? "cluster" : "neuron"}(s) for: ${lockedInQuery}`
            : `Showing ${cardIds.length} result(s) for: ${lockedInQuery}`
          : "Type a search and press Enter or click the search icon. Use order:rec for deck recommendations, "
            + "order:color-elsa for recommendations from your commander's color identity model alone, "
            + "order:neurons to see what the recommendation model has learned about your commander, "
            + "order:clustering for the kinds of decks built around it."}
      </Text>
      {
        messages.map(message => (
          <Text key={message} size="sm" c={isDeckDependentResultEmpty ? "red" : "dimmed"}>
            {message}
          </Text>
        ))
      }
      {isGroups
        ? (
          <CommanderGroups
            groups={groupQuery.data?.groups ?? []}
            onCardSelect={openModal}
          />
        )
        : <CardGroup
          cards={cardsWithTags}
          sectionName="Main"
          quicklyAdjustable
          onCardSelect={handleCardSelect}
          minWidth={190}
          displayMode={"Images"}
        />}

      <div ref={loadMoreSentinelRef}/>

      {
        (isFetchingNextPage || isLoading) &&
        (<Center>
          <Loader size={"xl"}/>
        </Center>)
      }

      {
        oracleId &&
        (<CardDetailsModal onClose={closeModal}
          oracle_id={oracleId}
          onPrev={moveLeft}
          onNext={moveRight}
          hasPrevious={hasNextLeft}
          hasNext={hasNextRight}
        />)
      }

    </Stack>
  );
}
