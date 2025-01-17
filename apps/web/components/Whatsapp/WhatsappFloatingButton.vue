<template>
  <transition name="fade">
    <div v-if="visible" class="fixed bottom-16 right-8 z-50">
      <a
        :href="whatsappLink"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center justify-center w-22 h-22 bg-green-500 rounded-full shadow-lg hover:bg-green-600 transition-colors"
      >
        <img
          src="https://img.icons8.com/?size=100&id=124205&format=png&color=000000"
          alt="WhatsApp"
          class="w-16 h-16"
        />
      </a>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, defineProps } from "vue";

function sanitizePhoneNumber(input: string): string {
  let phone = input.trim();
  phone = phone.replace(/^\+/, ''); // remove leading '+'
  phone = phone.replace(/\D/g, ''); // remove all non-digits
  return phone;
}

const props = defineProps<{
  phoneNumber: string;
  message?: string;
}>();

const visible = ref(true);

const whatsappLink = computed(() => {
  // Clean up the phone number
  const phone = sanitizePhoneNumber(props.phoneNumber);

  // Encode the message if you want to append it (optional)
  const msg = props.message ? `?text=${encodeURIComponent(props.message)}` : '';

  return `https://wa.me/${phone}${msg}`;
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
