const words = [];
    let currentIndex = -1;
    let answerVisible = false;
    let autoInterval = null;

    const flashcard = document.getElementById("flashcard");
    const answer = document.getElementById("answer");
    const progress = document.getElementById("progress");
    const startButton = document.getElementById("start-button");
    const revealButton = document.getElementById("reveal-button");
    const nextButton = document.getElementById("next-button");
    const autoButton = document.getElementById("auto-button");
    const entryMode = document.getElementById("entry-mode");
    const wordInput = document.getElementById("word-input");
    const translationInput = document.getElementById("translation-input");
    const translationField = document.getElementById("translation-field");
    const photoField = document.getElementById("photo-field");
    const photoInput = document.getElementById("photo-input");
    const uploadTitle = document.getElementById("upload-title");
    const feedback = document.getElementById("feedback");
    const wordList = document.getElementById("word-list");
    const emptyLibrary = document.getElementById("empty-library");
    const clearButton = document.getElementById("clear-button");

    function updateControls() {
      const hasWords = words.length > 0;
      startButton.disabled = !hasWords;
      revealButton.disabled = !hasWords || currentIndex < 0 || answerVisible;
      nextButton.disabled = !hasWords || currentIndex < 0;
      autoButton.disabled = !hasWords;
      autoButton.textContent = autoInterval === null ? "▶  Défilement auto" : "⏸  Mettre en pause";
      autoButton.setAttribute("aria-pressed", String(autoInterval !== null));
      progress.textContent = words.length + (words.length > 1 ? " mots à réviser" : " mot à réviser");
      emptyLibrary.hidden = hasWords;
      clearButton.hidden = !hasWords;
    }

    function chooseRandomWord() {
      if (words.length === 0) return;
      let nextIndex = Math.floor(Math.random() * words.length);
      if (words.length > 1) {
        while (nextIndex === currentIndex) {
          nextIndex = Math.floor(Math.random() * words.length);
        }
      }
      currentIndex = nextIndex;
      answerVisible = false;

      const word = words[currentIndex];
      flashcard.replaceChildren();
      if (word.image) {
        const image = document.createElement("img");
        image.src = word.image;
        image.alt = "Photo à associer au mot allemand";
        flashcard.append(image);
      } else {
        const prompt = document.createElement("div");
        prompt.className = "translation-prompt";
        const label = document.createElement("p");
        label.className = "translation-prompt-label";
        label.textContent = "Traduis en allemand";
        const translation = document.createElement("p");
        translation.className = "translation-prompt-text";
        translation.textContent = word.translation;
        prompt.append(label, translation);
        flashcard.append(prompt);
      }

      answer.textContent = "••••••";
      answer.classList.add("hidden");
      updateControls();
      revealButton.disabled = false;
    }

    function renderWordList() {
      wordList.replaceChildren();
      words.forEach((word, index) => {
        const item = document.createElement("li");
        item.className = "word-chip";
        const image = document.createElement(word.image ? "img" : "span");
        if (word.image) {
          image.src = word.image;
          image.alt = "";
        } else {
          image.className = "word-chip-icon";
          image.textContent = "文";
          image.setAttribute("aria-hidden", "true");
        }
        const label = document.createElement("span");
        label.textContent = word.translation ? word.text + " · " + word.translation : word.text;
        const remove = document.createElement("button");
        remove.className = "remove-word";
        remove.type = "button";
        remove.textContent = "×";
        remove.setAttribute("aria-label", "Supprimer « " + word.text + " »");
        remove.addEventListener("click", () => removeWord(index));
        item.append(image, label, remove);
        wordList.append(item);
      });
      updateControls();
    }

    function removeWord(index) {
      words.splice(index, 1);
      if (words.length === 0) {
        stopAutoRotation();
        currentIndex = -1;
        answer.textContent = "••••••";
        answer.classList.add("hidden");
        flashcard.innerHTML = '<span class="placeholder-icon" aria-hidden="true">🌿</span><p class="placeholder-title">Prêt·e à faire travailler ta mémoire ?</p><p class="placeholder-copy">Ajoute des photos ou des mots avec leur traduction, puis lance ta première session.</p>';
      } else if (index === currentIndex) {
        currentIndex = -1;
        chooseRandomWord();
      } else {
        if (index < currentIndex) currentIndex--;
      }
      renderWordList();
    }

    document.getElementById("add-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const text = wordInput.value.trim();
      const isTranslationMode = entryMode.value === "translation";
      const translation = translationInput.value.trim();
      const file = photoInput.files[0];
      if (!text || (isTranslationMode && !translation) || (!isTranslationMode && !file)) {
        feedback.textContent = isTranslationMode
          ? "Ajoute le mot allemand et sa traduction française."
          : "Ajoute un mot et choisis sa photo.";
        feedback.classList.remove("success");
        return;
      }
      if (isTranslationMode) {
        words.push({ text, translation, image: null });
        wordInput.value = "";
        translationInput.value = "";
        feedback.textContent = "Mot et traduction ajoutés à ta liste !";
        feedback.classList.add("success");
        renderWordList();
        if (currentIndex === -1) chooseRandomWord();
        wordInput.focus();
        return;
      }
      if (!file.type.startsWith("image/")) {
        feedback.textContent = "Choisis un fichier image valide.";
        feedback.classList.remove("success");
        return;
      }

      const reader = new FileReader();
      reader.addEventListener("load", () => {
        if (typeof reader.result !== "string") {
          feedback.textContent = "Impossible de lire cette image. Essaie un autre fichier.";
          feedback.classList.remove("success");
          return;
        }
        words.push({ text, image: reader.result });
        wordInput.value = "";
        photoInput.value = "";
        uploadTitle.textContent = "Choisir une photo";
        feedback.textContent = "Mot ajouté à ta liste !";
        feedback.classList.add("success");
        renderWordList();
        if (currentIndex === -1) chooseRandomWord();
        wordInput.focus();
      });
      reader.addEventListener("error", () => {
        feedback.textContent = "Impossible de lire cette image. Essaie un autre fichier.";
        feedback.classList.remove("success");
      });
      reader.readAsDataURL(file);
    });

    photoInput.addEventListener("change", () => {
      uploadTitle.textContent = photoInput.files.length ? photoInput.files[0].name : "Choisir une photo";
    });

    entryMode.addEventListener("change", () => {
      const isTranslationMode = entryMode.value === "translation";
      translationField.hidden = !isTranslationMode;
      translationInput.disabled = !isTranslationMode;
      translationInput.required = isTranslationMode;
      photoField.hidden = isTranslationMode;
      photoInput.required = !isTranslationMode;
      feedback.textContent = "";
      feedback.classList.remove("success");
    });

    startButton.addEventListener("click", chooseRandomWord);
    nextButton.addEventListener("click", chooseRandomWord);
    autoButton.addEventListener("click", () => {
      if (autoInterval !== null) {
        stopAutoRotation();
        return;
      }
      chooseRandomWord();
      autoInterval = window.setInterval(chooseRandomWord, 2000);
      updateControls();
    });
    revealButton.addEventListener("click", () => {
      if (currentIndex < 0) return;
      answer.textContent = words[currentIndex].text;
      answer.classList.remove("hidden");
      answerVisible = true;
      updateControls();
    });
    clearButton.addEventListener("click", () => {
      stopAutoRotation();
      words.length = 0;
      currentIndex = -1;
      answer.textContent = "••••••";
      answer.classList.add("hidden");
      flashcard.innerHTML = '<span class="placeholder-icon" aria-hidden="true">🌿</span><p class="placeholder-title">Prêt·e à faire travailler ta mémoire ?</p><p class="placeholder-copy">Ajoute des photos ou des mots avec leur traduction, puis lance ta première session.</p>';
      feedback.textContent = "";
      renderWordList();
    });

    function stopAutoRotation() {
      if (autoInterval !== null) {
        window.clearInterval(autoInterval);
        autoInterval = null;
        updateControls();
      }
    }

    updateControls();
  
