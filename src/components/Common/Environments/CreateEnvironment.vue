<template>
  <div class="CreateEnvironment environment">
    <b-form>
      <b-form-group
        data-cy="CreateEnvironment-name--group"
        description="A friendly name for the connection"
        id="env-name"
        label="Connection name"
        label-cols-sm="4"
        label-cols-lg="3"
        label-for="input-env-name"
      >
        <b-form-input
          id="input-env-name"
          v-model="$v.environment.name.$model"
          data-cy="CreateEnvironment-name"
          :state="validateState('name')"
        ></b-form-input>
        <b-form-invalid-feedback id="input-env-name-feedback">{{
          nameFeedback
        }}</b-form-invalid-feedback>
      </b-form-group>

      <b-form-group
        data-cy="CreateEnvironment-host--group"
        description="The host where your Kuzzle is running"
        id="env-host"
        label="Hostname"
        label-cols-sm="4"
        label-cols-lg="3"
        label-for="input-env-host"
        :invalid-feedback="hostFeedback"
      >
        <b-form-input
          data-cy="CreateEnvironment-host"
          id="input-env-host"
          v-model="$v.environment.host.$model"
          :state="validateState('host')"
        ></b-form-input>
      </b-form-group>

      <b-form-group
        data-cy="CreateEnvironment-port--group"
        id="env-port"
        label="Port"
        description="The port where your Kuzzle is listening for connections"
        label-cols-sm="4"
        label-cols-lg="3"
        label-for="input-env-port"
        :invalid-feedback="portFeedback"
      >
        <b-form-input
          data-cy="CreateEnvironment-port"
          id="input-env-port"
          v-model="$v.environment.port.$model"
          type="number"
          :state="validateState('port')"
        ></b-form-input>
      </b-form-group>
      <b-form-group
        label="Use SSL"
        label-for="env-ssl"
        label-cols-sm="4"
        label-cols-lg="3"
        :description="sslFeedback"
      >
        <b-form-checkbox
          id="env-ssl"
          v-model="environment.ssl"
          name="env-use-ssl"
          :value="true"
          :unchecked-value="false"
        ></b-form-checkbox>
        <b-form-invalid-feedback id="env-ssl-feedback">
          <i class="fa fa-exclamation-triangle" aria-hidden="true"></i>
        </b-form-invalid-feedback>
      </b-form-group>
      <b-form-group
        data-cy="CreateEnvironment-backendVersion--group"
        label="Kuzzle version"
        label-cols-sm="4"
        label-cols-lg="3"
        :invalid-feedback="versionFeedback"
      >
        <b-form-select
          data-cy="CreateEnvironment-backendVersion"
          v-model="$v.environment.backendMajorVersion.$model"
          :state="validateState('backendMajorVersion')"
          :options="majorVersions"
        ></b-form-select>
      </b-form-group>

      <b-row>
        <b-col sm="4" lg="3">
          <div>Pick a color</div>
          <small class="text-secondary"
            >It will be applied to the header navbar so you can distinguish this
            connection from other ones.</small
          >
        </b-col>
        <b-col>
          <b-row>
            <b-col sm="6" md="3" v-for="(color, index) in colors" :key="color">
              <div
                :class="`CreateEnvironment-box EnvColor--${color}`"
                :data-cy="`EnvColor--${color}`"
                @click="selectColor(index)"
              >
                <span v-if="environment.color === color">Selected</span>
              </div>
            </b-col>
            <span
              class="CreateEnvironment-box-feedback text-danger ml-2"
              v-if="colorState === false"
            >
              <small>You must select a color for this connection</small></span
            >
          </b-row>
        </b-col>
      </b-row>
    </b-form>
  </div>
</template>

<script>
import { validationMixin } from 'vuelidate'
import { numeric, required } from 'vuelidate/lib/validators'
import { isValidHostname, notIncludeScheme } from '../../../validators'

import { envColors, DEFAULT_COLOR } from '../../../vuex/modules/kuzzle/store'
const useHttps = window.location.protocol === 'https:'

/**
 * Vuelidate validator.
 * The validator framework injects the execution context (`this`
 * is the current component).
 */
function nameIsUnique(value) {
  if (this.environmentId) {
    return true
  }

  return Object.keys(this.environments).indexOf(value) === -1
}
// function isValidColor(color) {
//   return envColors.includes(color)
// }

export default {
  mixins: [validationMixin],
  name: 'CreateEnvironment',
  components: {},
  props: ['environmentId'],
  data() {
    return {
      majorVersions: [
        { value: null, text: 'Select version' },
        { value: 1, text: 'v1.x' },
        {
          value: 2,
          text: 'v2.x'
        }
      ],
      environment: {
        name: '',
        host: '',
        port: 7512,
        color: null,
        ssl: useHttps,
        backendMajorVersion: null,
        hideAdminBanner: false
      },
      submitting: false
    }
  },
  validations: {
    environment: {
      name: {
        required,
        nameIsUnique
      },
      host: {
        required,
        notIncludeScheme,
        isValidHostname
      },
      port: {
        required,
        numeric
      },
      color: {
        required,
        isValidColor: color => envColors.includes(color)
      },
      backendMajorVersion: {
        required
      }
    }
  },
  computed: {
    colors() {
      return envColors
    },
    environments() {
      return this.$store.direct.state.kuzzle.environments
    },
    useHttps() {
      return useHttps
    },
    nameFeedback() {
      if (!this.$v.environment.name.required) {
        return 'You must enter a non-empty environment name'
      }
      if (!this.$v.environment.name.nameIsUnique) {
        return 'An environment with the same name already exists'
      }
      return null
    },
    hostFeedback() {
      if (!this.$v.environment.host.required) {
        return 'You must enter a non-empty host name'
      }
      if (!this.$v.environment.host.notIncludeScheme) {
        return 'Do not include the protocol in your host name'
      }
      if (!this.$v.environment.host.isValidHostname) {
        return 'Must be a valid host name'
      }
      return null
    },
    portFeedback() {
      if (!this.$v.environment.port.required) {
        return 'You must enter a non-empty port'
      }
      return null
    },
    sslFeedback() {
      if (this.useHttps && !this.environment.ssl) {
        return `You are
          using an Admin Console served via HTTPs. Your browser might refuse to
          open an unsecure connection to Kuzzle`
      }

      if (this.environment.ssl) {
        return `Please ensure your Kuzzle instance supports secure Websocket connections`
      }

      return ''
    },
    versionFeedback() {
      if (!this.$v.environment.backendMajorVersion.required) {
        return 'You must select a backend version'
      }
      return null
    },
    colorState() {
      const { $dirty, $error } = this.$v.environment.color
      const state = $dirty ? !$error : null
      return state
    }
  },
  mounted() {
    const currentEnv = this.environments[this.environmentId]
    if (this.environmentId && currentEnv) {
      this.environment.name = currentEnv.name
      this.environment.host = currentEnv.host
      this.environment.port = currentEnv.port
      this.environment.color = currentEnv.color
      this.environment.ssl = currentEnv.ssl
      this.environment.backendMajorVersion = currentEnv.backendMajorVersion
      this.environment.hideAdminBanner = currentEnv.hideAdminBanner
      this.$nextTick(() => this.showValidationErrors())
    } else {
      this.environment.name = null
      this.environment.host = null
      this.environment.port = 7512
      this.environment.color = DEFAULT_COLOR
      this.environment.ssl = useHttps
      this.environment.backendMajorVersion = null
      this.environment.hideAdminBanner = false
    }
  },
  methods: {
    validateState(fieldName) {
      const { $dirty, $error } = this.$v.environment[fieldName]
      const state = $dirty ? !$error : null
      return state
    },
    showValidationErrors() {
      this.$v.environment.$touch()
      Object.keys(this.$v.environment).forEach(field => {
        if (/^\$/.test(field)) {
          return
        }
        if (this.$v.environment[field].$anyError === false) {
          this.$v.environment[field].$reset()
        }
      })
    },
    checkSSL() {
      if (this.environment.port === 443) {
        this.environment.ssl = true
      }
    },
    submit() {
      this.$v.environment.$touch()
      if (this.$v.environment.$anyError) {
        return
      }
      this.submitting = true
      try {
        if (this.environmentId) {
          return this.$store.direct.dispatch.kuzzle.updateEnvironment({
            id: this.environmentId,
            environment: {
              name: this.environment.name,
              color: this.environment.color,
              host: this.environment.host,
              port: parseInt(this.environment.port),
              ssl: this.environment.ssl,
              backendMajorVersion: this.environment.backendMajorVersion,
              hideAdminBanner: this.environment.hideAdminBanner
            }
          })
        } else {
          return this.$store.direct.dispatch.kuzzle.createEnvironment({
            id: this.environment.name,
            environment: {
              name: this.environment.name,
              color: this.environment.color,
              host: this.environment.host,
              port: parseInt(this.environment.port),
              ssl: this.environment.ssl,
              backendMajorVersion: this.environment.backendMajorVersion,
              hideAdminBanner: ['localhost', '127.0.0.1'].includes(
                this.environment.host
              )
                ? true
                : false
            }
          })
        }
      } catch (error) {
        this.$log.error(error.message)
        this.$bvToast.toast(error.message, {
          title:
            'Ooops! Something went wrong while creating the new environment.',
          variant: 'warning',
          toaster: 'b-toaster-bottom-right',
          appendToast: true,
          dismissible: true,
          noAutoHide: true
        })
      }
      this.submitting = false
    },
    selectColor(index) {
      this.$v.environment.color.$model = this.colors[index]
    }
  }
}
</script>

<style lang="scss" scoped>
.CreateEnvironment-box {
  margin-bottom: 10px;
  color: #fff;
  border-radius: 5px;
  line-height: 40px;
  min-height: 40px;
  text-align: center;
  text-transform: uppercase;
  cursor: pointer;
}
</style>
