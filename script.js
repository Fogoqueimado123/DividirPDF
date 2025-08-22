let selectedFiles = [];

const dropArea = document.getElementById("dropArea");
["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

["dragenter", "dragover"].forEach((eventName) => {
  dropArea.addEventListener(eventName, highlight, false);
});

["dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight() {
  dropArea.classList.add("highlight");
}

function unhighlight() {
  dropArea.classList.remove("highlight");
}

dropArea.addEventListener("drop", handleDrop, false);

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  handleFiles(files);
}

function handleFiles(files) {
  const newFiles = Array.from(files).filter(
    (file) => file.type === "application/pdf"
  );

  if (newFiles.length > 0) {
    const file = newFiles[0];
    if (!selectedFiles.some((f) => f.name === file.name)) {
      selectedFiles = [file];
      renderFileList();
      document.getElementById("pageRangeContainer").classList.remove("hidden");
      document.getElementById("pageRangeContainer").classList.add("visible");
    }
  }
}

document
  .getElementById("pdfInput")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!selectedFiles.some((f) => f.name === file.name)) {
      selectedFiles = [file];
      renderFileList();
      document.getElementById("pageRangeContainer").classList.remove("hidden");
      document.getElementById("pageRangeContainer").classList.add("visible");
    }
  });

function renderFileList() {
  const fileList = document.getElementById("fileList");
  fileList.innerHTML = "";

  if (selectedFiles.length === 0) {
    fileList.innerHTML =
      '<p style="text-align: center; color: #6c757d;">Nenhum arquivo selecionado</p>';
    return;
  }

  selectedFiles.forEach((file, index) => {
    const div = document.createElement("div");
    div.classList.add("file-item");

    div.innerHTML = `
                    <div class="file-info">
                        <i class="fas fa-file-pdf" style="color: #e63946; margin-right: 10px;"></i>
                        <span class="file-name" title="${file.name}">${file.name}</span>
                    </div>
                    <div class="file-actions">
                        <button onclick="removeFile(${index})" title="Remover arquivo">
                            <i class="fas fa-times"></i> Remover
                        </button>
                    </div>
                `;

    fileList.appendChild(div);
  });
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  renderFileList();
  if (selectedFiles.length === 0) {
    document.getElementById("pageRangeContainer").classList.remove("visible");
    document.getElementById("pageRangeContainer").classList.add("hidden");
  }
}

function showMessage(text, type = "info") {
  const messageElement = document.getElementById("message");
  messageElement.textContent = text;
  messageElement.className = "message " + type;
  messageElement.classList.remove("hidden");
  messageElement.classList.add("visible");

  // Auto-hide success messages after 5 seconds
  if (type === "success") {
    setTimeout(() => {
      messageElement.classList.remove("visible");
      messageElement.classList.add("hidden");
    }, 5000);
  }
}

document.getElementById("splitBtn").addEventListener("click", async () => {
  if (selectedFiles.length === 0) {
    showMessage("Selecione um arquivo PDF para dividir.", "error");
    return;
  }

  const pageRangeInput = document.getElementById("pageRange").value.trim();

  if (!pageRangeInput) {
    showMessage("Digite um intervalo de páginas.", "error");
    return;
  }

  const splitBtn = document.getElementById("splitBtn");
  const originalText = splitBtn.innerHTML;
  splitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
  splitBtn.disabled = true;

  // Hide any existing messages while processing
  document.getElementById("message").classList.add("hidden");

  try {
    const file = selectedFiles[0];
    const arrayBuffer = await file.arrayBuffer();

    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    const pageCount = pdfDoc.getPageCount();

    const pageNumbers = parsePageRange(pageRangeInput, pageCount);

    if (pageNumbers.length === 0) {
      showMessage("Nenhuma página válida foi especificada.", "error");
      splitBtn.innerHTML = originalText;
      splitBtn.disabled = false;
      return;
    }

    const newPdfDoc = await PDFLib.PDFDocument.create();

    for (const pageNumber of pageNumbers) {
      const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageNumber - 1]);
      newPdfDoc.addPage(copiedPage);
    }

    const pdfBytes = await newPdfDoc.save();

    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "documento_dividido.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => URL.revokeObjectURL(url), 100);

    showMessage("PDF dividido e baixado com sucesso!", "success");
    document.getElementById("reloadBtn").classList.remove("hidden");
    document.getElementById("reloadBtn").classList.add("visible");
  } catch (error) {
    console.error("Erro ao processar o PDF:", error);
    showMessage(
      "Ocorreu um erro ao processar o PDF. Verifique se o arquivo é válido.",
      "error"
    );
  } finally {
    splitBtn.innerHTML = originalText;
    splitBtn.disabled = false;
  }
});

document.getElementById("reloadBtn").addEventListener("click", () => {
  location.reload();
});

function parsePageRange(range, totalPages) {
  const pages = new Set();

  range.split(",").forEach((part) => {
    part = part.trim();
    if (!part) return;

    if (part.includes("-")) {
      const [start, end] = part.split("-").map((num) => parseInt(num.trim()));

      if (isNaN(start)) return;

      const finalEnd = isNaN(end) ? start : Math.min(end, totalPages);

      for (let i = Math.max(1, start); i <= finalEnd; i++) {
        if (i <= totalPages) pages.add(i);
      }
    } else {
      const pageNum = parseInt(part);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        pages.add(pageNum);
      }
    }
  });

  return Array.from(pages).sort((a, b) => a - b);
}

document.getElementById("pageRange").addEventListener("focus", function () {
  this.placeholder = "Ex: 1-3,5,7-10";
});

document.getElementById("pageRange").addEventListener("blur", function () {
  this.placeholder = "Digite o intervalo de páginas";
});

renderFileList();
