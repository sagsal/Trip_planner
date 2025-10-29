// Cache clearing utility
export function clearBrowserCache() {
  if (typeof window !== 'undefined') {
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear any cached API responses
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    console.log('Browser cache cleared');
  }
}

// Force reload without cache
export function forceReload() {
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}
