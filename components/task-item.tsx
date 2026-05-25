"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskDragHandle, TaskItemCore, type TaskItemCoreProps } from "./task-item-core";

type TaskItemProps = Omit<
  TaskItemCoreProps,
  "dragHandle" | "containerRef" | "containerStyle" | "isDragging"
>;

export default function TaskItem(props: TaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.task._id });

  return (
    <TaskItemCore
      {...props}
      containerRef={setNodeRef}
      containerStyle={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      isDragging={isDragging}
      dragHandle={<TaskDragHandle attributes={attributes} listeners={listeners} />}
    />
  );
}
