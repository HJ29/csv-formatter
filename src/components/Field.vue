<template>
  <div class="row q-gutter-x-md q-gutter-y-sm">
    <q-input
      class="field"
      type="number"
      outlined
      dense
      hide-bottom-space
      label="Position"
      :model-value="field.position"
      @update:model-value="
        (position) => onUpdateField({ ...field, position: Number(position) })
      "
    ></q-input>
    <q-select
      class="field"
      outlined
      dense
      hide-bottom-space
      :model-value="field.type"
      @update:model-value="(type) => onUpdateField({ ...field, type })"
      :options="types"
      map-options
      emit-value
      label="Data Type"
    />
    <div v-if="field.type === 'TEXT'">
      <q-input
        class="field"
        outlined
        dense
        hide-bottom-space
        label="Text"
        :model-value="field.value"
        @update:model-value="(value) => onUpdateField({ ...field, value })"
      ></q-input>
    </div>
    <div v-else-if="field.type === 'INDEX'" class="row">
      <q-input
        class="field q-mr-md q-mb-sm"
        outlined
        dense
        hide-bottom-space
        label="Leading Zero"
        :model-value="field.value"
        @update:model-value="
          (value) => onUpdateField({ ...field, value: Number(value) })
        "
      ></q-input>
      <q-input
        class="field"
        outlined
        dense
        hide-bottom-space
        label="Skip"
        :model-value="field.skip"
        @update:model-value="
          (skip) => onUpdateField({ ...field, skip: Number(skip) })
        "
      ></q-input>
    </div>
    <div v-else-if="field.type === 'EXCEL'" class="row">
      <q-select
        class="field q-mr-md q-mb-sm"
        outlined
        dense
        :model-value="field.file"
        @update:model-value="(file) => onUpdateField({ ...field, file })"
        :options="files"
        map-options
        emit-value
        hide-bottom-space
        label="Excel"
        input-style="overflow: hidden;"
        :rules="[(val) => !!val || 'File is required']"
      >
        <template v-slot:selected-item="scope">
          <span class="ellipsis">{{ scope.opt.label }}</span>
        </template>
      </q-select>
      <q-input
        class="field"
        outlined
        dense
        label="Range"
        hide-bottom-space
        placeholder="A1"
        :model-value="field.range"
        @update:model-value="(range) => onUpdateField({ ...field, range })"
      ></q-input>
    </div>
    <div v-else>Invalid Field</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, toRefs, computed } from 'vue';
import { capitalCase } from 'change-case';
import { FieldType, getDefaultField } from './field';

export default defineComponent({
  name: 'Field',
  props: {
    field: {
      default: () => getDefaultField(FieldType.text),
      type: Object,
    },
    files: {
      default: () => [],
      type: Array,
    },
  },
  emits: ['update:field'],
  setup(props, { emit }) {
    let state = reactive({
      types: Object.values(FieldType).map((type) => ({
        value: type,
        label: capitalCase(type),
      })),
    });
    function onUpdateField(v) {
      let field = v;
      if (props.field.type !== v.type) {
        field = getDefaultField(v.type, v.position);
      }
      emit('update:field', field);
    }
    // async function onSelectFile(event) {
    //   const file = event.target.files[0];
    //   const json = await csvToJson(file);
    //   console.log(json);
    //   // let input = json.slice(state.start - 1).filter((v) => v.length > 0);
    //   // console.log(input);
    // }
    return { ...toRefs(state), onUpdateField };
  },
});
</script>

.
<style lang="scss" scoped>
.field {
  width: 200px;
}
</style>
