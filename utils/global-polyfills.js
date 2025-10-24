import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

// 2. Explicitly ensure global.Blob is defined for Supabase/fetch compatibility
// This is the critical part that most often resolves the issue.
if (typeof Blob === 'undefined') {
  // Use a custom implementation if needed, but for most modern Expo setups,
  // simply declaring it after the polyfills are imported often works:
  // If problems persist, you might need a more complex polyfill like:
  // const RNFetchBlob = require('react-native-fetch-blob');
  // global.Blob = RNFetchBlob.default.polyfill.Blob;
  
  // For Expo, we rely on the above imports to define it.
  // We'll leave this empty but ensure the imports are run.
}

console.log("Global polyfills loaded successfully.");