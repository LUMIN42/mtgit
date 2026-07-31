import React from "react";
import {useRepositoryContext} from "../../../context/RepositoryContext.tsx";
import {relevantSections} from "@mtgit/shared";
import {Paper, Table} from "@mantine/core";
import CardAmountEditor from "../CardAmountEditor.tsx";
import {useScryfallCache} from "../../../context/ScryfallCacheContext.tsx";
import {useRepositoryPreferences} from "../../../context/RepositoryPreferencesContext.tsx";
import {useDeckUrlManager} from "../../../hooks/DeckUrlManager.tsx";


type CardAddingPanelProps =
  {
    oracle_id: string;
  };

function CardAddingPanel({oracle_id}: CardAddingPanelProps) {
  const {repository} = useRepositoryContext();
  const {tryGetCard} = useScryfallCache();

  const {preferences} = useRepositoryPreferences();

  const {editedBranchName} = useDeckUrlManager();

  const hydratedCard = tryGetCard(oracle_id);


  // todo extract to a proper place
  const canBeCommander =
    hydratedCard ?
      hydratedCard.type_line.includes("Legendary") &&
      hydratedCard.type_line.includes("Creature") : false;


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
                    if (sectionName == "Commander" && !canBeCommander) {
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
                          if (sectionName == "Commander" && !canBeCommander) {
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