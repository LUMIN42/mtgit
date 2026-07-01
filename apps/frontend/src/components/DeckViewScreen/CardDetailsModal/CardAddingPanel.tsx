import React from "react";
import {useRepositoryContext} from "../../../context/RepositoryContext.tsx";
import {DeckCard, relevantSections} from "@mtgit/shared";
import {Table} from "@mantine/core";
import CardAmountEditor from "../CardAmountEditor.tsx";


type CardAddingPanelProps = {
  cardAmount: DeckCard;
};

function CardAddingPanel({cardAmount}: CardAddingPanelProps) {
  const {repository} = useRepositoryContext();

  const {oracle_id} = cardAmount;

  const canBeCommander = cardAmount.type_line.includes("Legendary") &&
    cardAmount.type_line.includes("Creature");

  return (
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

      <colgroup>
        <col style={{width: "10%"}}/>
        <col style={{width: "10%"}}/>
      </colgroup>

      <Table.Tbody>
        {Object.keys(repository.branches).map(branchName => {
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
  );
}

export default CardAddingPanel;