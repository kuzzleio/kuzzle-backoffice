<template>
  <b-modal
    scrollable
    id="import-actions"
    title="Import API Actions"
    size="lg"
    @hide="resetForm"
  >
    <template #modal-ok>
      <b-button
        @click="handleImport"
        :disabled="validNames || !Boolean(files.length)"
        variant="primary"
        data-cy="modal-button-import-action"
        >Import
      </b-button>
    </template>
    <b-container>
      <b-row>
        <b-col cols="12" class="text-center mb-3">
          Imported actions will be added to the current environment.
        </b-col>
        <b-col cols="12" class="text-center mb-3">
          <b-form-file
            v-model="file"
            autofocus
            size="lg"
            accept=".json"
            placeholder="Choose a file or drop it here..."
            drop-placeholder="Drop file here..."
            data-cy="import-api-actions-file-input"
          ></b-form-file>
        </b-col>
        <b-col cols="12" v-if="files.length" class="mb-3">
          <b-card no-body header="Files">
            <b-list-group>
              <b-list-group-item
                v-for="file in files"
                :key="`${file.name}-${file.lastModified}`"
                class="d-flex justify-content-between align-items-center"
                :variant="file.isInvalid ? 'danger' : ''"
              >
                {{ file.name }} {{ file.size }} {{ file.size ? 'kb' : 'N/A' }}
                <i @click="removeFile(file)" class="fas fa-trash" />
              </b-list-group-item>
            </b-list-group>
          </b-card>
        </b-col>
        <b-col cols="12" v-if="actions.length">
          <b-card no-body header="API Actions">
            <b-table :fields="tableFields" :items="actions" class="mb-0">
              <template #cell(name)="data">
                <b-form-input
                  :id="`name-input-${data.index}`"
                  size="sm"
                  :data-cy="`imported-action-name-editor-${data.index}`"
                  :state="!savedActionNames.includes(data.item.name)"
                  v-model="data.item.name"
                >
                </b-form-input>
                <b-form-invalid-feedback
                  :id="`name-input-${data.index}-feedback`"
                >
                  You already have a saved action with that name.
                </b-form-invalid-feedback>
              </template>
            </b-table>
          </b-card>
        </b-col>
      </b-row>
    </b-container>
  </b-modal>
</template>

<script>
/* eslint-disable */
export default {
  name: 'import-actions-modal',
  props: {
    savedActionNames: {
      required: true
    }
  },
  data() {
    return {
      file: null,
      files: [],
      actions: [],
      tableFields: [
        { key: 'name', label: 'Name' },
        { key: 'query.controller', label: 'Controller' },
        { key: 'query.action', label: 'Action' }
      ]
    }
  },
  computed: {
    validNames() {
      return this.actions.some(action =>
        this.savedActionNames.includes(action.name)
      )
    }
  },
  watch: {
    file(value) {
      if (value) {
        this.fileAdded(value)
      }
    },
    files(value) {
      this.filesChange(value)
    }
  },
  methods: {
    resetForm() {
      this.file = null
      this.files = []
      this.actions = []
    },
    handleImport() {
      this.$emit('import-actions', this.actions)
    },
    async isValidFile(file) {
      if (this.files.find(f => f.name === file.name && f.size === file.size)) {
        this.$bvToast.toast(`File ${this.file.name} already added!`, {
          title: 'Warning',
          variant: 'warning',
          toaster: 'b-toaster-bottom-right',
          appendToast: true,
          dismissible: true,
          noAutoHide: true
        })
        return false
      }
      try {
        await this.readFile(file)
        return true
      } catch (error) {
        this.$bvToast.toast(`Unable to parse file: ${this.file.name}`, {
          title: 'Error',
          variant: 'danger',
          toaster: 'b-toaster-bottom-right',
          appendToast: true,
          dismissible: true,
          noAutoHide: true
        })
        return false
      }
    },
    readFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsText(file, 'UTF-8')
        reader.onload = evt => {
          try {
            resolve({file: file, content: JSON.parse(evt.target.result)})
          } catch (error) {
            reject(error)
          }
        }
        reader.onerror = evt => {
          reject()
        }
      })
    },
    async fileAdded() {
      const isValidFile = await this.isValidFile(this.file)
      if (isValidFile) {
        this.files.push(this.file)
      }
      this.file = null
    },
    async filesChange() {
      const fileContent = {}
      const promises = []
      for (const file of this.files) {
        promises.push(await this.readFile(file))
      }
      await Promise.all(promises)
      .then(values => {
        for (const value of values) {
          fileContent[value.file.name] = value.content
        }
      })
      this.actions = []
      for (const [env, content] of Object.entries(fileContent)) {
        this.actions = this.actions.concat(content)
      }
    },
    removeFile(file) {
      const files = this.files.filter(f => {
        return f != file
      })
      this.$set(this, 'files', files)
    }
  }
}
</script>

<style></style>
