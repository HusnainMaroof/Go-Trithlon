// utils/actionWrapper.ts
export const catchErrors =
  (fn: Function) =>
  async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error("Global Action Error:", error);
      return {
        success: false,
        error: true,
        message:
          error instanceof Error ? error.message : "Internal Server Error",
        data: {},
      };
    }
  };