<script lang="ts" setup>
import {useDrop} from 'vue3-dnd'
import {ref} from 'vue'
import {DragItem} from "@/types/dragItem.ts";
import {SortableDragItem} from "@/types/drag.ts";
import Card from "@/components/drafts/lesson/sortable/Card.vue";

interface Props {
  answers: SortableDragItem[];
  allowDragAndDrop: boolean;
}

const props: Props = withDefaults(defineProps<Props>(), {
  answers: () => [
    {id: '12', text: 'A'},
    {id: '41', text: 'B'},
    {id: '23', text: 'C'}
  ]
});

const cards = ref(props.answers)

const findCard = (id: string) => {
  const card = cards.value.filter(c => c.id === id)[0];
  return {
    card,
    index: cards.value.indexOf(card),
  };
};

const moveCard = (id: string, atIndex: number) => {
  const {card, index} = findCard(id);
  cards.value.splice(index, 1);
  cards.value.splice(atIndex, 0, card);
};

const [, drop] = useDrop(() => ({accept: DragItem.SORTABLE}));
</script>

<template>
  <div :ref="drop" class="container pa-5">
    <Card
        v-for="card in cards"
        :id="`${card.id}`"
        :key="card.id"
        :text="card.text"
        :move-card="moveCard"
        :find-card="findCard"
        :allow-drag-and-drop="allowDragAndDrop"
    />
  </div>
</template>

<style scoped>

.container {
  border: 1px solid rgb(var(--v-theme-primary));
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

</style>