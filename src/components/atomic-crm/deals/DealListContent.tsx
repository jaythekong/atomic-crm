import { DragDropContext, type OnDragEndResponder } from "@hello-pangea/dnd";
import isEqual from "lodash/isEqual";
import { useDataProvider, useListContext, type DataProvider } from "ra-core";
import { useEffect, useState } from "react";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal } from "../types";
import { DealColumn } from "./DealColumn";
import type { DealsByStage } from "./stages";
import { getDealsByStage } from "./stages";

export const DealListContent = () => {
  const { dealStages } = useConfigurationContext();
  const { data: unorderedDeals, isPending, refetch } = useListContext<Deal>();
  const dataProvider = useDataProvider();

  const [dealsByStage, setDealsByStage] = useState<DealsByStage>(
    getDealsByStage([], dealStages),
  );

  useEffect(() => {
    if (unorderedDeals) {
      const newDealsByStage = getDealsByStage(unorderedDeals, dealStages);
      if (!isEqual(newDealsByStage, dealsByStage)) {
        setDealsByStage(newDealsByStage);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unorderedDeals]);

  if (isPending) return null;

  const onDragEnd: OnDragEndResponder = (result) => {
    const { destination, source } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceStage = source.droppableId;
    const destinationStage = destination.droppableId;
    const sourceDeal = dealsByStage[sourceStage][source.index]!;

    // Optimistic local update so the card moves instantly
    setDealsByStage(
      updateDealStageLocal(
        sourceDeal,
        { stage: sourceStage, index: source.index },
        { stage: destinationStage, index: destination.index },
        dealsByStage,
      ),
    );

    // Single API call: update only the moved deal's stage + index.
    // The worker does a fetch-then-merge so only these two fields change.
    dataProvider
      .update("deals", {
        id: sourceDeal.id,
        data: {
          stage: destinationStage,
          index: destination.index,
        },
        previousData: sourceDeal,
      })
      .then(() => refetch())
      .catch(() => refetch()); // refetch even on error to restore true state
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4">
        {dealStages.map((stage) => (
          <DealColumn
            stage={stage.value}
            deals={dealsByStage[stage.value]}
            key={stage.value}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

const updateDealStageLocal = (
  sourceDeal: Deal,
  source: { stage: string; index: number },
  destination: {
    stage: string;
    index?: number;
  },
  dealsByStage: DealsByStage,
) => {
  if (source.stage === destination.stage) {
    const column = [...dealsByStage[source.stage]];
    column.splice(source.index, 1);
    column.splice(destination.index ?? column.length + 1, 0, sourceDeal);
    return { ...dealsByStage, [destination.stage]: column };
  } else {
    const sourceColumn = [...dealsByStage[source.stage]];
    const destinationColumn = [...dealsByStage[destination.stage]];
    sourceColumn.splice(source.index, 1);
    destinationColumn.splice(
      destination.index ?? destinationColumn.length + 1,
      0,
      sourceDeal,
    );
    return {
      ...dealsByStage,
      [source.stage]: sourceColumn,
      [destination.stage]: destinationColumn,
    };
  }
};
