<template>
  <span>
    <b-dropdown
      data-cy="CollectionDropdownView"
      toggle-class="collectionDropdown"
      variant="light"
      :id="`collection-${collection}`"
    >
      <template v-slot:button-content>
        <b class="mr-2">View</b>
      </template>

      <b-dropdown-group id="collection-dd-group-views" header="View type">
        <b-dropdown-item
          data-cy="CollectionDropdown-list"
          :active="activeView === 'list'"
          @click="$emit('list')"
        >
          List view
        </b-dropdown-item>
        <b-dropdown-item
          data-cy="CollectionDropdown-column"
          :active="activeView === 'column'"
          @click="$emit('column')"
        >
          Column view
        </b-dropdown-item>
        <b-dropdown-item
          data-cy="CollectionDropdown-TimeSeries"
          :active="activeView === 'time-series'"
          :disabled="!mappingHasIntegerField"
          @click="$emit('time-series')"
        >
          Chart view
        </b-dropdown-item>
        <b-dropdown-item
          data-cy="CollectionDropdown-map"
          :active="activeView === 'map'"
          :disabled="!mappingHasGeoField"
          @click="$emit('map')"
        >
          Map view
        </b-dropdown-item>
        <b-dropdown-item
          :active="activeView === 'realtime'"
          :disabled="!canSubscribe(index, collection)"
          :title="
            !canSubscribe(index, collection)
              ? 'Your rights do not allow you to subscribe to this collection'
              : ''
          "
          :to="
            canSubscribe(index, collection)
              ? { name: 'WatchCollection', params: { collection, index } }
              : ''
          "
        >
          Realtime view
        </b-dropdown-item>
      </b-dropdown-group>
    </b-dropdown>
  </span>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  name: 'CollectionDropdown',
  components: {},
  props: {
    mappingAttributes: Object,
    activeView: String,
    collection: String,
    index: String
  },
  computed: {
    ...mapGetters('auth', ['canSubscribe']),
    mappingHasIntegerField() {
      return (
        Object.keys(this.mappingAttributes).filter(
          a => this.mappingAttributes[a].type === 'integer'
        ).length > 0
      )
    },
    mappingHasGeoField() {
      return (
        Object.keys(this.mappingAttributes).filter(a =>
          ['geo_point', 'geo_shape'].includes(this.mappingAttributes[a].type)
        ).length > 0
      )
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .collectionDropdown {
  background-color: $light-grey-color;
  border: none;
}

::v-deep .show .collectionDropdown i {
  transform: rotate(90deg);
}
</style>
