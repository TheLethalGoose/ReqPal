<script setup lang="ts">
import Help from "@/components/lesson/builder/helper/Help.vue"
import {useLessonStore} from "@/stores/lesson.ts";
import { ref, watch } from "vue";

interface Props {
  componentId: string,
}

const props = defineProps<Props>();

const textInput = ref<string[]>([]);

const lessonStore = useLessonStore();

const fields = ref<any>({
  options: lessonStore.getLessonModuleFieldValues(props.componentId, 'options'),
});

function updateStoreData() {
  lessonStore.setLessonModuleData(props.componentId, 'options', fields.value.options);
}

init();

function init() {
  let newFields: any = [];
  fields.value.options.forEach((option: any, index: number) => {
    if (!option.hasOwnProperty('label') || !option.hasOwnProperty('id') || !option.hasOwnProperty('text')) {
      newFields.push({
        id: index,
        label: option,
        text: ""
      });
    } else {
      newFields.push({
        id: index,
        label: option.label,
        text: option.text
      });
    }
  })
  fields.value.options = newFields;

  fields.value.options.forEach((option: any) => {
    textInput.value[option.id] = option.text;
  })
}

watch(textInput, (newTextInput) => {
  fields.value.options = fields.value.options.map((option: any) => {
    return {
      id: option.id,
      label: option.label,
      text: newTextInput[option.id] ? newTextInput[option.id] : ""
    }
  });
  updateStoreData()
}, {deep: true});
</script>

<template>
  <v-expansion-panels>
    <v-expansion-panel elevation="0">
      <v-expansion-panel-title>
        Notizen
      </v-expansion-panel-title>
      <v-expansion-panel-text>
          <v-row class="mt-1">
            <v-col v-for="(option, index) in fields.options" :key="index" :cols="12/fields.options.length">
              <v-textarea v-model="textInput[option.id]"
                          :label="option.label"
                          variant="outlined"
                          auto-grow></v-textarea>
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col class="d-flex justify-end">
              <Help dialog-type="notesExplanation"></Help>
            </v-col>
          </v-row>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>
