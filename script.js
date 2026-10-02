document.addEventListener("DOMContentLoaded", async () => {
  const slidesContainer = document.getElementById("slides-container");
  const currentSlideLabel = document.getElementById("current-slide-label");
  const ttsButton = document.getElementById("tts-button");

  // Text-to-Speech Functionality with Arabic Support
  function speakSelectedText() {
    const selectedText = window.getSelection().toString().trim();
    
    if (!selectedText) {
      alert("Please select some text first to convert to speech.");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Detect language (simple detection based on Arabic script)
    const arabicRegex = /[\u0600-\u06FF]/g;
    const isArabic = arabicRegex.test(selectedText);

    const utterance = new SpeechSynthesisUtterance(selectedText);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Set language based on detected text
    if (isArabic) {
      utterance.lang = 'ar-SA'; // Arabic (Saudi Arabia)
    } else {
      utterance.lang = 'en-US'; // English (US)
    }

    // Visual feedback
    ttsButton.classList.add("speaking");
    ttsButton.textContent = "🔊 Speaking...";

    utterance.onend = () => {
      ttsButton.classList.remove("speaking");
      ttsButton.textContent = "🔊 Read Selected Text";
    };

    utterance.onerror = () => {
      ttsButton.classList.remove("speaking");
      ttsButton.textContent = "🔊 Read Selected Text";
      console.error("Speech synthesis error:", utterance.error);
    };

    window.speechSynthesis.speak(utterance);
  }

  // Attach click listener to TTS button
  ttsButton.addEventListener("click", speakSelectedText);

  // Keyboard shortcut: Ctrl+Shift+S (or Cmd+Shift+S on Mac)
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "S") {
      e.preventDefault();
      speakSelectedText();
    }
  });

  try {
    const response = await fetch("activity.json");
    if (!response.ok) {
      throw new Error("Could not load activity.json");
    }

    const data = await response.json();

    const lessons = Array.isArray(data) ? data : [data];

    if (!lessons.length) {
      throw new Error("No lesson data found.");
    }

    lessons.forEach((lesson, index) => {
      const section = document.createElement("section");
      section.className = "slide";
      section.tabIndex = 0;
      section.setAttribute("data-background-color", "#0b1020");
      section.setAttribute("aria-label", `Slide ${index + 1}: ${lesson.lessonTitle || "English lesson"}`);

      const audioFile = lesson.audioFileName || "";
      const audioScript = lesson.audioScript || "No audio script available.";
      const arabicTranslation = lesson.arabicTranslation || "No Arabic translation available.";
      const bookTitle = lesson.bookTitle || "Unknown book";
      const unitNumber = lesson.unitNumber ?? "N/A";
      const pageNumber = lesson.pageNumber ?? "N/A";

      section.innerHTML = `
        <div class="slide-content" tabindex="0">
          <h1>${lesson.lessonTitle || `Lesson ${index + 1}`}</h1>

          <div class="meta-grid">
            <div class="meta-card">
              <strong>Book</strong>
              <span>${bookTitle}</span>
            </div>

            <div class="meta-card">
              <strong>Unit</strong>
              <span>${unitNumber}</span>
            </div>

            <div class="meta-card">
              <strong>Page</strong>
              <span>${pageNumber}</span>
            </div>

            <div class="meta-card">
              <strong>Audio</strong>
              <span>${audioFile ? audioFile : "No audio file assigned"}</span>
            </div>
          </div>

          <div class="audio-box">
            <strong>Listen to the lesson audio:</strong>
            ${
              audioFile
                ? `<audio controls preload="metadata" aria-label="Lesson audio for ${lesson.lessonTitle || "this lesson"}">
                    <source src="${audioFile}" type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>`
                : "<p>No audio file available.</p>"
            }
          </div>

          <div class="transcript-box">
            <strong>Audio script</strong>
            <p>${audioScript}</p>
          </div>

          <div class="translation-box">
            <strong>Arabic translation</strong>
            <p>${arabicTranslation}</p>
          </div>
        </div>
      `;

      slidesContainer.appendChild(section);
    });

    Reveal.initialize({
      hash: false,
      controls: true,
      progress: true,
      slideNumber:'c/t',
      center: true,
      width: 1280,
      height: 720,
      transition: "slide",
      controlsLayout:'edges',
      backgroundTransition: "fade",
      navigationMode: "linear",
      keyboard: true,
      touch: true,
      help: true,
      fragments: true,
      pdfSeparateFragments: false,
      plugins: []
    });

    const updateFooterSlideInfo = () => {
      const total = document.querySelectorAll(".slides section").length;
      const currentIndex = Reveal.getIndices().h + 1;
      currentSlideLabel.textContent = `${currentIndex} / ${total}`;
    };

    Reveal.addEventListener("slidechanged", updateFooterSlideInfo);
    updateFooterSlideInfo();

    // Optional: focus the slide content after changing slides for screen readers
    Reveal.addEventListener("slidechanged", () => {
      const current = document.querySelector(".slides section.present .slide-content");
      if (current) {
        current.setAttribute("tabindex", "0");
        current.focus({ preventScroll: true });
      }
    });

  } catch (error) {
    console.error(error);

    const fallbackSection = document.createElement("section");
    fallbackSection.innerHTML = `
      <div class="slide-content" tabindex="0">
        <h1>Lesson Content Not Loaded</h1>
        <p>The activity data could not be loaded.</p>
        <p>Please ensure <strong>activity.json</strong> exists and is valid JSON.</p>
      </div>
    `;
    slidesContainer.appendChild(fallbackSection);

    Reveal.initialize({
      hash: false,
      controls: true,
      progress: true,
      controlsLayout:'edge',
      touch:true,
      slideNumber: 'c/t',
      center: true,
      transition: "slide"
    });

    currentSlideLabel.textContent = "1 / 1";
  }
});
