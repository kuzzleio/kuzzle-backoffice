<template>
  <b-container fluid data-cy="DocumentListItem">
    <b-row align-h="between" no-gutters>
      <b-col cols="10" class="py-1">
        <i
          @click="toggleCollapse"
          :class="
            `fa fa-caret-${
              expanded ? 'down' : 'right'
            } mr-2  d-inline-block align-middle`
          "
          aria-hidden="true"
        />
        <b-form-checkbox
          class="d-inline-block align-middle"
          type="checkbox"
          value="true"
          unchecked-value="false"
          v-model="checked"
          :id="checkboxId"
          @change="notifyCheckboxClick"
        />
        <a
          class="d-inline-block align-middle code pointer"
          @click="toggleCollapse"
          >{{ document._id }}</a
        >
      </b-col>
      <b-col cols="2">
        <div class="float-right">
          <b-button
            class="DocumentListItem-update"
            href=""
            variant="link"
            :data-cy="`DocumentListItem-update--${document._id}`"
            :disabled="!canEdit"
            :title="
              canEdit
                ? 'Edit Document'
                : 'You are not allowed to edit this Document'
            "
            @click.prevent="editDocument"
          >
            <i class="fa fa-pencil-alt" :class="{ disabled: !canEdit }" />
          </b-button>
          <b-button
            class="DocumentListItem-delete"
            href=""
            variant="link"
            :data-cy="`DocumentListItem-delete--${document._id}`"
            :disabled="!canDelete"
            :title="
              canDelete
                ? 'Delete Document'
                : 'You are not allowed to delete this Document'
            "
            @click.prevent="deleteDocument"
          >
            <i class="fa fa-trash" :class="{ disabled: !canEdit }" />
          </b-button>
        </div>
      </b-col>
    </b-row>
    <b-row>
      <b-collapse
        :id="`collapse-${document._id}`"
        v-model="expanded"
        class="ml-3 DocumentListItem-content w-100"
      >
        <pre v-json-formatter="{ content: formattedDocument, open: true }" />
      </b-collapse>
    </b-row>
  </b-container>
</template>

<script>
import _ from 'lodash'
import JsonFormatter from '../../../directives/json-formatter.directive'
import { mapGetters } from 'vuex'

export default {
  name: 'DocumentListItem',
  directives: {
    JsonFormatter
  },
  props: {
    index: String,
    collection: String,
    document: Object,
    isChecked: Boolean
  },
  data() {
    return {
      expanded: false,
      checked: false
    }
  },
  watch: {
    isChecked: {
      handler(value) {
        this.checked = value
      }
    }
  },
  computed: {
    ...mapGetters('auth', ['canEditDocument', 'canDeleteDocument']),
    canEdit() {
      if (!this.index || !this.collection) {
        return false
      }
      return this.canEditDocument(this.index, this.collection)
    },
    canDelete() {
      if (!this.index || !this.collection) {
        return false
      }
      return this.canDeleteDocument(this.index, this.collection)
    },
    checkboxId() {
      return `checkbox-${this.document._id}`
    },
    /**
     * Deletes the "id" who should not be displayed in the document body.
     * Also put the "_kuzzle_info" field in last position
     */
    formattedDocument() {
      const document = _.omit(this.document, ['_id', '_kuzzle_info'])
      document._kuzzle_info = this.document._kuzzle_info
      return document
    }
  },
  methods: {
    toggleCollapse() {
      this.expanded = !this.expanded
    },
    notifyCheckboxClick() {
      this.$emit('checkbox-click', this.document._id)
    },
    deleteDocument() {
      if (this.canDelete) {
        this.$emit('delete', this.document._id)
      }
    },
    editDocument() {
      if (this.canEdit) {
        this.$router.push({
          name: 'UpdateDocument',
          params: { id: this.document._id }
        })
      }
    }
  }
}
</script>

<style type="scss" rel="stylesheet/scss" scoped>
pre {
  font-size: 16px;
}
</style>
