import {useEffect, useMemo, useState} from "react";
import {ActionIcon, Button, Center, Group, Loader, Stack, Text, TextInput} from "@mantine/core";
import {SearchBox} from "../components/SearchBox.tsx";
import {CardGroup} from "../components/DeckViewScreen/CardGroup.tsx";
import {CardDetailsModal} from "../components/DeckViewScreen/CardDetailsModal/CardDetailsModal.tsx";
import {useDeckUiContext} from "../context/DeckUiContext.tsx";
import {useCardSelectionManager} from "../hooks/CardSelectionManager.ts";
import {useCardCache} from "../context/CardCacheContext.tsx";
import {useRepositoryPreferences} from "../context/RepositoryPreferencesContext.tsx";
import {IconCheck, IconPencil} from "@tabler/icons-react";
import {Link} from "react-router-dom";
import {useDeckUrlManager} from "../hooks/DeckUrlManager.tsx";
import {useWindowScroll} from "@mantine/hooks";
import {isDeckDependentQuery, groupSource, useScryfallCardRetriever} from "../utils/scryfallSearch.ts";
import {useCommanderGroups} from "../utils/groupSearch.ts";
import {CommanderGroups} from "../components/CommanderGroups.tsx";
import {useRepositoryContext} from "../context/RepositoryContext.tsx";

export function SearchResultsScreen() {

  const {searchQuery, setSearchQuery} = useDeckUiContext();

  const {preferences: {defaultQuery}, updatePreferences} = useRepositoryPreferences();

  const [defaultQueryField, setDefaultQueryField] = useState(defaultQuery);

  const [editingDefaultQuery, setEditingDefaultQuery] = useState<boolean>(false);

  const {selectedBranchContent, isLoading: isRepositoryLoading} = useRepositoryContext();

  const {buildDeckViewPath} = useDeckUrlManager();

  // recommendations are computed from the deck, so wait for it to load (relevant after a page reload)
  useEffect(() => {
    if (!isRepositoryLoading || !isDeckDependentQuery(searchQuery)) {
      handleSearchSubmit();
    }
  }, [isRepositoryLoading]);

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

  const [scroll] = useWindowScroll();

  useEffect(() => {
    const threshold = window.innerHeight;

    const atBottom =
      window.scrollY + window.innerHeight >=
      document.documentElement.scrollHeight - threshold;

    // the group view shows everything at once, its scryfall query is disabled
    if (atBottom && !isGroups) {
      fetchNextPage();
    }
  }, [scroll.y]);

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

  const redownloadedCards = cardIds
    .map(tryGetCard).filter(card => card !== undefined);

  const isLoadingRedownloaded = redownloadedCards.length !== cardIds.length;

  const isLoading = isGroups ? groupQuery.isLoading : isLoadingScryfall || isLoadingRedownloaded;

  useEffect(() => {
    fetchMissingCards(cardIds);
  }, [cardIds]);


  const cardsWithTags = useMemo(
    () => redownloadedCards.map(card => ({...card, tags: []})),
    [redownloadedCards]
  );


  const isDeckDependentResultEmpty = isGroups
    ? groupQuery.isError || groupQuery.data?.groups.length === 0
    : isRecommendation && cardIds.length === 0;

  const handleSearchSubmit = () => {
    setQuery(`${defaultQueryField} ${searchQuery}`, selectedBranchContent);

    if (defaultQueryField) {
      updatePreferences({
        defaultQuery: defaultQueryField
      });
    }
  };

  return (
    <Stack gap={"md"} maw={1200} mx={"auto"} w={"100%"}>
      <Button component={Link} to={buildDeckViewPath()} w={"fit-content"}>
        Return to Deck View
        {/*  todo rewrite as a chevron */}
      </Button>
      <SearchBox
        value={searchQuery}
        onChange={text => setSearchQuery(text)}
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
              value={defaultQueryField}
              onInput={event => setDefaultQueryField(event.currentTarget.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  handleSearchSubmit();
                }
              }}
              style={{flex: 1}}
            />

            <ActionIcon
              variant={"gradient"}
              onClick={() => {
                handleSearchSubmit();
                setEditingDefaultQuery(false);
              }}
            >
              <IconCheck/>
            </ActionIcon>
          </>
        ) : (
          <>
            <Text size="xs">
              {defaultQueryField}
            </Text>
            <ActionIcon
              variant="white"
              size="xs"
              onClick={() => setEditingDefaultQuery(true)}
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
          onCardSelect={location => {
            openModal(
              // location set to empty, since there is only one location, thus is not needed
              cardIds
                .map(oracle_id => {
                  return {oracle_id, location: {}};
                }),
              {oracle_id: location.oracle_id, location: {}}
            );
          }}
          minWidth={190}
          displayMode={"Images"}
        />}

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
