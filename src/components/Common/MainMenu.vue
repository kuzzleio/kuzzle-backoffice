<template>
  <b-navbar
    toggleable="sm"
    type="dark"
    :class="`MainMenu EnvColor--${currentEnvironmentColor}`"
  >
    <b-navbar-brand href="#" class="logo">
      <img
        alt="Kuzzle.io"
        src="~../../assets/logo-white.svg"
        v-b-tooltip.hover
        :title="`Admin Console v${adminConsoleVersion}`"
      />
    </b-navbar-brand>
    <b-navbar-toggle target="nav-collapse" type="light"></b-navbar-toggle>
    <b-collapse id="nav-collapse" is-nav>
      <b-navbar-nav>
        <b-nav-item
          :active="
            $route.path.match('/data')
              ? $route.path.match('/data').length > 0
              : false
          "
          :to="{ name: 'Data' }"
          >Data</b-nav-item
        >
        <b-nav-item
          :active="
            $route.path.match('/security')
              ? $route.path.match('/security').length > 0
              : false
          "
          v-if="hasSecurityRights"
          :to="{ name: 'Security' }"
        >
          Security
        </b-nav-item>
        <b-nav-item
          :active="
            $route.path.match('/api-action')
              ? $route.path.match('/api-action').length > 0
              : false
          "
          :to="{ name: 'ApiAction' }"
        >
          API Action
        </b-nav-item>
        <b-dropdown
          class="mr-2"
          no-caret
          :toggle-class="
            `feedbackDropdown EnvColor--${currentEnvironmentColor}`
          "
        >
          <template v-slot:button-content>
            <span class="feedbackButtonText">Feedback</span>
          </template>
          <b-dropdown-item
            v-for="feedback of feedbackOptions"
            :key="`feedback-${feedback.text}`"
            :href="feedback.url"
            target="_blank"
          >
            <i :class="feedback.icon" class="mr-2 feedbackIcon" />
            {{ feedback.text }}
          </b-dropdown-item>
        </b-dropdown>
      </b-navbar-nav>
      <b-navbar-nav class="ml-auto">
        <b-nav-text
          class="MainMenu-username mr-2 text-white text-truncate"
          :title="currentUserName"
        >
          <b>{{ currentUserName }}</b>
        </b-nav-text>
        <b-nav-text class="mr-2">on</b-nav-text>
        <environment-switch
          class="MainMenu-envSwitch"
          :blend-color="true"
          @environment::importEnv="importEnv"
          @environment::create="editEnvironment"
          @environment::delete="deleteEnvironment"
        />
        <b-nav-item class="ml-1">
          <a data-cy="MainMenu-logoutBtn" title="Logout" @click="doLogout">
            <i class="logout fas fa-power-off" />
          </a>
        </b-nav-item>
      </b-navbar-nav>
    </b-collapse>
  </b-navbar>
</template>

<script>
import EnvironmentSwitch from './Environments/EnvironmentsSwitch'
import { mapGetters } from 'vuex'
export default {
  name: 'MainMenu',
  components: {
    EnvironmentSwitch
  },
  data() {
    return {
      feedbackOptions: [
        {
          text: 'Talk with our community',
          url: 'http://join.discord.kuzzle.io/',
          icon: 'fab fa-discord'
        },
        {
          text: 'Ask a question',
          url:
            'https://stackoverflow.com/questions/ask?tags=kuzzle&title=[Admin%20Console]',
          icon: 'fab fa-stack-overflow'
        },
        {
          text: 'Fill an issue',
          url:
            'https://github.com/kuzzleio/kuzzle-admin-console/issues/new/choose',
          icon: 'fab fa-github'
        }
      ]
    }
  },
  computed: {
    ...mapGetters('auth', ['hasSecurityRights', 'user']),
    currentEnvironmentColor() {
      return this.$store.direct.getters.kuzzle.currentEnvironment.color
    },
    currentUserName() {
      if (!this.user) {
        return 'Not authenticated'
      }
      if (this.user.id === -1) {
        return 'Anonymous'
      }
      if (this.user.params && this.user.params.name) {
        return this.user.params.name
      }
      return this.user.id
    },
    adminConsoleVersion() {
      return require('../../../package.json').version
    }
  },
  methods: {
    async doLogout() {
      try {
        await this.$store.direct.dispatch.auth.doLogout()
        this.$router.push({ name: 'Login' })
      } catch (error) {
        this.$log.error(error)
        this.$bvToast.toast(
          'The complete error has been printed to the console.',
          {
            title: 'Ooops! Something went wrong while logging out.',
            variant: 'warning',
            toaster: 'b-toaster-bottom-right',
            appendToast: true,
            dismissible: true,
            noAutoHide: true
          }
        )
      }
    },

    editEnvironment(id) {
      this.$emit('environment::create', id)
    },
    importEnv() {
      this.$emit('environment::importEnv')
    },
    deleteEnvironment(id) {
      this.$emit('environment::delete', id)
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.feedbackButtonText {
  opacity: 0.5;
}

.feedbackIcon {
  width: 1em;
}

::v-deep .feedbackDropdown {
  border: none;
  box-shadow: none !important;
}

::v-deep .show .feedbackDropdown i {
  transform: rotate(90deg);
}

.logo {
  padding: 0;

  img {
    height: 50px;
    padding: 5px 50px;
  }
}
.MainMenu-envSwitch {
  display: inline-flex;
  max-width: 250px;
}
.MainMenu-username {
  max-width: 250px;
}
</style>
