const filters = [
  'original', 'sepia', 'bw', 'bright', 'vintage', 'cool', 'warm', 'contrast',
  'blur', 'pop', 'soft', 'matte', 'glow', 'inkwell', 'golden', 'rose',
  'cinema', 'mocha', 'radiant', 'ocean', 'shadow', 'noir', 'haze', 'vivid',
  'retro', 'dreamy', 'crisp', 'pastel', 'neon', 'solar', 'lunar', 'velvet',
  'smoke', 'prism', 'aqua', 'ember', 'frost', 'sunset', 'dawn', 'twilight',
  'grunge', 'lomo'
];

let currentFilter = 'original';
let uploadedImageURL = '';

function previewFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Only allow image types
  if (!file.type.startsWith('image/')) {
    alert("Only image uploads are allowed.");
    return;
  }

  uploadedImageURL = URL.createObjectURL(file);
  const previewBox = document.getElementById("preview");
  const captionInput = document.getElementById("caption");
  const postButton = document.getElementById("postButton");
  const filterSection = document.getElementById("filterPreviewSection");

  previewBox.classList.remove("hidden");
  captionInput.classList.remove("hidden");
  postButton.disabled = false;

  previewBox.innerHTML = `<img id="mainPreviewImg" src="${uploadedImageURL}" alt="Preview" loading="lazy">`;
  filterSection.classList.remove("hidden");
  generateFilterPreviews(uploadedImageURL);
}

function generateFilterPreviews(imgSrc) {
  const container = document.getElementById("filterPreviews");
  container.innerHTML = '';

  filters.forEach(filter => {
    const div = document.createElement('div');
    div.className = `filter-thumb ${filter === currentFilter ? 'active-filter' : ''}`;
    div.innerHTML = `
      <img src="${imgSrc}" alt="${filter} filter" class="filter-preview-${filter}" loading="lazy">
      <span class="filter-name">${filter}</span>
    `;
    div.onclick = () => applyFilter(filter);
    container.appendChild(div);
  });

  container.scrollTo({ left: 0, behavior: 'smooth' });
}

function applyFilter(filterName) {
  const previewImg = document.getElementById("mainPreviewImg");
  const allThumbs = document.querySelectorAll('.filter-thumb');

  allThumbs.forEach(el => el.classList.remove('active-filter'));

  const selectedThumb = Array.from(allThumbs).find(thumb =>
    thumb.querySelector('img').classList.contains(`filter-preview-${filterName}`)
  );

  if (selectedThumb) selectedThumb.classList.add('active-filter');

  if (previewImg) {
    previewImg.className = filterName !== 'original' ? `filter-preview-${filterName}` : '';
    currentFilter = filterName;
  }
}

function toggleSection(sectionId) {
  const section = document.getElementById(sectionId);
  section.classList.toggle("hidden");
  if (!section.classList.contains("hidden")) {
    section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  const postButton = document.getElementById("postButton");
  postButton.disabled = true;
  postButton.innerHTML = '<div class="spinner"></div>';

  const caption = document.getElementById("caption").value;
  const tags = document.getElementById("tags").value;
  const location = document.getElementById("location").value;
  const filter = currentFilter;
  const photoInput = document.querySelector('input[name="photo"]:not([disabled])');

  const file = photoInput?.files[0];

  if (!file) {
    alert("Please upload an image.");
    postButton.innerHTML = "Share";
    postButton.disabled = false;
    return;
  }

  const formData = new FormData();
  formData.append("media", file);
  formData.append("caption", caption);
  formData.append("tags", tags);
  formData.append("location", location);
  formData.append("filter", filter);

  try {
    const res = await fetch("/feed/message/post", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Failed to post");

    alert("Post shared successfully!");
    window.location.href = "/feed";
  } catch (error) {
    alert("Error sharing post. Please try again.");
  } finally {
    postButton.innerHTML = "Share";
    postButton.disabled = false;
  }
}

// Drag & Drop Support for images
const previewBox = document.getElementById("preview");
previewBox.addEventListener("dragover", (e) => {
  e.preventDefault();
  previewBox.classList.add("border-blue-600");
});

previewBox.addEventListener("dragleave", () => {
  previewBox.classList.remove("border-blue-600");
});

previewBox.addEventListener("drop", (e) => {
  e.preventDefault();
  previewBox.classList.remove("border-blue-600");
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    const event = { target: { files: [file] } };
    previewFile(event);
  } else {
    alert("Only image uploads are allowed.");
  }
});

// Cleanup memory
window.addEventListener('beforeunload', () => {
  if (uploadedImageURL) URL.revokeObjectURL(uploadedImageURL);
});
