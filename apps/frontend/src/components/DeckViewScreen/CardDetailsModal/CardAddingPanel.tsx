import React from "react";
import {useRepositoryContext} from "../../../context/RepositoryContext.tsx";
import {canBeCommander, relevantSections} from "@mtgit/shared";
import {Paper, Table} from "@mantine/core";
import CardAmountEditor from "../CardAmountEditor.tsx";
import {useCardCache} from "../../../context/CardCacheContext.tsx";
import {useRepositoryPreferences} from "../../../context/RepositoryPreferencesContext.tsx";
import {useDeckUrlManager} from "../../../hooks/DeckUrlManager.tsx";


type CardAddingPanelProps =
  {
    oracle_id: string;
  };

function CardAddingPanel({oracle_id}: CardAddingPanelProps) {
  const {repository} = useRepositoryContext();
  const {tryGetCard} = useCardCache();

  const {preferences} = useRepositoryPreferences();

  const {editedBranchName} = useDeckUrlManager();

  const hydratedCard = tryGetCard(oracle_id);


  const isCommanderCandidate = hydratedCard ? canBeCommander(hydratedCard) : false;


  return (
    <Paper withBorder>
      <Table w={"fit-content"} style={{whiteSpace: "nowrap", textAlign: "center"}}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th ta={"center"}>Branch name</Table.Th>

            {
              relevantSections(repository.format)
                .map(
                  sectionName => {
                    if (sectionName == "Commander" && !isCommanderCandidate) {
                      return null;
                    }

                    return (
                      <Table.Th key={sectionName}>
                        {sectionName}
                      </Table.Th>);
                  }
                )
            }
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {Object.keys(repository.branches)
            .filter(branchName => !preferences.hiddenBranches.includes(branchName) || branchName === editedBranchName)
            .map(branchName => {
              return (
                <Table.Tr key={branchName}>
                  <Table.Td ta={"center"}>{branchName}</Table.Td>

                  {
                    relevantSections(repository.format)
                      .map(
                        sectionName => {
                          if (sectionName == "Commander" && !isCommanderCandidate) {
                            return null;
                          }

                          return (<Table.Td ta={"center"} key={sectionName}>
                            <CardAmountEditor branchName={branchName} oracleId={oracle_id} deckSection={sectionName}/>
                          </Table.Td>);
                        }
                      )
                  }


                </Table.Tr>
              );
            })}
        </Table.Tbody>
      </Table>
    </Paper>

  );
}

export default CardAddingPanel;