<template>
  <div class="Home">
    <div class="Home-menuWrapper">
      <main-menu
        @environment::create="$emit('environment::create', $event)"
        @environment::delete="$emit('environment::delete', $event)"
        @environment::importEnv="$emit('environment::importEnv')"
      />
    </div>

    <div class="Home-routeWrapper" data-cy="App-loggedIn">
      <main-spinner v-if="authInitializing"></main-spinner>
      <router-view v-else />
    </div>
    <b-toast
      variant="info"
      no-auto-hide
      toaster="b-toaster-bottom-right"
      title="Warning!"
      data-cy="noAdminAlert"
      id="no-admin-banner"
    >
      <p>
        Your Kuzzle has no administrator user. It is strongly recommended
        <a href="#/signup" class="alert-link"> that you create one.</a>
      </p>
      <div class="text-center">
        <b-button
          title="Don't show this toast again for the current environment"
          variant="primary"
          size="sm"
          id="noAdminGotIt"
          @click="hideNoAdminBanner"
        >
          Ok, got it
        </b-button>
      </div>
    </b-toast>

    <b-modal
      id="tokenExpired"
      data-cy="Modal-tokenExpired"
      hide-footer
      title="Sorry, your session has expired"
      v-model="tokenExpiredIsOpen"
    >
      <login-form />
    </b-modal>
  </div>
</template>

<script>
import MainMenu from './Common/MainMenu'
import MainSpinner from './Common/MainSpinner'
import LoginForm from './Common/Login/Form'
import { mapGetters } from 'vuex'

export default {
  name: 'Home',
  components: {
    LoginForm,
    MainMenu,
    MainSpinner
  },
  data() {
    return {
      host: null,
      port: null,
      tokenExpiredIsOpen: false
    }
  },
  computed: {
    ...mapGetters('kuzzle', ['$kuzzle', 'currentEnvironment']),
    tokenValid() {
      return this.$store.direct.state.auth.tokenValid
    },
    authInitializing() {
      return this.$store.direct.state.auth.initializing
    }
  },
  methods: {
    hideNoAdminBanner() {
      this.$store.direct.dispatch.kuzzle.updateEnvironment({
        id: this.$store.direct.state.kuzzle.currentId,
        environment: {
          ...this.currentEnvironment,
          hideAdminBanner: true
        }
      })
      this.$bvToast.hide('no-admin-banner')
    },
    onTokenExpired() {
      this.$store.direct.dispatch.auth.setSession(null)
    },
    noop() {},
    displayNoAdminToast() {
      if (this.$store.direct.getters.auth.adminAlreadyExists) {
        return
      }
      if (this.currentEnvironment.hideAdminBanner) {
        return
      }
      this.$bvToast.show('no-admin-banner')
    }
  },
  mounted() {
    this.$kuzzle.on('tokenExpired', () => this.onTokenExpired())
    this.$kuzzle.on('queryError', e => {
      if (this.currentEnvironment.backendMajorVersion === 1) {
        switch (e.id) {
          case 'security.token.invalid':
            this.onTokenExpired()
            break
          default:
            break
        }
      } else {
        switch (e.id) {
          case 'security.token.expired':
            this.onTokenExpired()
            break
          default:
            break
        }
      }
    })
    this.displayNoAdminToast()
  },
  beforeDestroy() {
    this.$kuzzle.removeListener('tokenExpired')
    this.$kuzzle.removeListener('queryError')
  },
  watch: {
    tokenValid: {
      handler(val) {
        setTimeout(() => {
          this.tokenExpiredIsOpen = !val
        }, 500)
      }
    }
  }
}
</script>

<style lang="scss" rel="stylesheet/scss" scoped>
.Home {
  height: 100%;
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-items: stretch;
}

.Home-menuWrapper {
  flex-basis: 66px;
}

.Home-routeWrapper {
  flex-grow: 1;
  flex-basis: 300px;
  overflow: hidden;
}
</style>
