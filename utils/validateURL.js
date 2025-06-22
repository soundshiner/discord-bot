// utils/validateURL.js
export function validateURL(url) {
  try {
    new URL(url);
    return (
      url.startsWith("https://youtu.be") ||
      url.startsWith("https://www.youtube.com") ||
      url.startsWith("https://open.spotify.com")
    );
  } catch (err) {
    return false;
  }
}
