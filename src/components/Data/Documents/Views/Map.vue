<template>
  <div class="ViewMap">
    <b-row class="pb-2">
      <b-col cols="9" class="text-left">
        <b-row no-gutters>
          <div v-if="mappingGeopoints.length">
            GeoPoint field
            <b-form-select
              class="mx-2"
              style="width: unset"
              :options="mappingGeopoints"
              :value="selectedGeopoint || ''"
              @change="$emit('on-select-geopoint', $event)"
            >
            </b-form-select>
          </div>
          <div v-if="mappingGeoshapes.length">
            GeoShape field
            <b-form-select
              class="mx-2"
              style="width: unset"
              :options="mappingGeoshapes"
              :value="selectedGeoshape || ''"
              @change="$emit('on-select-geoshape', $event)"
            >
            </b-form-select>
          </div>
        </b-row>
      </b-col>
      <b-col cols="3" class="text-right">
        <PerPageSelector
          :current-page-size="currentPageSize"
          :total-documents="totalDocuments"
          @change-page-size="$emit('change-page-size', $event)"
        />
      </b-col>
    </b-row>
    <b-row class="align-self-stretch">
      <b-col cols="8" class="viewMap-document-map">
        <l-map ref="map" data-cy="mapView-map">
          <l-tile-layer :url="url" :attribution="attribution" />
          <l-marker
            v-for="document in geoDocuments"
            :key="document.source._id"
            :lat-lng="document.coordinates"
            :icon="getIcon(document.source)"
            @click="
              onItemClicked(document.source, document.coordinates, 'point')
            "
          />
          <l-circle
            v-for="shape of circleShapes"
            :ref="`circle-${shape.source_id}`"
            :key="shape.source_id"
            :lat-lng="shape.content.coordinates"
            :radius="getRadiusInMeter(shape.content.radius)"
            :color="getShapeColor(shape.source._id)"
            :className="`data-cy-shape data-cy-shape-${shape.source._id}`"
            :class="getShapeCyClasse(shape)"
            @click="
              onItemClicked(
                shape.source,
                shape.content.coordinates,
                'circle',
                shape.content.radius
              )
            "
          />
          <l-polygon
            v-for="shape of polygonShapes"
            :ref="`polygon-${shape.source_id}`"
            :key="shape.source_id"
            :lat-lngs="shape.content.coordinates"
            :color="getShapeColor(shape.source._id)"
            :class="getShapeCyClasse(shape)"
            :className="`data-cy-shape data-cy-shape-${shape.source._id}`"
            @click="
              onItemClicked(shape.source, shape.content.coordinates, 'array')
            "
          />
          <div v-for="shape of multiPolygonShapes" :key="shape.source_id">
            <l-polygon
              v-for="(polygon, index) in shape.content.coordinates"
              :ref="`polygon-${shape.source_id}-${index}`"
              :key="`${shape.source_id}-${index}`"
              :lat-lngs="polygon"
              :color="getShapeColor(shape.source._id)"
              :class="getShapeCyClasse(shape)"
              :className="`data-cy-shape data-cy-shape-${shape.source._id}`"
              @click="onItemClicked(shape.source, polygon, 'array')"
            />
          </div>
        </l-map>
      </b-col>
      <b-col cols="4">
        <b-card
          no-body
          v-if="currentDocument"
          data-cy="mapView-current-document-card"
        >
          <b-card-header>
            <b-row align-v="center">
              <b-col cols="8" align-v="center">
                <span data-cy="mapView-current-document-id">{{
                  currentDocument._id
                }}</span>
              </b-col>
              <b-col cols="4" class="pr-1 text-right">
                <b-button
                  class="DocumentMapItem-update"
                  href=""
                  variant="link"
                  :data-cy="`DocumentMapItem-update--${currentDocument._id}`"
                  :disabled="!canEdit"
                  :title="
                    canEdit
                      ? 'Edit Document'
                      : 'You are not allowed to edit this Document'
                  "
                  @click.prevent="editCurrentDocument"
                >
                  <i class="fa fa-pencil-alt" :class="{ disabled: !canEdit }" />
                </b-button>

                <b-button
                  class="DocumentListItem-delete"
                  href=""
                  variant="link"
                  :data-cy="`DocumentListItem-delete--${currentDocument._id}`"
                  :disabled="!canDelete"
                  :title="
                    canDelete
                      ? 'Delete Document'
                      : 'You are not allowed to delete this Document'
                  "
                  @click.prevent="deleteCurrentDocument"
                >
                  <i class="fa fa-trash" :class="{ disabled: !canEdit }" />
                </b-button>
                <b-button
                  class="ml-2"
                  title="Close"
                  @click.prevent="closeDocument"
                >
                  <i class="fa fa-times" />
                </b-button>
              </b-col>
            </b-row>
          </b-card-header>
          <b-card-body class="pt-1 pb-1">
            <b-row class="viewMap-document-json">
              <pre
                class="json-formatter"
                v-json-formatter="{ content: formattedDocument, open: true }"
              />
            </b-row>
          </b-card-body>
        </b-card>
        <b-card
          v-else
          class="light-shadow viewMap-document-map"
          data-cy="mapView-no-document-card"
          bg-variant="light"
        >
          <b-card-text class="p-0">
            <b-row align-h="center" class="valign-center empty-set h-100">
              <b-col cols="2" class="text-center">
                <i
                  class="fa fa-3x fa-search text-secondary mt-3"
                  aria-hidden="true"
                />
              </b-col>
              <b-col md="10">
                <h3 class="text-secondary font-weight-bold">
                  No document selected.
                </h3>
                <p>
                  <em>
                    You can view a document content by clicking on a marker
                  </em>
                </p>
              </b-col>
            </b-row>
          </b-card-text>
        </b-card>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import { LMap, LTileLayer, LMarker, LCircle, LPolygon } from 'vue2-leaflet'
import L from 'leaflet'
import '@/assets/leaflet.css'
import JsonFormatter from '@/directives/json-formatter.directive'
import { mapGetters } from 'vuex'
import _ from 'lodash'
import PerPageSelector from '@/components/Common/PerPageSelector'

export default {
  name: 'ViewMap',
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LCircle,
    LPolygon,
    PerPageSelector
  },
  directives: {
    JsonFormatter
  },
  props: {
    currentPageSize: {
      type: Number,
      default: 25
    },
    selectedGeopoint: {
      type: String,
      required: true
    },
    selectedGeoshape: {
      type: String,
      required: true
    },
    mappingGeopoints: {
      type: Array,
      required: true
    },
    mappingGeoshapes: {
      type: Array,
      required: true
    },
    geoDocuments: {
      type: Array,
      required: true
    },
    shapesDocuments: {
      type: Array,
      require: true
    },
    index: String,
    collection: String
  },
  data() {
    return {
      itemsPerPage: [10, 25, 50, 100, 500],
      latField: null,
      lngField: null,
      map: null,
      url: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      currentDocument: null,
      LeafDefaultIcon: L.Icon.extend({
        options: {
          iconUrl: '/images/marker-icon-2x-blue.png',
          shadowUrl: '/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        }
      }),
      defaultIcon: new L.Icon({
        iconUrl: '/images/marker-icon-2x-blue.png',
        shadowUrl: '/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
        className: 'mapView-marker-default'
      }),
      LeafSelectedIcon: L.Icon.extend({
        options: {
          iconUrl: '/images/marker-icon-2x-green.png',
          shadowUrl: '/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        }
      }),
      selectedIcon: new L.Icon({
        iconUrl: '/images/marker-icon-2x-green.png',
        shadowUrl: '/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
        className: 'mapView-marker-selected'
      })
    }
  },
  computed: {
    totalDocuments() {
      return this.geoDocuments.length
    },
    ...mapGetters('auth', ['canEditDocument', 'canDeleteDocument']),
    coordinates() {
      const coordinates = [
        ...this.geoDocuments.map(d => d.coordinates),
        ...this.getShapesCoordinates()
      ]
      return coordinates
    },
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
    formattedShapes() {
      if (!this.currentDocument) {
        return {}
      }
      const document = _.omit(this.currentDocument, ['_id', '_kuzzle_info'])
      document._kuzzle_info = this.currentDocument._kuzzle_info
      return document
    },
    formattedDocument() {
      if (!this.currentDocument) {
        return {}
      }
      const document = _.omit(this.currentDocument, ['_id', '_kuzzle_info'])
      document._kuzzle_info = this.currentDocument._kuzzle_info
      return document
    },
    circleShapes() {
      return this.shapesDocuments.filter(
        shape => shape.content.type === 'circle'
      )
    },
    polygonShapes() {
      return this.shapesDocuments.filter(
        shape => shape.content.type === 'polygon'
      )
    },
    multiPolygonShapes() {
      return this.shapesDocuments.filter(
        shape => shape.content.type === 'multipolygon'
      )
    }
  },
  watch: {
    selectedGeopoint: {
      handler(value) {
        if (value) {
          this.map.fitBounds(this.coordinates, { maxZoom: 12 })
        }
      }
    },
    selectedGeoshape: {
      handler(value) {
        if (value) {
          this.map.fitBounds(this.coordinates, { maxZoom: 12 })
        }
      }
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.map = this.$refs.map.mapObject
      if (L.latLngBounds(this.coordinates).isValid()) {
        this.map.fitBounds(this.coordinates, { maxZoom: 12 })
      }
    })
  },
  methods: {
    getShapeCyClasse(shape) {
      return this.currentDocument &&
        this.currentDocument._id === shape.source._id
        ? 'data-cy-shape-selected'
        : ''
    },
    getShapeColor(id) {
      return this.currentDocument && this.currentDocument._id === id
        ? '#26AD23'
        : '#2981CA'
    },
    getRadiusInMeter(radius) {
      if (typeof radius === 'number') {
        return radius
      }
      if (typeof radius !== 'string') {
        return null
      }
      const value = parseInt(radius)
      const unit = radius.replace(value.toString(), '')
      let multiplicator = 1
      switch (unit) {
        case 'km':
          multiplicator = 1000
          break
        default:
          multiplicator = 1
      }
      return value * multiplicator
    },
    flattenShapes(arr) {
      return arr.reduce((a, b) => {
        return a.concat(
          Array.isArray(b) && typeof b[0] !== 'number'
            ? this.flattenShapes(b)
            : [b]
        )
      }, [])
    },
    getShapesCoordinates() {
      const circlePoints = this.circleShapes.map(
        circle => circle.content.coordinates
      )

      const polygonArrays = this.polygonShapes.map(
        polygon => polygon.content.coordinates
      )

      const multipolygonArrays = [
        ...this.multiPolygonShapes.map(
          multipolygon => multipolygon.content.coordinates
        )
      ]

      const points = [
        ...circlePoints,
        ...this.flattenShapes(polygonArrays),
        ...this.flattenShapes(multipolygonArrays)
      ]
      return points
    },
    onItemClicked(document, latlng, type, radius) {
      if (this.currentDocument === document) {
        this.currentDocument = null
        return
      }
      this.currentDocument = document
      if (type === 'array') {
        this.map.fitBounds(latlng, { maxZoom: 14 })
      } else if (type === 'point') {
        this.map.setView(latlng, 14)
      } else if (type === 'circle') {
        const radiusInMeter = this.getRadiusInMeter(radius)
        const bounds = L.latLng(latlng).toBounds(radiusInMeter * 2)
        this.map.fitBounds(bounds, 14)
      }
    },
    closeDocument() {
      this.currentDocument = null
    },
    getIcon(document) {
      if (this.currentDocument === document) {
        return new this.LeafSelectedIcon({
          className: `mapView-marker-selected documentId-${document._id}`
        })
      }

      return new this.LeafDefaultIcon({
        className: `mapView-marker-default documentId-${document._id}`
      })
    },
    deleteCurrentDocument() {
      if (this.canDelete) {
        this.$emit('delete', this.currentDocument._id)
      }
    },
    editCurrentDocument() {
      if (this.canEdit) {
        this.$emit('edit', this.currentDocument._id)
      }
    }
  }
}
</script>

<style scoped lang="scss">
.ViewMap {
  .viewMap-document-map {
    height: 600px;
  }
  .viewMap-document-json {
    height: 525px;
  }
  .json-formatter {
    max-height: 525px;
    overflow-y: auto;
  }
}
</style>
