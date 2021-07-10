<template>
  <q-page class="column items-start justify-start q-mx-lg q-my-lg">
    <q-form class="full-width" @submit="onGenerate">
      <!-- <input ref="input" type="file" @change="onInput" /> -->
      <div class="q-mb-sm row q-gutter-x-md justify-between q-gutter-y-sm">
        <div class="row justify-start items-center q-gutter-y-sm">
          <q-btn
            class="q-mr-md"
            icon-right="add"
            outline
            unelevated
            color="black"
            label="Add Section"
            @click="onAddSection()"
          />
          <q-file
            class="field"
            label-color="green-8"
            color="green-8"
            dense
            outlined
            :model-value="files"
            @update:model-value="onUpdateFiles"
            label="Upload Excel"
            :multiple="true"
            accept=".csv,.xlsx,.xls"
            input-class="ellipsis"
            input-style="overflow: hidden;"
          >
            <template v-slot:prepend>
              <q-icon color="green-8" name="attach_file" />
            </template>
          </q-file>
        </div>
        <div class="row q-gutter-y-sm">
          <q-btn
            @click="onClickSaveTemplate"
            unelevated
            outline
            color="black"
            label="Save"
            class="q-mr-sm"
          />
          <q-btn
            icon-right="file_download"
            class="q-mr-sm"
            outline
            unelevated
            color="black"
            label="Export Setting"
            @click="onExportSetting"
          />
          <q-file
            class="field"
            dense
            outlined
            :model-value="setting"
            @update:model-value="onImportSetting"
            label="Import Setting"
            input-class="ellipsis"
            input-style="overflow: hidden;"
          >
            <template v-slot:prepend>
              <q-icon name="attach_file" />
            </template>
          </q-file>
        </div>
      </div>
      <div
        v-for="(template, i) in templates"
        :key="i"
        class="section-container"
      >
        <div
          class="
            q-mb-sm
            row
            justify-between
            items-center
            row
            q-gutter-x-sm q-gutter-y-sm
          "
        >
          <div class="row q-gutter-x-sm q-gutter-y-sm">
            <div class="row items-center justify-center">
              <q-btn
                round
                outline
                color="black"
                size="sm"
                icon="expand_less"
                unelevated
                @click="onMoveTemplate(i, 'up')"
              />
            </div>
            <div class="row items-center justify-center">
              <q-btn
                round
                outline
                color="black"
                size="sm"
                icon="expand_more"
                unelevated
                @click="onMoveTemplate(i, 'down')"
              />
            </div>
            <q-btn
              icon-right="add"
              outline
              unelevated
              color="black"
              label="Add Field"
              @click="onAddField(i)"
            />
            <q-input
              class="field"
              dense
              outlined
              v-model="template.delimiter"
              label="Delimiter"
            ></q-input>
            <q-input
              class="field"
              dense
              outlined
              v-model="template.rows"
              label="Minimum Row"
            ></q-input>
          </div>
          <div class="row items-center justify-center">
            <q-btn
              round
              flat
              color="red"
              size="sm"
              icon="close"
              unelevated
              @click="onRemoveTemplate(i)"
            />
          </div>
        </div>
        <div
          v-for="(field, j) in template.fields"
          :key="j"
          class="
            field-container
            row
            items-center
            justify-between
            full-width
            q-mb-sm
          "
        >
          <div class="row q-gutter-y-sm">
            <div
              class="
                q-mr-md
                field-btn-container
                row
                items-center
                justify-center
                q-gutter-x-sm
              "
            >
              <div class="row items-center justify-center">
                <q-btn
                  round
                  outline
                  color="black"
                  size="sm"
                  icon="expand_less"
                  unelevated
                  @click="onMoveField(i, j, 'up')"
                />
              </div>
              <div class="row items-center justify-center">
                <q-btn
                  round
                  outline
                  color="black"
                  size="sm"
                  icon="expand_more"
                  unelevated
                  @click="onMoveField(i, j, 'down')"
                />
              </div>
            </div>
            <field
              :field="field"
              @update:field="(v) => onUpdateField(i, j, v)"
              :files="processedFiles"
            ></field>
          </div>
          <div class="row items-center justify-center field-btn-container">
            <q-btn
              flat
              round
              color="red"
              size="sm"
              icon="close"
              unelevated
              @click="onRemoveField(i, j)"
            />
          </div>
        </div>
      </div>
      <div class="full-width row items-center justify-end q-gutter-x-md">
        <q-btn unelevated color="black" label="Generate" type="submit" />
      </div>
      <div class="preview-container">
        <div class="preview-btn row items-center justify-center q-gutter-x-sm">
          <q-btn
            round
            color="black"
            icon="file_download"
            flat
            class="copy-btn"
            size="sm"
            @click="onClickDownload"
          />
          <q-btn
            round
            color="black"
            icon="content_copy"
            flat
            size="sm"
            @click="onClickCopy"
          />
        </div>
        <q-separator></q-separator>
        <pre class="preview hide-scrollbar">{{ result }}</pre>
      </div>
    </q-form>
  </q-page>
</template>

<script lang="ts">
import Field from 'components/Field.vue';
import { copyToClipboard, Dialog, LocalStorage, Notify } from 'quasar';
import {
  clone,
  countRows,
  fieldToValue,
  FieldType,
  getDefaultField,
} from 'src/components/field';
import { defineComponent, reactive, toRefs, onMounted } from 'vue';
import { csvToJson } from '../components/converter';
import moment from 'moment';

export default defineComponent({
  name: 'PageIndex',
  components: {
    Field,
  },
  setup() {
    let state = reactive({
      templates: [
        {
          rows: 0,
          delimiter: '|',
          fields: [getDefaultField(FieldType.text, 1)],
        },
      ],
      delimiter: '|',
      files: [],
      result: '',
      processedFiles: [],
      setting: null,
    });
    onMounted(() => {
      const templates = LocalStorage.getItem('templates');
      if (templates) {
        state.templates = templates as any;
      }
    });
    function onAddSection() {
      state.templates.push({
        rows: 0,
        delimiter: '|',
        fields: [getDefaultField(FieldType.text, 1)],
      });
    }
    function onAddField(i) {
      let position = 1;
      if (state.templates[i].fields.length > 0) {
        position =
          state.templates[i].fields[state.templates[i].fields.length - 1]
            .position;
      }
      const field = getDefaultField(FieldType.text, position + 1);
      state.templates[i].fields.push(field);
    }
    function onRemoveField(i, j) {
      Dialog.create({
        title: 'Remove Field ?',
        cancel: true,
      }).onOk(() => {
        state.templates[i].fields.splice(j, 1);
      });
    }
    function onUpdateField(i, j, v) {
      state.templates[i].fields[j] = v;
    }
    function onGenerate() {
      try {
        let templates = JSON.parse(JSON.stringify(state.templates));
        let result = [];
        templates.forEach((template) => {
          template.fields.sort((a, b) => a.position - b.position);
          let rowsNumber = countRows(template.fields);
          const rows = [
            ...new Array(rowsNumber || Number(template.rows)),
          ].reduce((rows, v, rowNumber) => {
            let row = template.fields
              .reduce((row, field) => {
                let prevPosition = row.length;
                let fields = fieldToValue(field, rowNumber, prevPosition);
                row = [...row, ...fields];
                return row;
              }, [])
              .join(state.delimiter);
            rows.push(row);
            return rows;
          }, []);
          result = [...result, ...rows];
        });
        state.result = result.join('\n');
      } catch (err) {
        console.error(err);
        Notify.create({ message: 'Failed to generate', color: 'red' });
      }
    }
    async function onUpdateFiles(files) {
      state.processedFiles = [];
      state.files = files;
      const promises = files.map(async (file, i) => {
        const processedFile = await csvToJson(file);
        state.processedFiles[i] = {
          label: file.name,
          value: processedFile,
        };
      });
      await Promise.all(promises);
      if (state.processedFiles.length > 0) {
        state.templates = state.templates.map((template) => {
          return {
            ...template,
            fields: template.fields.map((field) => {
              if (field.type === FieldType.excel && !field.file) {
                return {
                  ...field,
                  file: state.processedFiles[0].value,
                };
              } else {
                return field;
              }
            }),
          };
        });
      }
    }
    function templatesToJson(templates) {
      let json = clone(templates);
      json = templates.map((template) => {
        return {
          ...template,
          fields: template.fields.map((field) => {
            if (field.type === FieldType.excel && !!field.file) {
              return {
                ...field,
                file: null,
              };
            } else {
              return field;
            }
          }),
        };
      });
      return json;
    }
    function onClickSaveTemplate() {
      const json = templatesToJson(state.templates);
      LocalStorage.set('templates', json);
      Notify.create({
        message: 'Successfully saved template',
        color: 'green-6',
      });
    }
    async function onClickCopy() {
      try {
        await copyToClipboard(state.result);
        Notify.create({
          message: 'Copy to clipboard',
          color: 'green-6',
        });
      } catch (err) {
        console.error(err);
        Notify.create({
          message: 'Failed to copy',
          color: 'red-6',
        });
      }
    }
    function onMoveField(i, j, direction) {
      const template = state.templates[i];
      if (
        (j === 0 && direction === 'up') ||
        (j === template.fields.length - 1 && direction === 'down')
      ) {
        return;
      }
      const field = clone(template.fields[j]);
      template.fields.splice(j, 1);
      template.fields.splice(direction === 'up' ? j - 1 : j + 1, 0, field);
    }
    function onRemoveTemplate(i) {
      Dialog.create({
        title: 'Remove Section ?',
        cancel: 'Cancel',
      }).onOk(() => {
        state.templates.splice(i, 1);
      });
    }
    function onMoveTemplate(i, direction) {
      if (
        (i === 0 && direction === 'up') ||
        (i === state.templates.length - 1 && direction === 'down')
      ) {
        return;
      }
      const template = clone(state.templates[i]);
      state.templates.splice(i, 1);
      state.templates.splice(direction === 'up' ? i - 1 : i + 1, 0, template);
    }
    async function onImportSetting(file: File) {
      try {
        state.setting = file;
        const text = await file.text();
        console.log(text)
        const json = JSON.parse(text);
        state.templates = json;
      } catch (err) {
        console.error(err);
        Notify.create({ message: 'invalid setting file', color: 'red' });
      }
    }
    function download(data, filename) {
      var dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(data);
      var downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute('href', dataStr);
      downloadAnchorNode.setAttribute('download', filename);
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    }
    function onExportSetting() {
      const json = templatesToJson(state.templates);
      const date = moment().format('DD-MM-YYYY_HH:mm');
      download(JSON.stringify(json), `setting_${date}.json`);
    }
    function onClickDownload() {
      try {
        const date = moment().format('DD-MM-YYYY_HH:mm');
        download(state.result, `download_${date}.txt`);
        Notify.create({
          message: 'Downloaded',
          color: 'green-6',
        });
      } catch (err) {
        console.error(err);
        Notify.create({
          message: 'Failed to download',
          color: 'red-6',
        });
      }
    }
    return {
      ...toRefs(state),
      onUpdateFiles,
      // onInput,
      onAddSection,
      onAddField,
      onUpdateField,
      onGenerate,
      onRemoveField,
      onClickSaveTemplate,
      onClickCopy,
      onMoveField,
      onMoveTemplate,
      onRemoveTemplate,
      onImportSetting,
      onExportSetting,
      onClickDownload,
    };
  },
});
</script>

<style lang="scss" scoped>
.field-container {
  padding: 10px 20px;
  width: 100%;
  border-style: solid;
  border-width: 1px;
  border-radius: 4px;
  border-color: $grey-4;
  .field-btn-container {
    // height: 40px;
  }
}
.template-setting-container {
  padding: 10px 0px;
  padding-bottom: 25px;
  width: 100%;
  margin: 0px;
}
.preview-container {
  min-height: 300px;
  margin: 20px 0px;
  margin-top: 10px;
  width: 100%;
  border-style: solid;
  border-width: 1px;
  border-color: $grey-4;
  border-radius: 4px;
  padding: 0px 20px;
  padding-top: 40px;
  padding-bottom: 0px;
  position: relative;
  .preview {
    margin: 0px;
    padding: 0px;
    overflow: scroll;
    max-height: 400px;
  }
  .preview-btn {
    position: absolute;
    top: 5px;
    right: 15px;
  }
}
.section-container {
  padding: 10px 20px;
  margin-bottom: 10px;
  border-style: solid;
  border-width: 1px;
  border-color: $grey-4;
  border-radius: 4px;
  width: 100%;
}
.field {
  width: 200px;
}
</style>
