import { computed } from "vue";
import { useCategoryTemplate } from "~/composables/useCategoryTemplate";

export function useCategoryData(categoryId: number) {
  const { fetchCategoryTemplate, data: categoryData } = useCategoryTemplate();

  fetchCategoryTemplate(categoryId);

  const homepageData = computed(() => {
    if (typeof categoryData.value?.data !== "string") {
      return {};
    }
    try {
      return JSON.parse(categoryData.value.data);
    } catch (err) {
      console.error("Error parsing category data:", err);
      return {};
    }
  });

  return { homepageData };
}
