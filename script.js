const gallery = document.querySelector("#gallery");
const viewer = document.querySelector("#viewer");
const viewerImage = document.querySelector("#viewer-image");
const viewerTitle = document.querySelector("#viewer-title");
const downloadLink = document.querySelector("#download-link");
const instagramLink = document.querySelector("#instagram-link");
const musicToggle = document.querySelector("#music-toggle");
const music = new Audio();
music.loop = true;
let audioMuted = false;

async function loadArtworks() {
  const response = await fetch("images_database.tsv");
  if (!response.ok) throw new Error(`Could not load images_database.tsv (${response.status})`);
  const [header, ...rows] = (await response.text()).trim().split(/\r?\n/);
  const columns = header.split("\t");
  const titleIndex = columns.indexOf("image name");
  const filenameIndex = columns.indexOf("filename");
  const videoIndex = columns.indexOf("instagram video link");
  if (titleIndex < 0 || filenameIndex < 0 || videoIndex < 0) {
    throw new Error("images_database.tsv is missing a required column.");
  }
  return rows.map(row => row.split("\t")).filter(row => row[filenameIndex]).map((row, index) => ({
    title: row[titleIndex],
    image: `images/${row[filenameIndex]}`,
    instagram: row[videoIndex],
    audio: `audio/artwork-${String(index + 1).padStart(2, "0")}.mp3`
  }));
}

function renderArtworks(artworks) {
for (const artwork of artworks) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "artwork";
  card.setAttribute("aria-label", `View ${artwork.title}`);
  const image = document.createElement("img");
  image.src = artwork.image;
  image.alt = artwork.title;
  image.loading = "lazy";
  image.addEventListener("error", () => {
    image.alt = `${artwork.title} — add ${artwork.image} to show this image`;
    image.src = "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#111"/><path d="M0 480 220 270l145 145 130-170 305 355H0Z" fill="#242424"/><circle cx="575" cy="160" r="48" fill="#383838"/><text x="400" y="545" fill="#bbb" font-family="Arial,sans-serif" font-size="24" text-anchor="middle">Add ${artwork.title}</text></svg>`);
    image.removeAttribute("loading");
  }, { once: true });
  const caption = document.createElement("div");
  caption.className = "artwork-caption";
  const title = document.createElement("strong");
  title.textContent = artwork.title;
  const hint = document.createElement("span");
  hint.textContent = "View ↗";
  caption.append(title, hint);
  card.append(image, caption);
  card.addEventListener("click", () => openArtwork(artwork));
  gallery.append(card);
}
}

loadArtworks().then(renderArtworks).catch(error => {
  const message = document.createElement("p");
  message.className = "footer-note";
  message.textContent = `${error.message}. Open this gallery through a local web server to load its TSV database.`;
  gallery.replaceWith(message);
});

function openArtwork(artwork) {
  viewerImage.src = artwork.image;
  viewerImage.alt = artwork.title;
  viewerTitle.textContent = artwork.title;
  downloadLink.href = artwork.image;
  downloadLink.download = artwork.image.split("/").pop();
  instagramLink.href = artwork.instagram;
  music.pause();
  music.src = artwork.audio || "";
  music.muted = audioMuted;
  if (artwork.audio && !audioMuted) music.play().catch(() => {});
  viewer.showModal();
}

function closeViewer() {
  if (viewer.open) viewer.close();
  music.pause();
  music.removeAttribute("src");
  music.load();
}

document.querySelector(".viewer-close").addEventListener("click", closeViewer);
viewer.addEventListener("click", event => { if (event.target === viewer) closeViewer(); });
viewer.addEventListener("close", () => { music.pause(); });
musicToggle.addEventListener("click", () => {
  audioMuted = !audioMuted;
  music.muted = audioMuted;
  musicToggle.setAttribute("aria-pressed", String(audioMuted));
  musicToggle.setAttribute("aria-label", audioMuted ? "Turn artwork audio on" : "Mute artwork audio");
  musicToggle.textContent = audioMuted ? "🔇" : "♫";
  if (!audioMuted && viewer.open && music.src) music.play().catch(() => {});
});
window.addEventListener("piano-mute-change", event => {
  audioMuted = event.detail.muted;
  music.muted = audioMuted;
});
document.addEventListener("keydown", event => { if (event.key === "Escape") closeViewer(); });
