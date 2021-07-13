<template>
  <b-form-input
    :ref="refName"
    v-model="innerValue"
    v-bind="$attrs"
    data-auto-focus-input="true"
  />
</template>

<script>
// Keep the first mounted component parent in global to ensure developers never
// mount two AutoFocusInput component on the same page
let componentParents = []

function getParents(component, parents = []) {
  if (!component.$parent) {
    return parents
  }

  return getParents(component.$parent, [component.$options.name, ...parents])
}

export default {
  name: 'AutoFocusInput',
  props: {
    name: {
      type: String,
      required: true
    },
    initialValue: {
      type: String,
      default: ''
    },
    value: {
      type: String
    }
  },
  data() {
    return {
      innerValue: this.initialValue
    }
  },
  computed: {
    refName() {
      return `auto-focus-input-${this.name}`
    }
  },
  methods: {
    // AutoFocusInput should not handle keypress when user is using another input
    shouldHandleKeypress() {
      const tagType = document.activeElement.tagName

      // If we are currently selecting another input
      if (
        tagType === 'INPUT' &&
        !document.activeElement.dataset.autoFocusInput
      ) {
        return false
      }

      return true
    },
    isFocus() {
      return this.$refs[this.refName].$refs.input === document.activeElement
    },
    listenKeypress() {
      document.onkeypress = keyEvent => {
        if (!this.shouldHandleKeypress()) {
          return
        }

        if (this.isFocus()) {
          if (keyEvent.code === 'Enter') {
            this.$emit('submit')
          }

          return
        }

        this.$refs[this.refName].focus()

        // Firefox does not follow the key event to the input but Chrome does
        // so after the event has finished his propagation, we check the input
        // value and on Firefox it will be empty so we put the first letter inside
        // Using preventDefault() to manually input the first letter and prevent
        // to have double input on Chrome doesn't work well because then the cursor
        // is at the wrong place
        setTimeout(() => {
          if (this.innerValue === '') {
            this.innerValue = keyEvent.key
          }
        }, 1)
      }
    },
    stopListenKeypress() {
      document.onkeypress = null
    }
  },
  mounted() {
    if (componentParents.length !== 0) {
      throw new Error(
        `Cannot mount AutoFocusInput at: ${getParents(this).join(
          ' > '
        )}. \nAn AutoFocusInput is already mounted at: ${componentParents.join(
          ' > '
        )}.`
      )
    }

    componentParents = getParents(this)

    this.listenKeypress()
  },
  watch: {
    value(newValue) {
      if (newValue !== this.innerValue) {
        this.innerValue = newValue
      }
    },
    innerValue() {
      this.$emit('input', this.innerValue)
    }
  },
  beforeDestroy() {
    this.stopListenKeypress()
    componentParents = []
  }
}
</script>
