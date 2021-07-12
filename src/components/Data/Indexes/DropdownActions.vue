<template>
  <span>
    <b-dropdown
      v-if="
        $store.direct.getters.kuzzle.currentEnvironment.backendMajorVersion !==
          1
      "
      data-cy="IndexDropdownAction"
      no-caret
      toggle-class="indexDropdown"
      variant="light"
      :id="`index-${indexName}`"
    >
      <template v-slot:button-content>
        <i class="fas fa-ellipsis-v" />
      </template>

      <b-dropdown-group header="Actions">
        <b-dropdown-item
          data-cy="IndexDropdown-delete"
          :disabled="!canDeleteIndex(indexName)"
          :title="
            !canDeleteIndex(indexName)
              ? 'Your rights do not allow you to delete this index'
              : ''
          "
          v-if="
            $store.direct.getters.kuzzle.currentEnvironment
              .backendMajorVersion !== 1
          "
          @click="onDeleteIndexClicked"
        >
          Delete index
        </b-dropdown-item>
      </b-dropdown-group>
    </b-dropdown>
  </span>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'IndexDropdownAction',
  props: {
    indexName: {
      type: String,
      required: true
    }
  },
  computed: {
    ...mapGetters('auth', ['canDeleteIndex'])
  },
  methods: {
    onDeleteIndexClicked() {
      this.$emit('delete-index-clicked')
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .indexDropdown {
  background-color: $light-grey-color;
  border: none;
}

::v-deep .show .indexDropdown i {
  transform: rotate(90deg);
}
</style>
