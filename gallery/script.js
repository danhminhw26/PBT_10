// API Layer
const galleryAPI = {
  baseURL: "https://jsonplaceholder.typicode.com/photos",

  async getPhotos(page = 1, limit = 20) {
    try {
      const response = await fetch(
        `${this.baseURL}?_page=${page}&_limit=${limit}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch photos: ${error.message}`);
    }
  },
};

// UI Layer
const ui = {
  elements: {
    gallery: document.getElementById("gallery"),
    loadingMore: document.getElementById("loadingMore"),
    loadTrigger: document.getElementById("loadTrigger"),
    lightbox: document.getElementById("lightbox"),
    lightboxImage: document.getElementById("lightboxImage"),
    lightboxTitle: document.getElementById("lightboxTitle"),
  },

  showLoadingMore() {
    this.elements.loadingMore.classList.remove("hidden");
  },

  hideLoadingMore() {
    this.elements.loadingMore.classList.add("hidden");
  },

  addPhotos(photos) {
    const html = photos
      .map(
        (photo) => `
            <div class="image-container" onclick="gallery.openLightbox('${photo.url}', '${photo.title}')">
                <div class="image-placeholder"></div>
                <img 
                    data-src="${photo.url}"
                    alt="${photo.title}"
                    class="lazy-load"
                >
            </div>
        `,
      )
      .join("");

    const fragment = document.createElement("div");
    fragment.innerHTML = html;

    this.elements.gallery.appendChild(...fragment.childNodes);

    // Setup lazy loading for new images
    this.setupLazyLoading();
  },

  setupLazyLoading() {
    const images = document.querySelectorAll("img.lazy-load");

    const imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove("lazy-load");
            img.addEventListener("load", () => {
              img.closest(".image-container").classList.add("loaded");
            });
            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: "50px",
      },
    );

    images.forEach((img) => {
      if (!img.src) {
        // Only observe images not yet loaded
        imageObserver.observe(img);
      }
    });
  },

  openLightbox(src, title) {
    this.elements.lightboxImage.src = src;
    this.elements.lightboxTitle.textContent = title;
    this.elements.lightbox.classList.remove("hidden");
  },

  closeLightbox() {
    this.elements.lightbox.classList.add("hidden");
  },
};

// Gallery Controller
const gallery = {
  currentPage: 1,
  photosPerPage: 20,
  isLoading: false,
  hasMore: true,

  init() {
    this.setupInfiniteScroll();
    this.loadMorePhotos();
  },

  setupInfiniteScroll() {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !this.isLoading && this.hasMore) {
          this.loadMorePhotos();
        }
      },
      {
        rootMargin: "100px",
      },
    );

    observer.observe(ui.elements.loadTrigger);
  },

  async loadMorePhotos() {
    if (this.isLoading) return;

    this.isLoading = true;
    ui.showLoadingMore();

    try {
      const photos = await galleryAPI.getPhotos(
        this.currentPage,
        this.photosPerPage,
      );

      if (photos.length === 0) {
        this.hasMore = false;
        ui.hideLoadingMore();
        return;
      }

      ui.addPhotos(photos);
      this.currentPage++;

      ui.hideLoadingMore();
    } catch (error) {
      console.error(error.message);
      ui.hideLoadingMore();
    } finally {
      this.isLoading = false;
    }
  },

  openLightbox(src, title) {
    ui.openLightbox(src, title);
  },

  closeLightbox() {
    ui.closeLightbox();
  },
};

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  gallery.init();
});
