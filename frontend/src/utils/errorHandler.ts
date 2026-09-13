/**
 * Centralized, user-friendly error message extractor for SOFRA.
 * Prevents generic, cryptic, or misleading messages like "Network Error" or "[object Object]".
 */
export function getErrorMessage(error: any, fallbackMessage: string = "An unexpected error occurred. Please try again."): string {
  if (!error) return fallbackMessage;

  // 1. If error is already a string
  if (typeof error === "string") {
    if (error === "Network Error" || error.toLowerCase().includes("network error")) {
      return getNetworkErrorMessage();
    }
    return error;
  }

  // 2. Check if the error response came from the backend
  if (error.response) {
    const data = error.response.data;
    const status = error.response.status;

    // A. Backend returned JSON with an explicit message
    if (data && typeof data === "object") {
      // Check for array of field validation errors (e.g. Zod, Mongoose, Express-validator)
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        const errorList = data.errors
          .map((errItem: any) => {
            if (typeof errItem === "string") return errItem;
            if (errItem.message) {
              const field = Array.isArray(errItem.path) && errItem.path.length > 0 
                ? errItem.path[errItem.path.length - 1] 
                : "";
              return field ? `${field}: ${errItem.message}` : errItem.message;
            }
            if (errItem.msg) return errItem.msg;
            return null;
          })
          .filter(Boolean);

        if (errorList.length > 0) {
          return errorList.join(". ");
        }
      }

      // Check for object map of validation errors: { field: "error" }
      if (data.errors && typeof data.errors === "object" && !Array.isArray(data.errors)) {
        const fieldErrors = Object.entries(data.errors)
          .map(([key, val]: [string, any]) => {
            const msg = typeof val === "object" ? val?.message : val;
            return msg ? `${key}: ${msg}` : null;
          })
          .filter(Boolean);

        if (fieldErrors.length > 0) {
          return fieldErrors.join(". ");
        }
      }

      // Explicit backend message
      if (data.message && typeof data.message === "string" && data.message.trim().length > 0) {
        // If the message is just "Validation failed" without errors array, provide friendlier guidance
        if (data.message.toLowerCase() === "validation failed") {
          return "Invalid information submitted. Please verify all required fields and try again.";
        }
        return data.message;
      }

      if (data.error && typeof data.error === "string") {
        return data.error;
      }
    }

    // B. HTTP Status specific friendly messages (when response body is missing, HTML, or raw status)
    switch (status) {
      case 400:
        return "Invalid request data. Please check your inputs and try again.";
      case 401:
        return "Invalid credentials or session expired. Please log in again.";
      case 403:
        return "Access denied: You do not have permission to perform this action.";
      case 404:
        return "The requested record, restaurant, or service was not found.";
      case 409:
        return "Conflict: This record or email already exists.";
      case 422:
        return "Unable to process submitted data. Please verify all fields.";
      case 429:
        return "Too many requests. Please slow down and wait a moment.";
      case 502:
      case 503:
      case 504:
        return "The server is currently waking up or restarting on cloud hosting. Please wait 15-20 seconds and try again.";
      case 500:
        return "The server encountered an error while processing your request. Please try again shortly.";
      default:
        break;
    }
  }

  // 3. Request was made but no response received (CORS, offline, cold start, timeout)
  if (error.request || error.code === "ERR_NETWORK" || error.message === "Network Error") {
    return getNetworkErrorMessage(error);
  }

  // 4. Timeout error
  if (error.code === "ECONNABORTED" || (error.message && error.message.toLowerCase().includes("timeout"))) {
    return "Request timed out. The server took too long to respond. Please try again.";
  }

  // 5. Standard JavaScript Error with message (filter out useless generic strings)
  if (error.message && typeof error.message === "string") {
    const raw = error.message.trim();
    if (
      raw !== "Network Error" &&
      raw !== "[object Object]" &&
      !raw.toLowerCase().includes("request failed with status code")
    ) {
      return raw;
    }
  }

  return fallbackMessage;
}

/**
 * Returns a clear, informative message for connection/network failures
 * instead of the cryptic "Network Error".
 */
function getNetworkErrorMessage(error?: any): string {
  // Check if browser is offline
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return "You are currently offline. Please check your internet connection.";
  }

  // If online, the server might be starting up from idle or CORS is blocked
  return "Unable to connect to the server. If the server is waking up from sleep, please wait 15 seconds and try again.";
}
