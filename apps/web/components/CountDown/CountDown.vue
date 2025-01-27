<template>
  <div
    class=" mx-auto py-1 shadow-sm text-center bg-orange-500 flex w-full h-100 flex-col md:flex-row text-white items-center justify-center"
  >
    <!-- Title -->
    <span
      v-if="mergedConfig.enableTitle"
      class="max-w-fit font-normal w-full"
    >
      {{ mergedConfig.title }}
    </span>

    <!-- The countdown units -->
    <div class="flex justify-center space-x-6 items-center pl-8">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ffffff"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      <!-- Days -->
      <div class="flex flex-row items-center">
        <div class="mr-2 md:text-1xl font-bold">{{ countdown.days }}</div>
        <div class="text-sm">T</div>
      </div>
      <!-- Hours -->
      <div class="flex flex-row items-center">
        <div class="md:text-1xl mr-2 font-bold">{{ countdown.hours }}</div>
        <div class="text-sm">H</div>
      </div>
      <!-- Minutes -->
      <div class="flex flex-row items-center">
        <div class="md:text-1xl mr-2 font-bold">{{ countdown.minutes }}</div>
        <div class="text-sm">M</div>
      </div>
      <!-- Seconds -->
      <div class="flex flex-row items-center">
        <div class="md:text-1xl mr-2 font-bold">{{ countdown.seconds }}</div>
        <div class="text-sm">S</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, defineProps } from "vue";

type TimerConfig = {
  enableTitle?: boolean;
  title?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
};

// PROPS
const props = defineProps<{ timerConfig?: string }>();

/**
 * A default / fallback config object, if none is provided:
 */
const defaultConfig: Required<TimerConfig> = {
  enableTitle: true,
  title: "Counter Timer mit custom konfiguration nur mit webimpact!",
  startDate: new Date().toISOString(), // default start is "now"
  endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // default to 24h from now
};

// Convert the JSON string prop into an object, falling back to default:
const mergedConfig = computed<TimerConfig>(() => {
  try {
    if (!props.timerConfig) return defaultConfig;
    const parsed = JSON.parse(props.timerConfig) as TimerConfig;

    return {
      enableTitle: parsed.enableTitle ?? defaultConfig.enableTitle,
      title: parsed.title ?? defaultConfig.title,
      startDate: parsed.startDate ?? defaultConfig.startDate,
      endDate: parsed.endDate ?? defaultConfig.endDate,
    };
  } catch (e) {
    console.error("Error parsing timerConfig:", e);
    return defaultConfig;
  }
});

// A reactive object that holds the current countdown values
const countdown = ref({
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
});

/**
 * Helper function that calculates time difference between "now" and "endDate".
 * Also we’ll ignore "startDate" if it’s in the past; if "now" is before "startDate",
 * we’ll count from start -> end. If "now" is after "startDate", we count from now -> end.
 */
function calculateCountdown() {
  const now = new Date();
  const start = new Date(mergedConfig.value.startDate!);
  const end = new Date(mergedConfig.value.endDate!);

  // If end is in the past, everything = 0
  if (end.getTime() < now.getTime()) {
    countdown.value = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return;
  }

  // If we haven’t reached start date yet, countdown is from start to end,
  // but if "now < start", we use start as the "current time"
  const currentTime = now < start ? start : now;
  const diff = end.getTime() - currentTime.getTime();

  // Convert diff (ms) to day/h/m/s
  let totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  totalSeconds -= days * 3600 * 24;

  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds -= hours * 3600;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;

  countdown.value = { days, hours, minutes, seconds };
}

let intervalId: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  // Calculate right away
  calculateCountdown();
  // Update every second
  intervalId = setInterval(calculateCountdown, 1000);
});

onBeforeUnmount(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>
